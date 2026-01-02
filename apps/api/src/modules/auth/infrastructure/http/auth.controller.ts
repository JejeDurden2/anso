import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

import { JwtAuthGuard } from '@/shared/infrastructure/guards';

import { AuthService } from '../../application/auth.service';

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

interface RefreshTokenDto {
  refreshToken?: string;
}

@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  private getCookieOptions(maxAge: number): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
    maxAge: number;
  } {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge,
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    const user = req.user;
    const { accessToken, refreshToken } = await this.authService.generateTokenPair(user);

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173'
    );

    // Set HTTP-only cookies
    res.cookie('access_token', accessToken, this.getCookieOptions(15 * 60 * 1000)); // 15 minutes
    res.cookie('refresh_token', refreshToken, this.getCookieOptions(30 * 24 * 60 * 60 * 1000)); // 30 days

    res.redirect(`${frontendUrl}/app`);
  }

  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: RefreshTokenDto
  ): Promise<void> {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refresh_token || body.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshAccessToken(refreshToken);

      // Set new cookies
      res.cookie('access_token', accessToken, this.getCookieOptions(15 * 60 * 1000));
      res.cookie('refresh_token', newRefreshToken, this.getCookieOptions(30 * 24 * 60 * 60 * 1000));

      res.json({
        success: true,
        data: { accessToken },
      });
    } catch {
      // Clear cookies on refresh failure
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/' });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    res.json({ success: true, data: null });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: AuthenticatedRequest): Promise<{
    success: boolean;
    data: AuthenticatedUser;
  }> {
    const user = await this.authService.getUserById(req.user.id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }
}
