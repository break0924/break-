import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { pageResult } from '../../common/dto/api-response';
import { PrismaService } from '../../common/prisma/prisma.service';

type AuditLogInput = {
  adminUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: { page: number; pageSize: number; entityType?: string }) {
    const page = Number.isFinite(query.page) && query.page > 0 ? query.page : 1;
    const pageSize =
      Number.isFinite(query.pageSize) && query.pageSize > 0
        ? Math.min(query.pageSize, 100)
        : 50;
    const where = query.entityType ? { entityType: query.entityType } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          adminUser: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        }
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return pageResult(items, page, pageSize, total);
  }

  write(input: AuditLogInput) {
    const before = toJson(input.before);
    const after = toJson(input.after);

    return this.prisma.auditLog.create({
      data: {
        ...input,
        before,
        after
      }
    });
  }
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
