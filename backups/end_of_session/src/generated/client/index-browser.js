
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  displayName: 'displayName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeagueScalarFieldEnum = {
  id: 'id',
  name: 'name',
  ownerId: 'ownerId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeagueMemberScalarFieldEnum = {
  id: 'id',
  leagueId: 'leagueId',
  userId: 'userId',
  role: 'role'
};

exports.Prisma.LeagueSettingsScalarFieldEnum = {
  id: 'id',
  leagueId: 'leagueId',
  rosterQB: 'rosterQB',
  rosterRB: 'rosterRB',
  rosterWR: 'rosterWR',
  rosterTE: 'rosterTE',
  rosterFlex: 'rosterFlex',
  rosterK: 'rosterK',
  rosterDST: 'rosterDST',
  rosterBench: 'rosterBench',
  passTdPoints: 'passTdPoints',
  passYardPoints: 'passYardPoints',
  rushTdPoints: 'rushTdPoints',
  rushYardPoints: 'rushYardPoints',
  receivingTdPoints: 'receivingTdPoints',
  receptionPoints: 'receptionPoints',
  fumbleLostPoints: 'fumbleLostPoints'
};

exports.Prisma.TeamScalarFieldEnum = {
  id: 'id',
  leagueId: 'leagueId',
  ownerId: 'ownerId',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  waiverPriority: 'waiverPriority',
  faabBalance: 'faabBalance',
  gold: 'gold'
};

exports.Prisma.WeekScalarFieldEnum = {
  id: 'id',
  leagueId: 'leagueId',
  number: 'number',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeamWeekStatsScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  weekId: 'weekId',
  passYds: 'passYds',
  rushYds: 'rushYds',
  recYds: 'recYds'
};

exports.Prisma.MatchupScalarFieldEnum = {
  id: 'id',
  leagueId: 'leagueId',
  weekId: 'weekId',
  homeTeamId: 'homeTeamId',
  awayTeamId: 'awayTeamId',
  homeScore: 'homeScore',
  awayScore: 'awayScore',
  status: 'status'
};

exports.Prisma.PlayerScalarFieldEnum = {
  id: 'id',
  nflPlayerId: 'nflPlayerId',
  name: 'name',
  position: 'position',
  teamAbbr: 'teamAbbr',
  adp: 'adp'
};

exports.Prisma.PlayerTraitScalarFieldEnum = {
  id: 'id',
  playerId: 'playerId',
  leagueId: 'leagueId',
  code: 'code',
  name: 'name',
  description: 'description',
  rarity: 'rarity',
  kind: 'kind',
  value: 'value',
  expiresAtWeek: 'expiresAtWeek',
  createdAt: 'createdAt'
};

exports.Prisma.PlayerPerformanceScalarFieldEnum = {
  id: 'id',
  playerId: 'playerId',
  weekId: 'weekId',
  points: 'points',
  passYds: 'passYds',
  rushYds: 'rushYds',
  recYds: 'recYds',
  tds: 'tds',
  fumbles: 'fumbles'
};

exports.Prisma.RosterSlotScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  playerId: 'playerId',
  slotType: 'slotType',
  isStarter: 'isStarter'
};

exports.Prisma.PowerupScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  description: 'description',
  rarity: 'rarity',
  scope: 'scope',
  duration: 'duration',
  kind: 'kind',
  value: 'value',
  type: 'type',
  price: 'price'
};

exports.Prisma.TeamPowerupScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  powerupId: 'powerupId',
  weekId: 'weekId',
  isConsumed: 'isConsumed'
};

exports.Prisma.TeamPowerupOfferScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  powerupId: 'powerupId',
  weekId: 'weekId',
  isChosen: 'isChosen'
};

exports.Prisma.DraftScalarFieldEnum = {
  id: 'id',
  leagueId: 'leagueId',
  status: 'status',
  format: 'format',
  currentPick: 'currentPick',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DraftPickScalarFieldEnum = {
  id: 'id',
  draftId: 'draftId',
  teamId: 'teamId',
  playerId: 'playerId',
  pickNumber: 'pickNumber',
  round: 'round'
};

exports.Prisma.WaiverClaimScalarFieldEnum = {
  id: 'id',
  teamId: 'teamId',
  playerId: 'playerId',
  dropPlayerId: 'dropPlayerId',
  priority: 'priority',
  bidAmount: 'bidAmount',
  reason: 'reason',
  status: 'status',
  createdAt: 'createdAt',
  processedAt: 'processedAt'
};

exports.Prisma.LeagueTransactionScalarFieldEnum = {
  id: 'id',
  leagueId: 'leagueId',
  teamId: 'teamId',
  type: 'type',
  playerId: 'playerId',
  amount: 'amount',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  League: 'League',
  LeagueMember: 'LeagueMember',
  LeagueSettings: 'LeagueSettings',
  Team: 'Team',
  Week: 'Week',
  TeamWeekStats: 'TeamWeekStats',
  Matchup: 'Matchup',
  Player: 'Player',
  PlayerTrait: 'PlayerTrait',
  PlayerPerformance: 'PlayerPerformance',
  RosterSlot: 'RosterSlot',
  Powerup: 'Powerup',
  TeamPowerup: 'TeamPowerup',
  TeamPowerupOffer: 'TeamPowerupOffer',
  Draft: 'Draft',
  DraftPick: 'DraftPick',
  WaiverClaim: 'WaiverClaim',
  LeagueTransaction: 'LeagueTransaction'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
