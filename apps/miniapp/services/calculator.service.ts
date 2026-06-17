import { request } from './api';

export function calculatePrize(data: unknown) {
  return request('/calculator/prize', {
    method: 'POST',
    data
  });
}
