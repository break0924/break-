export type Team = {
  id: string;
  name: string;
  flagUrl?: string;
};

export type MatchItem = {
  id: string;
  matchNo: string;
  stage: string;
  groupName?: string;
  kickoffAt: string;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
};
