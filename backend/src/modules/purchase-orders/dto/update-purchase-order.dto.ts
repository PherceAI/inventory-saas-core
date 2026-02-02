import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt, Min, MaxLength } from 'class-validator';

/**
 * DTO for updating a Purchase Order (DRAFT status only)
 */
export class UpdatePurchaseOrderDto {
    @ApiPropertyOptional({
        description: 'Fecha esperada de recepción',
        example: '2026-02-15T00:00:00.000Z',
    })
    @IsDateString({}, { message: 'expectedAt debe ser una fecha válida ISO 8601' })
    @IsOptional()
    expectedAt?: string;

    @ApiPropertyOptional({
        description: 'Días de crédito para pago',
        example: 30,
        minimum: 0,
    })
    @IsInt()
    @IsOptional()
    @Min(0)
    paymentTermDays?: number;

    @ApiPropertyOptional({
        description: 'Moneda',
        example: 'USD',
    })
    @IsString()
    @IsOptional()
    @MaxLength(3)
    currency?: string;

    @ApiPropertyOptional({
        description: 'Notas adicionales',
    })
    @IsString()
    @IsOptional()
    notes?: string;
}
