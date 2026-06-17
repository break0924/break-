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

export function ok<T>(data: T): ApiResponse<T> {
  return {
    code: 0,
    message: 'ok',
    data
  };
}

export function pageResult<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
): PageResult<T> {
  return { items, page, pageSize, total };
}
