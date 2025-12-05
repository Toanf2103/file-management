import { Controller, Post, Body, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard sẽ redirect đến Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const googleProfile = req.user as any;
      const result = await this.authService.googleLogin({
        googleId: googleProfile.googleId,
        email: googleProfile.email,
        fullName: googleProfile.fullName,
        avatar: googleProfile.avatar,
      });

      // Redirect về frontend với token
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';
      const redirectUrl = `${frontendUrl}/login?token=${result.access_token}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      // Redirect về frontend với error
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';
      const errorMessage = error.message || 'Đăng nhập thất bại';
      const redirectUrl = `${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`;
      
      res.redirect(redirectUrl);
    }
  }
}

