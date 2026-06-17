export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type RiskNotice = {
  text: string;
};

export const DEFAULT_RISK_NOTICE =
  '仅为理论测算和信息辅助，不构成购买建议，实际规则和结果以官方渠道为准。';
