import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/index.js';
import { QueryPayablesDto, RegisterPaymentDto, PayableStatusFilter } from './dto/index.js';
import { PayableStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Summary of accounts payable by status
 */
export interface PayableSummary {
    current: { count: number; total: Decimal };
    dueSoon: { count: number; total: Decimal };
    overdue: { count: number; total: Decimal };
    paid: { count: number; total: Decimal };
}

@Injectable()
export class AccountsPayableService {
    private readonly logger = new Logger(AccountsPayableService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * List accounts payable with filters and pagination
     */
    async findAll(tenantId: string, query: QueryPayablesDto) {
        const { status, supplierId, dueDateFrom, dueDateTo, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AccountPayableWhereInput = { tenantId };

        if (status) {
            where.status = status as PayableStatus;
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        if (dueDateFrom || dueDateTo) {
            where.dueDate = {};
            if (dueDateFrom) {
                where.dueDate.gte = new Date(dueDateFrom);
            }
            if (dueDateTo) {
                where.dueDate.lte = new Date(dueDateTo);
            }
        }

        const [payables, total] = await Promise.all([
            this.prisma.accountPayable.findMany({
                where,
                skip,
                take: limit,
                orderBy: { dueDate: 'asc' },
                include: {
                    supplier: { select: { id: true, name: true } },
                    purchaseOrder: { select: { id: true, orderNumber: true } },
                    _count: { select: { payments: true } },
                },
            }),
            this.prisma.accountPayable.count({ where }),
        ]);

        return {
            data: payables,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get single account payable with payments
     */
    async findOne(tenantId: string, id: string) {
        const payable = await this.prisma.accountPayable.findFirst({
            where: { id, tenantId },
            include: {
                supplier: { select: { id: true, name: true, email: true } },
                purchaseOrder: { select: { id: true, orderNumber: true } },
                payments: {
                    orderBy: { paidAt: 'desc' },
                },
            },
        });

        if (!payable) {
            throw new NotFoundException('Cuenta por pagar no encontrada');
        }

        return payable;
    }

    /**
     * Register a payment (partial or full)
     */
    async registerPayment(tenantId: string, payableId: string, dto: RegisterPaymentDto) {
        this.logger.log(`Registering payment of ${dto.amount} for payable ${payableId}`);

        const payable = await this.prisma.accountPayable.findFirst({
            where: { id: payableId, tenantId },
        });

        if (!payable) {
            throw new NotFoundException('Cuenta por pagar no encontrada');
        }

        if (payable.status === PayableStatus.PAID) {
            throw new BadRequestException('Esta cuenta ya está pagada');
        }

        const paymentAmount = new Decimal(dto.amount);

        if (paymentAmount.gt(payable.balanceAmount)) {
            throw new BadRequestException(
                `El monto del pago (${dto.amount}) excede el saldo pendiente (${payable.balanceAmount})`,
            );
        }

        // Calculate new amounts
        const newPaidAmount = payable.paidAmount.add(paymentAmount);
        const newBalanceAmount = payable.balanceAmount.sub(paymentAmount);
        const isFullyPaid = newBalanceAmount.lte(0);

        // Execute transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create payment record
            const payment = await tx.paymentRecord.create({
                data: {
                    payableId,
                    amount: paymentAmount,
                    currency: payable.currency,
                    paymentMethod: dto.paymentMethod,
                    reference: dto.reference,
                    paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
                    notes: dto.notes,
                },
            });

            // Update account payable
            const updatedPayable = await tx.accountPayable.update({
                where: { id: payableId },
                data: {
                    paidAmount: newPaidAmount,
                    balanceAmount: newBalanceAmount,
                    status: isFullyPaid ? PayableStatus.PAID : undefined,
                    paidAt: isFullyPaid ? new Date() : undefined,
                },
                include: {
                    supplier: { select: { id: true, name: true } },
                    payments: {
                        orderBy: { paidAt: 'desc' },
                    },
                },
            });

            return { payment, payable: updatedPayable };
        });

        this.logger.log(
            `Payment registered for ${payableId}. New balance: ${result.payable.balanceAmount}`,
        );

        return result;
    }

    /**
     * Get summary of payables by status
     */
    async getSummary(tenantId: string): Promise<PayableSummary> {
        const statuses = [
            PayableStatus.CURRENT,
            PayableStatus.DUE_SOON,
            PayableStatus.OVERDUE,
            PayableStatus.PAID,
        ];

        const results = await Promise.all(
            statuses.map(async (status) => {
                const aggregate = await this.prisma.accountPayable.aggregate({
                    where: { tenantId, status },
                    _count: true,
                    _sum: { balanceAmount: true },
                });

                return {
                    status,
                    count: aggregate._count,
                    total: aggregate._sum.balanceAmount || new Decimal(0),
                };
            }),
        );

        return {
            current: { count: results[0].count, total: results[0].total },
            dueSoon: { count: results[1].count, total: results[1].total },
            overdue: { count: results[2].count, total: results[2].total },
            paid: { count: results[3].count, total: results[3].total },
        };
    }

    /**
     * Update payable statuses based on due dates
     * This should be called by a cron job daily
     */
    async updatePayableStatuses(tenantId: string) {
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        // Update OVERDUE: dueDate < now
        const overdueUpdated = await this.prisma.accountPayable.updateMany({
            where: {
                tenantId,
                status: { notIn: [PayableStatus.PAID, PayableStatus.OVERDUE] },
                dueDate: { lt: now },
            },
            data: { status: PayableStatus.OVERDUE },
        });

        // Update DUE_SOON: dueDate <= now + 7 days AND dueDate > now
        const dueSoonUpdated = await this.prisma.accountPayable.updateMany({
            where: {
                tenantId,
                status: PayableStatus.CURRENT,
                dueDate: { lte: sevenDaysFromNow, gt: now },
            },
            data: { status: PayableStatus.DUE_SOON },
        });

        this.logger.log(
            `Updated payable statuses: ${overdueUpdated.count} overdue, ${dueSoonUpdated.count} due soon`,
        );

        return { overdueUpdated: overdueUpdated.count, dueSoonUpdated: dueSoonUpdated.count };
    }
}
