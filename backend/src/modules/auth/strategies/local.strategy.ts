// backend/src/modules/auth/strategies/local.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    
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
    
    return user;
  }
}