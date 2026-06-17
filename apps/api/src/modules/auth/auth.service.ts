import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { verifyPassword } from '../../common/security/password';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.prisma.adminUser.findFirst({
      where: { username: dto.username, isActive: true }
    });

    if (!admin || !(await verifyPassword(dto.password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: admin.id, role: admin.role },
      { secret: this.configService.get<string>('JWT_SECRET') }
    );

    return {
      accessToken,
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role
      }
    };
  }
}
