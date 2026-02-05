import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/database/index.js';

interface JwtPayload {
  sub: string; // userId
  email: string;
  iat?: number; // issued at
  exp?: number; // expiration
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // SECURITY: Require explicit JWT_SECRET - no fallback allowed
      secretOrKey: configService.get<string>('JWT_SECRET') || (() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET must be configured in production');
        }
        return 'dev-secret-only-for-local-development';
      })(),
    });
  }

  /**
   * Validates the JWT payload and returns the user info
   * This is called automatically by Passport after token verification
   */
  async validate(payload: JwtPayload) {
    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user object - this will be attached to request.user
    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
