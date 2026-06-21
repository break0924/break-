import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatMessageStatus, ChatSenderType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import {
  NANCY_BLESSING_BATCH_KEY,
  NANCY_TEAM_BLESSINGS,
  NANCY_TEAM_MESSAGE_TYPE,
} from './nancy-team-blessings';

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
    await this.seedNancyTeamBlessings();

    const messages = await this.prisma.chatMessage.findMany({
      where: { status: ChatMessageStatus.VISIBLE },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        content: true,
        senderType: true,
        messageType: true,
        teamName: true,
        teamCode: true,
        flagUrl: true,
        batchKey: true,
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
        senderType: ChatSenderType.USER,
        messageType: 'USER_MESSAGE',
      },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        content: true,
        senderType: true,
        messageType: true,
        teamName: true,
        teamCode: true,
        flagUrl: true,
        batchKey: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message,
    };
  }

  async seedNancyTeamBlessings() {
    const existing = await this.prisma.chatMessage.count({
      where: { batchKey: NANCY_BLESSING_BATCH_KEY },
    });

    if (existing >= NANCY_TEAM_BLESSINGS.length) {
      return {
        success: true,
        batchKey: NANCY_BLESSING_BATCH_KEY,
        insertedCount: 0,
        existingCount: existing,
      };
    }

    const createdAtBase = new Date(Date.now() - 48 * 1000);
    const result = await this.prisma.chatMessage.createMany({
      data: NANCY_TEAM_BLESSINGS.map((item, index) => ({
        openid: null,
        nickname: item.teamName,
        avatarUrl: null,
        content: item.message,
        status: ChatMessageStatus.VISIBLE,
        senderType: ChatSenderType.TEAM,
        messageType: NANCY_TEAM_MESSAGE_TYPE,
        teamName: item.teamName,
        teamCode: item.teamCode,
        flagUrl: item.flagUrl,
        batchKey: NANCY_BLESSING_BATCH_KEY,
        createdAt: new Date(createdAtBase.getTime() + index * 1000),
      })),
      skipDuplicates: true,
    });

    return {
      success: true,
      batchKey: NANCY_BLESSING_BATCH_KEY,
      insertedCount: result.count,
      existingCount: existing,
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
