import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsUUID,
    IsDateString,
    IsArray,
    ValidateNested,
    Min,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Item received in goods receipt
 */
export class ReceiveGoodsItemDto {
    @ApiProperty({
        description: 'ID del producto',
        example: 'uuid-product',
    })
    @IsUUID('4', { message: 'productId debe ser un UUID válido' })
    @IsNotEmpty()
    productId: string;

    @ApiProperty({
        description: 'Cantidad recibida',
        example: 100,
        minimum: 0.01,
    })
    @IsNumber({}, { message: 'quantityReceived debe ser un número' })
    @Min(0.01, { message: 'quantityReceived debe ser mayor a 0' })
    quantityReceived: number;

    @ApiProperty({
        description: 'Costo unitario REAL (puede diferir del precio de la orden)',
        example: 5.25,
        minimum: 0,
    })
    @IsNumber({}, { message: 'unitCost debe ser un número' })
    @Min(0, { message: 'unitCost no puede ser negativo' })
    unitCost: number;

    @ApiPropertyOptional({
        description: 'Número de lote (se genera automáticamente si no se proporciona)',
        example: 'LOT-2026-001',
        maxLength: 100,
    })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    batchNumber?: string;

    @ApiPropertyOptional({
        description: 'Fecha de vencimiento del lote',
        example: '2027-06-15T00:00:00.000Z',
    })
    @IsDateString({}, { message: 'expiresAt debe ser una fecha válida ISO 8601' })
    @IsOptional()
    expiresAt?: string;
}

/**
 * DTO for receiving goods from a Purchase Order
 * This is the KEY operation that:
 * 1. Creates Batches for each item
 * 2. Creates InventoryMovements
 * 3. Updates PurchaseOrder status
 * 4. Creates AccountPayable automatically
 */
export class ReceiveGoodsDto {
    @ApiProperty({
        description: 'ID de la bodega donde se recibe la mercancía',
        example: 'uuid-warehouse',
    })
    @IsUUID('4', { message: 'warehouseId debe ser un UUID válido' })
    @IsNotEmpty({ message: 'warehouseId es requerido' })
    warehouseId: string;

    @ApiProperty({
        description: 'Ítems recibidos',
        type: [ReceiveGoodsItemDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReceiveGoodsItemDto)
    items: ReceiveGoodsItemDto[];

    @ApiPropertyOptional({
        description: 'Número de factura del proveedor',
        example: 'FAC-PROV-001',
        maxLength: 100,
    })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    invoiceNumber?: string;

    @ApiPropertyOptional({
        description: 'Notas de la recepción',
    })
    @IsString()
    @IsOptional()
    notes?: string;
}
