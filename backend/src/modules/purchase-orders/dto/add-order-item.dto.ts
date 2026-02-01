import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsUUID,
    Min,
} from 'class-validator';

/**
 * DTO for adding an item to a Purchase Order
 */
export class AddOrderItemDto {
    @ApiProperty({
        description: 'ID del producto',
        example: 'uuid-product',
    })
    @IsUUID('4', { message: 'productId debe ser un UUID válido' })
    @IsNotEmpty({ message: 'productId es requerido' })
    productId: string;

    @ApiProperty({
        description: 'Cantidad a ordenar',
        example: 100,
        minimum: 0.01,
    })
    @IsNumber({}, { message: 'quantityOrdered debe ser un número' })
    @Min(0.01, { message: 'quantityOrdered debe ser mayor a 0' })
    quantityOrdered: number;

    @ApiProperty({
        description: 'Precio unitario acordado con el proveedor',
        example: 5.50,
        minimum: 0,
    })
    @IsNumber({}, { message: 'unitPrice debe ser un número' })
    @Min(0, { message: 'unitPrice no puede ser negativo' })
    unitPrice: number;

    @ApiPropertyOptional({
        description: 'Descuento por unidad',
        example: 0.10,
        default: 0,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    discount?: number;

    @ApiPropertyOptional({
        description: 'Tasa de impuesto (ej: 0.12 = 12%)',
        example: 0.12,
        default: 0,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    taxRate?: number;

    @ApiPropertyOptional({
        description: 'Notas del ítem',
    })
    @IsString()
    @IsOptional()
    notes?: string;
}
