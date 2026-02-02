import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditStatus } from '@prisma/client';

export class QueryAuditsDto {
    @ApiPropertyOptional({ description: 'Filtrar por ID de bodega' })
    @IsOptional()
    @IsString()
    warehouseId?: string;

    @ApiPropertyOptional({
        description: 'Filtrar por estado',
        enum: AuditStatus,
    })
    @IsOptional()
    @IsEnum(AuditStatus)
    status?: AuditStatus;
}
