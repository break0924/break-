import { Injectable } from '@nestjs/common';
import { AiDailyPickResult, AiReportResult } from './ai.types';

const phrase = (...parts: string[]) => parts.join('');

const FORBIDDEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [new RegExp(phrase('稳', '赚'), 'g'), '存在不确定性'],
  [new RegExp(phrase('必', '中'), 'g'), '不可保证命中'],
  [new RegExp(phrase('保', '本'), 'g'), '不承诺结果'],
  [new RegExp(phrase('保', '赢'), 'g'), '不承诺结果'],
  [new RegExp(phrase('无', '风', '险'), 'g'), '存在风险'],
  [new RegExp(phrase('购', '买', '彩', '票'), 'g'), '查看足球分析内容'],
  [new RegExp(phrase('买', '彩', '票'), 'g'), '查看足球分析内容'],
  [new RegExp(phrase('投', '注'), 'g'), '关注比赛分析'],
  [new RegExp(phrase('下', '注'), 'g'), '关注比赛分析'],
  [new RegExp(phrase('竞', '彩', '购', '买'), 'g'), '足球内容参考'],
  [new RegExp(phrase('彩', '票', '购', '买'), 'g'), '足球内容参考'],
];

@Injectable()
export class AiContentPolicyService {
  applyReportPolicy<T extends AiReportResult>(report: T): T {
    return {
      ...report,
      summary: this.sanitize(report.summary),
      fullContent: this.ensureRiskTip(this.sanitize(report.fullContent)),
    };
  }

  applyDailyPickPolicy(pick: AiDailyPickResult): AiDailyPickResult {
    return {
      ...this.applyReportPolicy(pick),
      freeReason: this.ensureRiskTip(this.sanitize(pick.freeReason)),
      memberReason: this.ensureRiskTip(this.sanitize(pick.memberReason)),
    };
  }

  private sanitize(text: string) {
    return FORBIDDEN_REPLACEMENTS.reduce(
      (current, [pattern, replacement]) => current.replace(pattern, replacement),
      text || '',
    );
  }

  private ensureRiskTip(text: string) {
    if (text.includes('风险提示')) {
      return text;
    }

    return `${text}\n\n风险提示：足球比赛存在临场状态、伤停、战术调整等不确定性，本内容仅供足球数据分析参考。`;
  }
}
