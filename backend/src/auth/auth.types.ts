import { Request } from 'express';

export type JwtUser = {
  id: string;
  openId: string;
  role: string;
};

export type RequestWithUser = Request & {
  user?: JwtUser;
};
