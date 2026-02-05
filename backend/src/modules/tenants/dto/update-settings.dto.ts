import { IsString, IsOptional, IsEmail, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class CompanyProfileDto {
    @ApiPropertyOptional({ description: 'Razón Social o Nombre Legal' })
    @IsOptional()
    @IsString()
    legalName?: string;

    @ApiPropertyOptional({ description: 'RUC (Ecuador: 13 dígitos)' })
    @IsOptional()
    @IsString()
    taxId?: string;

    @ApiPropertyOptional({ description: 'Dirección Matriz/Fiscal' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Teléfono de contacto' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: 'Email de contacto (para documentos)' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'URL del logo de la empresa' })
    @IsOptional()
    @IsString()
    logoUrl?: string;

    @ApiPropertyOptional({ description: 'Color de marca principal (Hex)' })
    @IsOptional()
    @IsString()
    brandColor?: string;
}

class LocalizationSettingsDto {
    @ApiPropertyOptional({ description: 'Moneda por defecto', default: 'USD' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional({ description: 'Zona Horaria', default: 'America/Guayaquil' })
    @IsOptional()
    @IsString()
    timezone?: string;
}

export class UpdateTenantSettingsDto {
    @ApiPropertyOptional({ type: CompanyProfileDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => CompanyProfileDto)
    profile?: CompanyProfileDto;

    @ApiPropertyOptional({ type: LocalizationSettingsDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => LocalizationSettingsDto)
    localization?: LocalizationSettingsDto;
}
