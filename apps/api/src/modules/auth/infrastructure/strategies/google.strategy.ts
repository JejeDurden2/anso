import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

import { AuthService } from '../../application/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService
  ) {
    const apiUrl = configService.get<string>('API_URL');
    const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    // In production, use API_URL for callback; in dev, use frontend URL (Vite proxies /api)
    const baseUrl = apiUrl || frontendUrl;

    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${baseUrl}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<void> {
    const { id, emails, displayName, photos } = profile;

    const user = await this.authService.validateOrCreateUser({
      googleId: id,
      email: emails?.[0]?.value || '',
      name: displayName || null,
      avatarUrl: photos?.[0]?.value || null,
    });

    done(null, user);
  }
}
