import type { MatchItem } from '../services/types';

const FAVORITES_KEY = 'wc-assistant-favorites';

export function getFavorites(): MatchItem[] {
  return uni.getStorageSync(FAVORITES_KEY) || [];
}

export function isFavorite(matchId: string) {
  return getFavorites().some((item) => item.id === matchId);
}

export function addFavorite(match: MatchItem) {
  const favorites = getFavorites();
  if (favorites.some((item) => item.id === match.id)) {
    return favorites;
  }

  const next = [match, ...favorites];
  uni.setStorageSync(FAVORITES_KEY, next);
  return next;
}

export function removeFavorite(matchId: string) {
  const next = getFavorites().filter((item) => item.id !== matchId);
  uni.setStorageSync(FAVORITES_KEY, next);
  return next;
}
