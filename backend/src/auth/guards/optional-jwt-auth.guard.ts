import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtUser, RequestWithUser } from '../auth.types';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers?.authorization;

    if (!authorization || Array.isArray(authorization)) {
      return true;
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      return true;
    }

    try {
      const user = await this.jwtService.verifyAsync<JwtUser>(token);
      request.user = user.id ? user : undefined;
    } catch {
      request.user = undefined;
    }

    return true;
  }
}
