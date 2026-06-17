import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = new URL('../apps/api/prisma/knowledge-base/', import.meta.url);
mkdirSync(outDir, { recursive: true });

const verifiedAt = '2026-06-11T00:00:00.000+08:00';
const fifaSource = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026';
const flag = (code) => `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
const image = (name) => `https://source.unsplash.com/1200x800/?${encodeURIComponent(name)}`;

function rag(title, summary, keywords, content = summary) {
  return { title, summary, keywords, content };
}

const hostCities = [
  ['host-city-atlanta', 'Atlanta', 'United States', 'US', 'Georgia', 'America/New_York', 33.7490, -84.3880],
  ['host-city-boston', 'Boston', 'United States', 'US', 'Massachusetts', 'America/New_York', 42.3601, -71.0589],
  ['host-city-dallas', 'Dallas', 'United States', 'US', 'Texas', 'America/Chicago', 32.7767, -96.7970],
  ['host-city-guadalajara', 'Guadalajara', 'Mexico', 'MX', 'Jalisco', 'America/Mexico_City', 20.6597, -103.3496],
  ['host-city-houston', 'Houston', 'United States', 'US', 'Texas', 'America/Chicago', 29.7604, -95.3698],
  ['host-city-kansas-city', 'Kansas City', 'United States', 'US', 'Missouri', 'America/Chicago', 39.0997, -94.5786],
  ['host-city-los-angeles', 'Los Angeles', 'United States', 'US', 'California', 'America/Los_Angeles', 34.0522, -118.2437],
  ['host-city-mexico-city', 'Mexico City', 'Mexico', 'MX', 'Ciudad de Mexico', 'America/Mexico_City', 19.4326, -99.1332],
  ['host-city-miami', 'Miami', 'United States', 'US', 'Florida', 'America/New_York', 25.7617, -80.1918],
  ['host-city-monterrey', 'Monterrey', 'Mexico', 'MX', 'Nuevo Leon', 'America/Monterrey', 25.6866, -100.3161],
  ['host-city-new-york-new-jersey', 'New York New Jersey', 'United States', 'US', 'New York / New Jersey', 'America/New_York', 40.7128, -74.0060],
  ['host-city-philadelphia', 'Philadelphia', 'United States', 'US', 'Pennsylvania', 'America/New_York', 39.9526, -75.1652],
  ['host-city-san-francisco-bay-area', 'San Francisco Bay Area', 'United States', 'US', 'California', 'America/Los_Angeles', 37.7749, -122.4194],
  ['host-city-seattle', 'Seattle', 'United States', 'US', 'Washington', 'America/Los_Angeles', 47.6062, -122.3321],
  ['host-city-toronto', 'Toronto', 'Canada', 'CA', 'Ontario', 'America/Toronto', 43.6532, -79.3832],
  ['host-city-vancouver', 'Vancouver', 'Canada', 'CA', 'British Columbia', 'America/Vancouver', 49.2827, -123.1207]
].map(([id, name, country, countryCode, region, timezone, latitude, longitude]) => ({
  id,
  name,
  country,
  country_code: countryCode,
  region,
  timezone,
  latitude,
  longitude,
  image_url: image(`${name} skyline`),
  flag_url: flag(countryCode),
  introduction: `${name} is one of the 16 host city areas for the 2026 FIFA World Cup across Canada, Mexico and the United States.`,
  source_url: fifaSource,
  is_official: true,
  last_verified_at: verifiedAt,
  raw: {},
  rag: rag(`${name} host city`, `${name} will host 2026 FIFA World Cup matches.`, ['2026 FIFA World Cup', name, country, 'host city'])
}));

const stadiumSeed = [
  ['stadium-atlanta', 'Mercedes-Benz Stadium', 'Atlanta Stadium', 'host-city-atlanta', 'US', 71000],
  ['stadium-boston', 'Gillette Stadium', 'Boston Stadium', 'host-city-boston', 'US', 65878],
  ['stadium-dallas', 'AT&T Stadium', 'Dallas Stadium', 'host-city-dallas', 'US', 80000],
  ['stadium-guadalajara', 'Estadio Akron', 'Guadalajara Stadium', 'host-city-guadalajara', 'MX', 48071],
  ['stadium-houston', 'NRG Stadium', 'Houston Stadium', 'host-city-houston', 'US', 72220],
  ['stadium-kansas-city', 'Arrowhead Stadium', 'Kansas City Stadium', 'host-city-kansas-city', 'US', 76416],
  ['stadium-los-angeles', 'SoFi Stadium', 'Los Angeles Stadium', 'host-city-los-angeles', 'US', 70240],
  ['stadium-mexico-city', 'Estadio Azteca', 'Mexico City Stadium', 'host-city-mexico-city', 'MX', 87523],
  ['stadium-miami', 'Hard Rock Stadium', 'Miami Stadium', 'host-city-miami', 'US', 64767],
  ['stadium-monterrey', 'Estadio BBVA', 'Monterrey Stadium', 'host-city-monterrey', 'MX', 53500],
  ['stadium-new-york-new-jersey', 'MetLife Stadium', 'New York New Jersey Stadium', 'host-city-new-york-new-jersey', 'US', 82500],
  ['stadium-philadelphia', 'Lincoln Financial Field', 'Philadelphia Stadium', 'host-city-philadelphia', 'US', 67594],
  ['stadium-san-francisco-bay-area', "Levi's Stadium", 'San Francisco Bay Area Stadium', 'host-city-san-francisco-bay-area', 'US', 68500],
  ['stadium-seattle', 'Lumen Field', 'Seattle Stadium', 'host-city-seattle', 'US', 68740],
  ['stadium-toronto', 'BMO Field', 'Toronto Stadium', 'host-city-toronto', 'CA', 30000],
  ['stadium-vancouver', 'BC Place', 'Vancouver Stadium', 'host-city-vancouver', 'CA', 54500]
];

const stadiums = stadiumSeed.map(([id, name, fifaName, hostCityId, countryCode, capacity]) => ({
  id,
  name,
  fifa_name: fifaName,
  host_city_id: hostCityId,
  country_code: countryCode,
  capacity,
  latitude: null,
  longitude: null,
  image_url: image(`${name} stadium`),
  flag_url: flag(countryCode),
  introduction: `${name} is listed as a host venue for the 2026 FIFA World Cup. FIFA venue naming may use ${fifaName}.`,
  source_url: fifaSource,
  is_official: true,
  last_verified_at: verifiedAt,
  raw: {},
  rag: rag(`${name} 2026 World Cup stadium`, `${name} (${fifaName}) is a 2026 FIFA World Cup venue.`, ['stadium', name, fifaName, '2026 FIFA World Cup'])
}));

const groups = Array.from({ length: 12 }, (_, index) => {
  const code = String.fromCharCode(65 + index);
  return {
    id: `group-${code.toLowerCase()}`,
    name: `Group ${code}`,
    group_code: code,
    image_url: image(`football group ${code}`),
    flag_url: null,
    introduction: `Group ${code} is one of the 12 groups in the expanded 48-team 2026 FIFA World Cup format.`,
    source_url: fifaSource,
    is_official: false,
    last_verified_at: verifiedAt,
    raw: { note: 'Group composition should be refreshed from official FIFA draw data.' },
    rag: rag(`2026 World Cup Group ${code}`, `Group ${code} contains four team slots in the 2026 FIFA World Cup.`, ['group', code, '2026 FIFA World Cup'])
  };
});

const hostTeams = [
  ['team-canada', 'CAN', 'Canada', 'Canada', 'CA', 'CONCACAF', 'Host nation', 'Canada men’s national team is one of the three host associations for the 2026 FIFA World Cup.'],
  ['team-mexico', 'MEX', 'Mexico', 'Mexico', 'MX', 'CONCACAF', 'Host nation', 'Mexico men’s national team is one of the three host associations for the 2026 FIFA World Cup.'],
  ['team-united-states', 'USA', 'United States', 'United States', 'US', 'CONCACAF', 'Host nation', 'United States men’s national team is one of the three host associations for the 2026 FIFA World Cup.']
];

const slotTeams = Array.from({ length: 45 }, (_, index) => {
  const n = index + 1;
  return [`team-slot-${String(n).padStart(2, '0')}`, null, `Qualified Team Slot ${n}`, `Qualified Team Slot ${n}`, null, null, 'Pending official data refresh', `Placeholder slot for a qualified 2026 FIFA World Cup team. Replace with official FIFA team data before production use.`];
});

const teams = [...hostTeams, ...slotTeams].map(([id, fifaCode, name, nameEn, countryCode, confederation, qualification, introduction], index) => ({
  id,
  fifa_code: fifaCode,
  name,
  name_en: nameEn,
  country_code: countryCode,
  confederation,
  qualification,
  group_id: groups[Math.floor(index / 4)]?.id ?? null,
  seed_slot: `${groups[Math.floor(index / 4)]?.group_code ?? 'TBD'}${(index % 4) + 1}`,
  flag_url: countryCode ? flag(countryCode) : null,
  image_url: image(`${name} football team`),
  introduction,
  source_url: fifaSource,
  is_official: Boolean(fifaCode),
  last_verified_at: verifiedAt,
  raw: { data_status: fifaCode ? 'host_team_verified' : 'placeholder_requires_official_refresh' },
  rag: rag(`${name} 2026 World Cup team`, introduction, ['team', name, fifaCode, '2026 FIFA World Cup'].filter(Boolean))
}));

const players = [];

const matches = [];
let matchNo = 1;
for (const group of groups) {
  const slots = [1, 2, 3, 4].map((n) => `${group.group_code}${n}`);
  const pairings = [[0, 1], [2, 3], [0, 2], [3, 1], [3, 0], [1, 2]];
  for (const [home, away] of pairings) {
    matches.push({
      id: `match-${String(matchNo).padStart(3, '0')}`,
      match_no: matchNo,
      stage: 'GROUP',
      group_id: group.id,
      home_team_id: null,
      away_team_id: null,
      home_slot: slots[home],
      away_slot: slots[away],
      kickoff_at: null,
      stadium_id: null,
      host_city_id: null,
      status: 'SCHEDULED',
      image_url: image(`FIFA World Cup match ${matchNo}`),
      flag_url: null,
      introduction: `Group-stage placeholder fixture ${slots[home]} vs ${slots[away]} for the 2026 FIFA World Cup. Refresh from official FIFA schedule for date, venue and teams.`,
      source_url: fifaSource,
      is_official: false,
      last_verified_at: verifiedAt,
      raw: { data_status: 'placeholder_requires_official_schedule_refresh' },
      rag: rag(`Match ${matchNo}: ${slots[home]} vs ${slots[away]}`, `2026 World Cup group placeholder match ${matchNo}.`, ['match', 'group stage', group.group_code])
    });
    matchNo++;
  }
}
const knockoutStages = [
  ['ROUND_OF_32', 16],
  ['ROUND_OF_16', 8],
  ['QUARTER_FINAL', 4],
  ['SEMI_FINAL', 2],
  ['THIRD_PLACE', 1],
  ['FINAL', 1]
];
for (const [stage, count] of knockoutStages) {
  for (let i = 1; i <= count; i++) {
    matches.push({
      id: `match-${String(matchNo).padStart(3, '0')}`,
      match_no: matchNo,
      stage,
      group_id: null,
      home_team_id: null,
      away_team_id: null,
      home_slot: `${stage}_HOME_${i}`,
      away_slot: `${stage}_AWAY_${i}`,
      kickoff_at: null,
      stadium_id: null,
      host_city_id: null,
      status: 'SCHEDULED',
      image_url: image(`FIFA World Cup ${stage}`),
      flag_url: null,
      introduction: `${stage.replaceAll('_', ' ')} placeholder fixture for the 2026 FIFA World Cup knockout phase. Refresh from official FIFA bracket data.`,
      source_url: fifaSource,
      is_official: false,
      last_verified_at: verifiedAt,
      raw: { data_status: 'placeholder_requires_official_bracket_refresh' },
      rag: rag(`Match ${matchNo}: ${stage}`, `2026 World Cup knockout placeholder match ${matchNo}.`, ['match', stage, 'knockout'])
    });
    matchNo++;
  }
}

const historySeed = [
  [1930, 'Uruguay', 'Uruguay', 'Argentina', 'United States', 13],
  [1934, 'Italy', 'Italy', 'Czechoslovakia', 'Germany', 16],
  [1938, 'France', 'Italy', 'Hungary', 'Brazil', 15],
  [1950, 'Brazil', 'Uruguay', 'Brazil', 'Sweden', 13],
  [1954, 'Switzerland', 'West Germany', 'Hungary', 'Austria', 16],
  [1958, 'Sweden', 'Brazil', 'Sweden', 'France', 16],
  [1962, 'Chile', 'Brazil', 'Czechoslovakia', 'Chile', 16],
  [1966, 'England', 'England', 'West Germany', 'Portugal', 16],
  [1970, 'Mexico', 'Brazil', 'Italy', 'West Germany', 16],
  [1974, 'West Germany', 'West Germany', 'Netherlands', 'Poland', 16],
  [1978, 'Argentina', 'Argentina', 'Netherlands', 'Brazil', 16],
  [1982, 'Spain', 'Italy', 'West Germany', 'Poland', 24],
  [1986, 'Mexico', 'Argentina', 'West Germany', 'France', 24],
  [1990, 'Italy', 'West Germany', 'Argentina', 'Italy', 24],
  [1994, 'United States', 'Brazil', 'Italy', 'Sweden', 24],
  [1998, 'France', 'France', 'Brazil', 'Croatia', 32],
  [2002, 'South Korea and Japan', 'Brazil', 'Germany', 'Turkey', 32],
  [2006, 'Germany', 'Italy', 'France', 'Germany', 32],
  [2010, 'South Africa', 'Spain', 'Netherlands', 'Germany', 32],
  [2014, 'Brazil', 'Germany', 'Argentina', 'Netherlands', 32],
  [2018, 'Russia', 'France', 'Croatia', 'Belgium', 32],
  [2022, 'Qatar', 'Argentina', 'France', 'Croatia', 32]
];
const worldCupHistory = historySeed.map(([year, host, champion, runnerUp, thirdPlace, teamsCount]) => ({
  id: `world-cup-${year}`,
  year,
  host,
  champion,
  runner_up: runnerUp,
  third_place: thirdPlace,
  teams_count: teamsCount,
  image_url: image(`${year} FIFA World Cup`),
  flag_url: null,
  introduction: `${year} FIFA World Cup was hosted by ${host}; ${champion} won the tournament.`,
  source_url: 'https://www.fifa.com/en/tournaments/mens/worldcup',
  is_official: false,
  last_verified_at: verifiedAt,
  raw: {},
  rag: rag(`${year} FIFA World Cup`, `${champion} won the ${year} FIFA World Cup hosted by ${host}.`, ['FIFA World Cup history', String(year), champion, host])
}));

const facts = [
  ['fact-2026-hosts', '2026', 'First three-country FIFA World Cup', 'The 2026 FIFA World Cup is hosted across Canada, Mexico and the United States, making it the first men’s World Cup hosted by three countries.'],
  ['fact-2026-format', '2026', 'Expanded 48-team format', 'The 2026 edition expands the men’s FIFA World Cup to 48 teams and 104 matches.'],
  ['fact-2026-groups', '2026', 'Twelve groups of four', 'The expanded 2026 format uses 12 groups of four teams before the knockout rounds.'],
  ['fact-mexico-history', 'Hosts', 'Mexico hosts for a third time', 'Mexico becomes the first country to host or co-host the men’s FIFA World Cup for a third time.'],
  ['fact-rag-compliance', 'Compliance', 'No betting transaction data', 'This knowledge base is designed for information retrieval, AI analysis and theoretical simulation only; it does not include purchase, recharge or prize-redemption workflows.']
].map(([id, category, title, content]) => ({
  id,
  category,
  title,
  content,
  introduction: content,
  image_url: image(title),
  flag_url: null,
  source_url: fifaSource,
  is_official: category !== 'Compliance',
  last_verified_at: verifiedAt,
  raw: {},
  rag: rag(title, content, ['fact', category, '2026 FIFA World Cup'])
}));

const files = {
  'teams.json': { metadata: meta('teams'), items: teams },
  'players.json': { metadata: meta('players', 'Official 2026 squad/player data should be refreshed from FIFA team squad feeds before production use.'), items: players },
  'groups.json': { metadata: meta('groups'), items: groups },
  'matches.json': { metadata: meta('matches', 'Schedule placeholders generated to preserve 104-match structure; refresh from official FIFA schedule for production.'), items: matches },
  'stadiums.json': { metadata: meta('stadiums'), items: stadiums },
  'host_cities.json': { metadata: meta('host_cities'), items: hostCities },
  'world_cup_history.json': { metadata: meta('world_cup_history'), items: worldCupHistory },
  'facts.json': { metadata: meta('facts'), items: facts }
};

function meta(entity, note = 'Standardized knowledge-base data for Prisma import and RAG retrieval.') {
  return {
    entity,
    tournament: '2026 FIFA World Cup',
    version: '0.1.0',
    generated_at: verifiedAt,
    source_policy: 'Official FIFA source preferred; placeholder records are explicitly marked is_official=false.',
    note
  };
}

for (const [file, data] of Object.entries(files)) {
  writeFileSync(join(outDir.pathname, file), `${JSON.stringify(data, null, 2)}\n`);
  console.log(`wrote ${file}: ${data.items.length}`);
}
