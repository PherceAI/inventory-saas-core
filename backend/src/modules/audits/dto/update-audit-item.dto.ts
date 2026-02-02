import { IsNumber, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAuditItemDto {
    @ApiProperty({
        description: 'Cantidad contada físicamente',
        example: 45.5,
    })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    quantityCounted: number;

    @ApiPropertyOptional({
        description: 'Notas sobre la diferencia o el ítem',
        example: 'Producto dañado encontrado',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}
