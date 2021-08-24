import { type, Schema, MapSchema, ArraySchema } from '@colyseus/schema';

export enum GoldenFrogGameState {
  WaitingForAction = "WaitingForAction",
  AcceptingBets = "AcceptingBets",
  InitialHandDealt = "InitialHandDealt",
  Player3rdDealt = "Player3rdDealt",
  Dealer3rdDealt = "Dealer3rdDealt",
  Finished = "Finished",
};

export class GoldenFrogWager extends Schema {
  @type("uint32") playerWager: number = 0;
  @type("uint32") bankerWager: number = 0;
  @type("uint32") tieWager: number = 0;

  @type("uint32") koi8Wager: number = 0;
  @type("uint32") jinChan7Wager: number = 0;

  @type("uint32") nineOverOneWager: number = 0;
  @type("uint32") natural9Over7Wager: number = 0;
  @type("uint32") any8Over6Wager: number = 0;
}

export class GoldenFrogPayout extends Schema {
  @type("uint32") playerPayout: number = 0;
  @type("uint32") bankerPayout: number = 0;
  @type("uint32") tiePayout: number = 0;

  @type("uint32") koi8Payout: number = 0;
  @type("uint32") jinChan7Payout: number = 0;

  @type("uint32") nineOverOnePayout: number = 0;
  @type("uint32") natural9Over7Payout: number = 0;
  @type("uint32") any8Over6Payout: number = 0;
}

export class GoldenFrogEvaluation extends Schema {
  @type("string") outcome: string;

  @type("boolean") isKoi8: boolean;
  @type("boolean") isJinChan7: boolean;

  @type("boolean") isNineOverOne: boolean;
  @type("boolean") isNatural9Over7: boolean;
  @type("boolean") isAny8Over6: boolean;
}

export class GoldenFrogTable extends Schema {
  @type("string") bankerCard1: string;
  @type("string") bankerCard2: string;
  @type("string") bankerCard3: string;

  @type("string") playerCard1: string;
  @type("string") playerCard2: string;
  @type("string") playerCard3: string;

  public reset() {
    this.bankerCard1 = this.bankerCard2 = this.bankerCard3 = null;
    this.playerCard1 = this.playerCard2 = this.playerCard3 = null;
  }
}

export class GoldenFrogGameHistory extends Schema {
  @type("number") gameNumber: number;
  @type(GoldenFrogEvaluation) evaluation: GoldenFrogEvaluation;
  @type(GoldenFrogTable) table: GoldenFrogTable;
}

export class GoldenFrogPlayer extends Schema {
  @type("string") sessionId: string;
  @type("string") playerId: string;
  @type("string") playerName: string;
  @type("string") facebookId: string;
  @type("uint32") seatNumber: number;
  @type("uint32") credits: number;
  @type("boolean") isConnected: boolean = true;

  @type("boolean") isObserving: boolean;

  @type(GoldenFrogWager) wager: GoldenFrogWager = new GoldenFrogWager();
  @type(GoldenFrogPayout) payout: GoldenFrogPayout = new GoldenFrogPayout();

  constructor() {
    super();
    this.reset();
  }

  public reset() {
    this.isObserving = false;

    this.wager = new GoldenFrogWager();
    this.payout = new GoldenFrogPayout();
  }
}

export class GoldenFrogState extends Schema {
  @type("string") gameState: GoldenFrogGameState;
  @type("int32") gameStateCountdown: number;
  @type(GoldenFrogTable) table: GoldenFrogTable = new GoldenFrogTable();
  @type(GoldenFrogEvaluation) evaluation: GoldenFrogEvaluation = new GoldenFrogEvaluation();
  @type([GoldenFrogGameHistory]) gameHistory: ArraySchema<GoldenFrogGameHistory> = new ArraySchema<GoldenFrogGameHistory>();
  @type({ map: GoldenFrogPlayer }) players = new MapSchema<GoldenFrogPlayer>();
}