// backend/src/modules/auth/auth.service.ts
import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException,
  NotFoundException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ERROR_CODES } from '../../common/constants/error-codes.constants';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Get user's locations for managers/staff
    if (user.role !== 'ADMIN') {
      const certifications = await this.prisma.certification.findMany({
        where: { userId: user.id },
        select: { locationId: true },
      });
      payload.locations = certifications.map(c => c.locationId);
    }

    return {
      success: true,
      data: {
        accessToken: this.jwtService.sign(payload),
        refreshToken: this.generateRefreshToken(user.id),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException({
        success: false,
        error: {
          code: ERROR_CODES.USER_ALREADY_EXISTS,
          message: 'User with this email already exists',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role: 'STAFF', // Default role
        notificationPrefs: {
          inApp: true,
          email: false,
          push: false,
        },
      },
    });

    const { password: _, ...result } = user;

    return {
      success: true,
      data: result,
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token (in a real app, store these in database)
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET') || 'refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      return {
        success: true,
        data: {
          accessToken: this.jwtService.sign(newPayload),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: ERROR_CODES.TOKEN_EXPIRED,
          message: 'Invalid or expired refresh token',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('REFRESH_TOKEN_SECRET') || 'refresh-secret',
        expiresIn: '7d',
      }
    );
  }
}