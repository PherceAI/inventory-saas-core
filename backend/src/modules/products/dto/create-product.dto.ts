import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'SKU único del producto',
    example: 'VOD-GREY-750',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El SKU es requerido' })
  @MaxLength(100)
  sku: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Vodka Grey Goose 750ml',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del producto',
    example: 'Vodka premium francés',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID de la categoría del producto',
    example: 'uuid-de-categoria',
  })
  @IsUUID('4', { message: 'categoryId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La categoría es requerida' })
  categoryId: string;

  @ApiPropertyOptional({
    description: 'ID de la familia del producto (para conversiones)',
    example: 'uuid-de-familia',
  })
  @IsUUID('4', { message: 'familyId debe ser un UUID válido' })
  @IsOptional()
  familyId?: string;

  @ApiPropertyOptional({
    description: 'Código de barras',
    example: '7501234567890',
  })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({
    description: 'Stock mínimo para alertas',
    example: 5,
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stockMin?: number;

  @ApiPropertyOptional({
    description: 'Stock ideal recomendado',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stockIdeal?: number;

  @ApiPropertyOptional({
    description: 'Stock máximo',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stockMax?: number;

  @ApiPropertyOptional({
    description: 'Precio de costo promedio',
    example: 25.5,
    minimum: 0,
    default: 0,
  })
  @IsNumber({}, { message: 'costAverage debe ser un número' })
  @IsOptional()
  @Min(0, { message: 'costAverage no puede ser negativo' })
  costAverage?: number;

  @ApiPropertyOptional({
    description: 'Precio de venta por defecto',
    example: 35.0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'priceDefault debe ser un número' })
  @IsOptional()
  @Min(0, { message: 'priceDefault no puede ser negativo' })
  priceDefault?: number;

  @ApiPropertyOptional({
    description: 'Es un servicio (no maneja stock)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isService?: boolean;

  @ApiPropertyOptional({
    description: 'Maneja fecha de vencimiento',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasExpiry?: boolean;

  @ApiPropertyOptional({
    description: 'Rastrea por lotes',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  trackBatches?: boolean;

  @ApiPropertyOptional({
    description: 'Producto activo',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
