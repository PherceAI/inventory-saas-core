import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/database/index.js';

export interface JwtPayload {
  sub: string; // userId
  email: string;
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ValidatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

    // DEV MODE FALLBACK: Check if seed data matches plain text pattern
    // The seed uses: `hashed_${password}_${timestamp}`
    if (!isValidPassword && process.env.NODE_ENV !== 'production') {
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
   */
  async login(user: ValidatedUser): Promise<LoginResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Hash a password using bcrypt
   * Use this to generate proper hashes for updating seed data
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
