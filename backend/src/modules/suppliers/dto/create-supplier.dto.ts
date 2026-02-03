import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Razón Social o Nombre del Proveedor', example: 'Distribuidora La Favorita S.A.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'RUC (Ecuador: 13 dígitos) / Identificación Fiscal',
    example: '1790016919001',
  })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Nombre de la persona de contacto',
    example: 'María González',
  })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico de contacto/pedidos',
    example: 'pedidos@favorita.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '+593 99 123 4567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Dirección física / Matriz', example: 'Av. Amazonas y Naciones Unidas' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Días de crédito (Término de pago)', example: 30, default: 30 })
  @IsOptional()
  paymentTermDays?: number;

  @ApiPropertyOptional({ description: 'Moneda por defecto', example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Código interno (Autogenerado si está vacío)', example: 'FAV-001' })
  @IsString()
  @IsOptional()
  code?: string;
}
