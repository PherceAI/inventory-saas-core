import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditDto {
    @ApiProperty({
        description: 'ID de la bodega a auditar',
        example: 'uuid-warehouse-id',
    })
    @IsUUID()
    @IsNotEmpty()
    warehouseId: string;

    @ApiProperty({
        description: 'Nombre o referencia de la auditoría',
        example: 'Auditoría Mensual Enero 2026',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Fecha programada (opcional)',
        example: '2026-02-01T00:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    scheduledAt?: string;

    @ApiPropertyOptional({
        description: 'Notas adicionales',
        example: 'Conteo ciego de pasillo A',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}
