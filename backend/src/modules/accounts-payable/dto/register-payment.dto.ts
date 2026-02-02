import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsDateString,
    Min,
    MaxLength,
} from 'class-validator';

/**
 * DTO for registering a payment on an account payable
 */
export class RegisterPaymentDto {
    @ApiProperty({
        description: 'Monto del pago',
        example: 500.00,
        minimum: 0.01,
    })
    @IsNumber({}, { message: 'amount debe ser un número' })
    @Min(0.01, { message: 'amount debe ser mayor a 0' })
    amount: number;

    @ApiProperty({
        description: 'Método de pago',
        example: 'TRANSFER',
        enum: ['CASH', 'TRANSFER', 'CHECK', 'CARD'],
    })
    @IsString()
    @IsNotEmpty({ message: 'paymentMethod es requerido' })
    @MaxLength(50)
    paymentMethod: string;

    @ApiPropertyOptional({
        description: 'Referencia del pago (número de transferencia, cheque, etc)',
        example: 'TRF-2026-001234',
        maxLength: 255,
    })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    reference?: string;

    @ApiPropertyOptional({
        description: 'Fecha del pago (default: ahora)',
        example: '2026-01-28T15:00:00.000Z',
    })
    @IsDateString()
    @IsOptional()
    paidAt?: string;

    @ApiPropertyOptional({
        description: 'Notas adicionales',
    })
    @IsString()
    @IsOptional()
    notes?: string;
}
