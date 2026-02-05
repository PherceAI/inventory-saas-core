import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsUUID,
    IsArray,
    ValidateNested,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
    @ApiProperty({ description: 'ID del producto' })
    @IsUUID('4', { message: 'productId debe ser un UUID válido' })
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ description: 'Cantidad a trasladar' })
    @IsNumber()
    @Min(0.01)
    quantity: number;
}

export class CreateTransferDto {
    @ApiProperty({ description: 'ID de la bodega de origen' })
    @IsUUID('4', { message: 'originWarehouseId debe ser un UUID válido' })
    @IsNotEmpty()
    originWarehouseId: string;

    @ApiProperty({ description: 'ID de la bodega de destino' })
    @IsUUID('4', { message: 'destinationWarehouseId debe ser un UUID válido' })
    @IsNotEmpty()
    destinationWarehouseId: string;

    @ApiProperty({ type: [TransferItemDto], description: 'Lista de productos a trasladar' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TransferItemDto)
    items: TransferItemDto[];

    @ApiPropertyOptional({ description: 'Notas adicionales' })
    @IsString()
    @IsOptional()
    notes?: string;
}
