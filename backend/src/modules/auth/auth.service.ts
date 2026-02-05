import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/database/index.js';
import { RegisterDto } from './dto/index.js';

export interface TenantWithRole {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface JwtPayload {
  sub: string; // userId
  email: string;
  tenantId?: string;
  role?: string;
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  tenants: TenantWithRole[];
}

export interface RegisterResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  tenant: TenantWithRole;
}

export interface ValidatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  tenants: TenantWithRole[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Register a new user with their own tenant
   */
  async register(registerDto: RegisterDto): Promise<RegisterResult> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash password
    const passwordHash = await this.hashPassword(registerDto.password);

    // Generate slug from company name
    const slug = this.generateSlug(registerDto.companyName);

    // Check if slug already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new ConflictException(
        'Ya existe una empresa con un nombre similar. Por favor elige otro nombre.',
      );
    }

    // Create user and tenant in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the tenant first
      const tenant = await tx.tenant.create({
        data: {
          name: registerDto.companyName,
          slug,
          businessType: 'RETAIL', // Default, can be changed later
          isActive: true,
        },
      });

      // Create the user
      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          passwordHash,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          isActive: true,
        },
      });

      // Create the tenant-user relationship with OWNER role
      await tx.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'OWNER',
          isActive: true,
        },
      });

      // Create a default warehouse for the tenant
      await tx.warehouse.create({
        data: {
          tenantId: tenant.id,
          name: 'Almacén Principal',
          code: 'ALM-001',
          isDefault: true,
          isActive: true,
        },
      });

      return { user, tenant };
    });

    this.logger.log(
      `New user registered: ${result.user.email} with tenant: ${result.tenant.name}`,
    );

    // Generate JWT token
    const payload: JwtPayload = {
      sub: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: 'OWNER',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        role: 'OWNER',
      },
    };
  }

  /**
   * Validates user credentials
   * DEV MODE: If bcrypt fails, tries plain text comparison for seed data
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<ValidatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user) {
      this.logger.warn(`Login attempt for non-existent user: ${email}`);
      return null;
    }

    if (!user.isActive) {
      this.logger.warn(`Login attempt for inactive user: ${email}`);
      return null;
    }

    // Try bcrypt comparison first (production hashes)
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.passwordHash);
    } catch {
      // bcrypt.compare throws if hash is not valid bcrypt format
      this.logger.debug(
        `Password hash is not bcrypt format for user: ${email}`,
      );
    }

    // DEV MODE FALLBACK: Only when explicitly enabled
    // Requires ALLOW_DEV_PASSWORDS=true in environment
    if (!isValidPassword && process.env.ALLOW_DEV_PASSWORDS === 'true') {
      // Check if hash starts with "hashed_" and contains the password
      if (user.passwordHash.startsWith(`hashed_${password}_`)) {
        this.logger.warn(
          `⚠️  DEV MODE: Plain text password match for ${email}. Update to bcrypt hash!`,
        );
        isValidPassword = true;
      }
    }

    if (!isValidPassword) {
      this.logger.warn(`Invalid password for user: ${email}`);
      return null;
    }

    // Return user without password
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  /**
   * Generates JWT token for authenticated user
   * Now includes tenant information
   */
  async login(user: ValidatedUser): Promise<LoginResult> {
    // Fetch user's tenants with roles
    const tenantUsers = await this.prisma.tenantUser.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    });

    // Filter only active tenants
    const tenants: TenantWithRole[] = tenantUsers
      .filter((tu) => tu.tenant.isActive)
      .map((tu) => ({
        id: tu.tenant.id,
        name: tu.tenant.name,
        slug: tu.tenant.slug,
        role: tu.role,
      }));

    // Create JWT payload (without tenant for now, client will select)
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    // If user has only one tenant, include it in the token
    if (tenants.length === 1) {
      payload.tenantId = tenants[0].id;
      payload.role = tenants[0].role;
    }

    const accessToken = this.jwtService.sign(payload);

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLogins: 0 },
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenants,
    };
  }

  /**
   * Get user profile with tenants
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        tenants: {
          where: { isActive: true },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tenants: TenantWithRole[] = user.tenants
      .filter((tu) => tu.tenant.isActive)
      .map((tu) => ({
        id: tu.tenant.id,
        name: tu.tenant.name,
        slug: tu.tenant.slug,
        role: tu.role,
      }));

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      tenants,
    };
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Generate a URL-friendly slug from a string
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
      .substring(0, 100); // Limit length
  }
}
