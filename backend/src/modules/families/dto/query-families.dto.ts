import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * DTO for querying product families
 */
export class QueryFamiliesDto {
    @ApiPropertyOptional({
        description: 'Búsqueda por nombre',
        example: 'cocoa',
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({
        description: 'Incluir familias inactivas',
        default: false,
    })
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @IsOptional()
    includeInactive?: boolean;

    @ApiPropertyOptional({
        description: 'Página',
        default: 1,
        minimum: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({
        description: 'Límite por página',
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number;
}

