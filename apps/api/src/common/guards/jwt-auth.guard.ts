import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const path = request.path ?? request.url ?? '';
    const isAdminPath = path.startsWith('/api/v1/admin') || path.startsWith('/admin');

    if (!isAdminPath) {
      return true;
    }

    const token = this.extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing admin access token');
    }

    try {
      request.admin = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET')
      });
      return true;
    } catch {
      throw new UnauthorizedException('Invalid admin access token');
    }
  }

  private extractBearerToken(authorization?: string) {
    const [type, token] = authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
