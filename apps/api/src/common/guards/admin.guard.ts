import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('인증이 필요합니다');
    }

    const user = await this.usersService.findById(userId);
    if (user.role !== 'admin') {
      throw new ForbiddenException('관리자 권한이 필요합니다');
    }

    return true;
  }
}
