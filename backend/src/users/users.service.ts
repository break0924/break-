import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user
      .upsert({
        where: { openId: dto.openId },
        update: {
          unionId: dto.unionId,
          nickname: dto.nickname,
          avatarUrl: dto.avatarUrl,
        },
        create: {
          openId: dto.openId,
          unionId: dto.unionId,
          nickname: dto.nickname,
          avatarUrl: dto.avatarUrl,
        },
      })
      .catch(() => ({
        id: 'demo_user',
        openId: dto.openId,
        unionId: dto.unionId ?? null,
        nickname: dto.nickname ?? '演示用户',
        avatarUrl: dto.avatarUrl ?? null,
        role: 'USER' as const,
        membershipStatus: MembershipStatus.NONE,
        membershipExpireAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    return {
      accessToken: await this.jwtService.signAsync({
        id: user.id,
        openId: user.openId,
        role: user.role,
      }),
      user: {
        id: user.id,
        openId: user.openId,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
        membershipStatus: user.membershipStatus,
        membershipExpireAt: user.membershipExpireAt,
        isMember: this.isActiveMember(
          user.membershipStatus,
          user.membershipExpireAt,
        ),
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user
      .findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          avatarUrl: true,
          role: true,
          membershipStatus: true,
          membershipExpireAt: true,
          createdAt: true,
        },
      })
      .catch(() => null);

    if (!user && userId === 'demo_user') {
      return {
        id: 'demo_user',
        nickname: '演示用户',
        avatarUrl: null,
        role: 'USER',
        membershipStatus: MembershipStatus.NONE,
        membershipExpireAt: null,
        createdAt: new Date(),
        isMember: false,
      };
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      isMember: this.isActiveMember(user.membershipStatus, user.membershipExpireAt),
    };
  }

  isActiveMember(status: MembershipStatus, expireAt?: Date | null) {
    return status === MembershipStatus.ACTIVE && !!expireAt && expireAt > new Date();
  }
}
