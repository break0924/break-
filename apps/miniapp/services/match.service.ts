import { request } from './api';

export function getMatches() {
  return request('/matches');
}

export function getMatchDetail(id: string) {
  return request(`/matches/${id}`);
}
