import { Injectable } from '@nestjs/common';
import { ChatMessageStatus, ChatSenderType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import {
  NANCY_BLESSING_BATCH_KEY,
  NANCY_CHINA_SPECIAL_BLESSING,
  NANCY_CHINA_SPECIAL_TEAM_CODE,
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

    const [blessings, userMessages] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: {
          status: ChatMessageStatus.VISIBLE,
          batchKey: NANCY_BLESSING_BATCH_KEY,
        },
        orderBy: { createdAt: 'asc' },
        select: this.messageSelect(),
      }),
      this.prisma.chatMessage.findMany({
        where: {
          status: ChatMessageStatus.VISIBLE,
          batchKey: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: this.messageSelect(),
      }),
    ]);

    return [...this.sortBlessings(blessings), ...userMessages.reverse()];
  }

  async createMessage(dto: CreateChatMessageDto, ip: string) {
    const content = this.normalizeContent(dto.content);
    if (!content) {
      return this.fail('内容不能为空');
    }

    if (content.length > 100) {
      return this.fail('内容长度不能超过100字');
    }

    if (this.hasBannedWord(content)) {
      return this.fail('内容包含违规词，请修改后再发送');
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
      return this.fail('发送太频繁，请稍后再试');
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
        isSpecialBlessing: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message,
    };
  }

  async seedNancyTeamBlessings() {
    const existingRegular = await this.prisma.chatMessage.count({
      where: {
        batchKey: NANCY_BLESSING_BATCH_KEY,
        teamCode: { not: NANCY_CHINA_SPECIAL_TEAM_CODE },
      },
    });
    const existingChina = await this.prisma.chatMessage.findFirst({
      where: {
        batchKey: NANCY_BLESSING_BATCH_KEY,
        teamCode: NANCY_CHINA_SPECIAL_TEAM_CODE,
      },
      select: { id: true },
    });

    if (existingRegular >= NANCY_TEAM_BLESSINGS.length && existingChina) {
      await this.upsertChinaSpecialBlessing();
      return {
        success: true,
        batchKey: NANCY_BLESSING_BATCH_KEY,
        insertedCount: 0,
        existingCount: existingRegular + 1,
      };
    }

    const createdAtBase = new Date(Date.now() - 49 * 1000);
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
        isSpecialBlessing: false,
        createdAt: new Date(createdAtBase.getTime() + index * 1000),
      })),
      skipDuplicates: true,
    });
    await this.upsertChinaSpecialBlessing();

    return {
      success: true,
      batchKey: NANCY_BLESSING_BATCH_KEY,
      insertedCount: result.count + (existingChina ? 0 : 1),
      existingCount: existingRegular + (existingChina ? 1 : 0),
    };
  }

  private async upsertChinaSpecialBlessing() {
    const createdAt = new Date(Date.now() - 500);
    return this.prisma.chatMessage.upsert({
      where: {
        batchKey_teamCode: {
          batchKey: NANCY_BLESSING_BATCH_KEY,
          teamCode: NANCY_CHINA_SPECIAL_TEAM_CODE,
        },
      },
      create: {
        openid: null,
        nickname: NANCY_CHINA_SPECIAL_BLESSING.teamName,
        avatarUrl: null,
        content: NANCY_CHINA_SPECIAL_BLESSING.message,
        status: ChatMessageStatus.VISIBLE,
        senderType: ChatSenderType.TEAM,
        messageType: NANCY_TEAM_MESSAGE_TYPE,
        teamName: NANCY_CHINA_SPECIAL_BLESSING.teamName,
        teamCode: NANCY_CHINA_SPECIAL_BLESSING.teamCode,
        flagUrl: NANCY_CHINA_SPECIAL_BLESSING.flagUrl,
        batchKey: NANCY_BLESSING_BATCH_KEY,
        isSpecialBlessing: true,
        createdAt,
      },
      update: {
        nickname: NANCY_CHINA_SPECIAL_BLESSING.teamName,
        content: NANCY_CHINA_SPECIAL_BLESSING.message,
        status: ChatMessageStatus.VISIBLE,
        senderType: ChatSenderType.TEAM,
        messageType: NANCY_TEAM_MESSAGE_TYPE,
        teamName: NANCY_CHINA_SPECIAL_BLESSING.teamName,
        teamCode: NANCY_CHINA_SPECIAL_BLESSING.teamCode,
        flagUrl: NANCY_CHINA_SPECIAL_BLESSING.flagUrl,
        batchKey: NANCY_BLESSING_BATCH_KEY,
        isSpecialBlessing: true,
        createdAt,
      },
    });
  }

  private messageSelect() {
    return {
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
      isSpecialBlessing: true,
      createdAt: true,
    };
  }

  private sortBlessings<T extends { teamCode: string | null; isSpecialBlessing: boolean }>(
    blessings: T[],
  ) {
    const order = new Map(
      NANCY_TEAM_BLESSINGS.map((item, index) => [item.teamCode, index]),
    );

    return [...blessings].sort((a, b) => {
      if (a.isSpecialBlessing !== b.isSpecialBlessing) {
        return a.isSpecialBlessing ? 1 : -1;
      }

      return (order.get(a.teamCode || '') ?? 999) - (order.get(b.teamCode || '') ?? 999);
    });
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

  private fail(message: string) {
    return {
      success: false,
      message,
    };
  }
}
