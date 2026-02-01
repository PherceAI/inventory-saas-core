import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsUUID,
    IsDateString,
    IsInt,
    Min,
    MaxLength,
} from 'class-validator';

/**
 * DTO for creating a new Purchase Order (draft)
 */
export class CreatePurchaseOrderDto {
    @ApiProperty({
        description: 'ID del proveedor',
        example: 'uuid-supplier',
    })
    @IsUUID('4', { message: 'supplierId debe ser un UUID válido' })
    @IsNotEmpty({ message: 'supplierId es requerido' })
    supplierId: string;

    @ApiPropertyOptional({
        description: 'Número de orden (se genera automáticamente si no se proporciona)',
        example: 'PO-2026-001',
        maxLength: 50,
    })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    orderNumber?: string;

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
        default: 'USD',
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
