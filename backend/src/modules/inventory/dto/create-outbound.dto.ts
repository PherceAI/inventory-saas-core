import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';

/**
 * Razones válidas para salida de inventario
 */
export enum OutboundReason {
  SALE = 'SALE', // Venta a cliente
  CONSUME = 'CONSUME', // Consumo interno (hotel/restaurante)
  TRANSFER = 'TRANSFER', // Traslado a otra bodega
  ADJUSTMENT = 'ADJUSTMENT', // Ajuste por auditoría
}

/**
 * DTO for registering outbound inventory movement (stock exit)
 * Uses FIFO logic to consume from oldest batches first
 */
export class CreateOutboundMovementDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 'uuid-product',
  })
  @IsUUID('4', { message: 'productId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'productId es requerido' })
  productId: string;

  @ApiProperty({
    description: 'ID de la bodega origen',
    example: 'uuid-warehouse',
  })
  @IsUUID('4', { message: 'warehouseId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'warehouseId es requerido' })
  warehouseId: string;

  @ApiProperty({
    description: 'Cantidad a egresar (debe ser mayor a 0)',
    example: 25,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'quantity debe ser un número' })
  @Min(0.01, { message: 'quantity debe ser mayor a 0' })
  quantity: number;

  @ApiProperty({
    description: 'Razón de la salida',
    enum: OutboundReason,
    example: OutboundReason.SALE,
  })
  @IsEnum(OutboundReason, {
    message: 'reason debe ser: SALE, CONSUME, TRANSFER o ADJUSTMENT',
  })
  @IsNotEmpty({ message: 'reason es requerido' })
  reason: OutboundReason;

  @ApiPropertyOptional({
    description:
      'ID o referencia del documento relacionado (factura, orden, etc)',
    example: 'FAC-001',
  })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de destino (para reportes)',
    example: 'KITCHEN',
  })
  @IsString()
  @IsOptional()
  destinationType?: string;

  @ApiPropertyOptional({
    description: 'Referencia del destino (habitación, mesa, cliente)',
    example: 'HAB-502',
  })
  @IsString()
  @IsOptional()
  destinationRef?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
    example: 'Consumo para evento especial',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
