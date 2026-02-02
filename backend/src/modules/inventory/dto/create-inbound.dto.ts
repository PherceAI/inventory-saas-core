import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * DTO for registering inbound inventory movement (stock entry)
 * Creates a new Batch and InventoryMovement record
 */
export class CreateInboundMovementDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 'uuid-product',
  })
  @IsUUID('4', { message: 'productId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'productId es requerido' })
  productId: string;

  @ApiProperty({
    description: 'ID de la bodega destino',
    example: 'uuid-warehouse',
  })
  @IsUUID('4', { message: 'warehouseId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'warehouseId es requerido' })
  warehouseId: string;

  @ApiProperty({
    description: 'Cantidad a ingresar (debe ser mayor a 0)',
    example: 100,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'quantity debe ser un número' })
  @Min(0.01, { message: 'quantity debe ser mayor a 0' })
  quantity: number;

  @ApiProperty({
    description: 'Costo unitario del lote (puede ser 0 para donaciones)',
    example: 0.5,
    minimum: 0,
  })
  @IsNumber({}, { message: 'unitCost debe ser un número' })
  @Min(0, { message: 'unitCost no puede ser negativo' })
  unitCost: number;

  @ApiPropertyOptional({
    description:
      'Número de lote. Si no se proporciona, se genera automáticamente',
    example: 'LOT-2026-001',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  batchNumber?: string;

  @ApiPropertyOptional({
    description: 'Fecha de vencimiento del lote (ISO 8601)',
    example: '2027-06-15T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'expiresAt debe ser una fecha válida ISO 8601' })
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'ID del proveedor',
    example: 'uuid-supplier',
  })
  @IsUUID('4', { message: 'supplierId debe ser un UUID válido' })
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
    example: 'Ingreso por orden de compra PO-001',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
