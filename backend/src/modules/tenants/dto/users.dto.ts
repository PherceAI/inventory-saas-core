
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TenantRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    OPERATOR = 'OPERATOR',
    Viewer = 'VIEWER'
}

export class InviteUserDto {
    @ApiProperty({ example: 'empleado@empresa.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Juan' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Pérez' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'OPERATOR', enum: TenantRole })
    @IsEnum(TenantRole)
    role: TenantRole;

    @ApiProperty({ example: 'password123', description: 'Initial password for new users' })
    @IsString()
    @MinLength(6)
    password: string;
}

export class UpdateUserRoleDto {
    @ApiProperty({ example: 'MANAGER', enum: TenantRole })
    @IsEnum(TenantRole)
    role: TenantRole;
}
