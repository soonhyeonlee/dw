import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { success: true, data };
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto.email, dto.password);
    return { success: true, data };
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('social')
  async socialLogin(
    @Body()
    dto: {
      provider: string;
      providerId: string;
      email: string;
      nickname: string;
      profileImage?: string;
    },
  ) {
    const data = await this.authService.socialLogin(dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
    return { success: true, message: '비밀번호가 변경되었습니다' };
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('reset-password')
  async resetPassword(@Body('email') email: string) {
    const data = await this.authService.resetPassword(email);
    return { success: true, ...data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('push-token')
  async updatePushToken(
    @Request() req,
    @Body('pushToken') pushToken: string,
  ) {
    await this.usersService.updatePushToken(req.user.id, pushToken);
    return { success: true };
  }
}
