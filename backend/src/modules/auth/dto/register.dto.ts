import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        description: 'Email del usuario',
        example: 'usuario@empresa.com',
    })
    @IsEmail({}, { message: 'Debe ser un email válido' })
    @IsNotEmpty({ message: 'El email es requerido' })
    email: string;

    @ApiProperty({
        description: 'Contraseña del usuario',
        example: 'miPassword123',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @ApiProperty({
        description: 'Nombre del usuario',
        example: 'Juan',
    })
    @IsString()
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @MaxLength(100)
    firstName: string;

    @ApiProperty({
        description: 'Apellido del usuario',
        example: 'Pérez',
    })
    @IsString()
    @IsNotEmpty({ message: 'El apellido es requerido' })
    @MaxLength(100)
    lastName: string;

    @ApiProperty({
        description: 'Nombre de la empresa/tenant a crear',
        example: 'Mi Empresa S.A.',
    })
    @IsString()
    @IsNotEmpty({ message: 'El nombre de la empresa es requerido' })
    @MaxLength(255)
    companyName: string;
}
