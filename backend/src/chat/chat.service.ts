import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatMessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

const BANNED_WORDS = [
  '下注',
  '投注',
  '竞彩',
  '赔率',
  '带单',
  '稳赚',
  '博彩',
  '彩票',
  '广告',
  '引流',
  '加群',
  '微信号',
  'QQ',
  '私聊',
  '赌博',
];

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async listMessages() {
    const messages = await this.prisma.chatMessage.findMany({
      where: { status: ChatMessageStatus.VISIBLE },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        content: true,
        createdAt: true,
      },
    });

    return messages.reverse();
  }

  async createMessage(dto: CreateChatMessageDto, ip: string) {
    const content = this.normalizeContent(dto.content);
    if (!content) {
      throw new BadRequestException('内容不能为空');
    }

    if (content.length > 100) {
      throw new BadRequestException('内容长度不能超过100字');
    }

    if (this.hasBannedWord(content)) {
      return {
        success: false,
        message: '内容包含违规词，请修改后再发送',
      };
    }

    const rateLimitKey = `ip:${ip || 'unknown'}`;
    const recent = await this.prisma.chatMessage.findFirst({
      where: {
        openid: rateLimitKey,
        createdAt: { gte: new Date(Date.now() - 10_000) },
      },
      select: { id: true },
    });

    if (recent) {
      throw new BadRequestException('发送太频繁，请稍后再试');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        openid: rateLimitKey,
        nickname: this.normalizeNickname(dto.nickname),
        avatarUrl: dto.avatarUrl || null,
        content,
        status: ChatMessageStatus.VISIBLE,
      },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        content: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message,
    };
  }

  private normalizeContent(content?: string) {
    return (content || '').replace(/\s+/g, ' ').trim();
  }

  private normalizeNickname(nickname?: string) {
    const value = (nickname || '').trim();
    if (!value) {
      return '球迷';
    }

    return value.slice(0, 20);
  }

  private hasBannedWord(content: string) {
    const normalized = content.toLowerCase();
    return BANNED_WORDS.some((word) => normalized.includes(word.toLowerCase()));
  }
}
