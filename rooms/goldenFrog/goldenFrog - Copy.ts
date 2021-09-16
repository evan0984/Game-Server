import { Room, Delayed, Client, ClientState } from 'colyseus';
import { Deferred } from 'colyseus/lib/Utils';
import { RoomInternalState } from 'colyseus/lib/Room';
import { GoldenFrogState, GoldenFrogGameState, GoldenFrogWager, GoldenFrogPlayer } from './goldenFrogState';
import { GoldenFrogGameStateChanged, GoldenFrogWagerAction } from './goldenFrogClientMessages';
import { GoldenFrogGame } from './goldenFrogGame';
const winston = require('winston');
const util = require('util')

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            prettyPrint: true,
            colorize: true,
            silent: false,
            timestamp: false,
            json: true
        })
    ]
});

const gameSparks = require('gamesparks-node');

const GameSparksApiKey = process.env.GAMESPARKS_API_KEY;
const GameSparksApiSecret = process.env.GAMESPARKS_API_SECRET;

function onGameSparksMessage(m) {
  logger.debug("Gamesparks Message", m);
}

function onGameSparksInit() {

}

function onGameSparksError(e) {
  logger.debug("Gamesparks Error", e);
}

gameSparks.initPreviewListener(GameSparksApiKey, GameSparksApiSecret, 20, onGameSparksMessage, onGameSparksInit, onGameSparksError);


export class GoldenFrog extends Room<GoldenFrogState> {
  maxClients = 5;
  autoDispose = false;
  seatingTable = new Array(this.maxClients);
  gameStateTimeout: Delayed;
  gameCountdownTimer: Delayed;
  game: GoldenFrogGame;

  readonly AcceptingBetTimeoutSeconds: number = 15;
  readonly CardDealTimeoutSeconds: number = 2;
  readonly FinishedGameTimeoutSeconds: number = 5;

  async onAuth(client, options) {
    var gameSparksPlayerId = options.gameSparksPlayerId;

    // Get gamesparks data for player.
    const sendAsPromise = util.promisify(gameSparks.sendAs);
    const accountDetails = await sendAsPromise(gameSparksPlayerId, '.AccountDetailsRequest', {});

    // Deny auth if GS cannot retrieve player id
    if (accountDetails.error) {
      return false;
    }

    return accountDetails;
  }

  onCreate(options) {
    var state = new GoldenFrogState();
    state.gameState = GoldenFrogGameState.WaitingForAction;
    this.game = new GoldenFrogGame(state);

    this.setState(state);

    // Timer to keep state updated with countdown time for new clients.
    this.gameCountdownTimer = this.clock.setInterval(() =>
    {
      if (this.gameStateTimeout != null && this.gameStateTimeout.active) {
        this.state.gameStateCountdown = Math.floor((this.gameStateTimeout.time - this.gameStateTimeout.elapsedTime) / 1000);
      }
      else {
        this.state.gameStateCountdown = 0;
      }
    }, 500);
    
    logger.info(`New Room Created ${this.roomId}`);
  }

  onJoin(client: Client, options, auth) {
    var playerState = new GoldenFrogPlayer();
    playerState.sessionId = client.sessionId;
    playerState.playerId = auth.userId;
    playerState.credits = auth.currencies["CREDITS"];
    playerState.playerName = auth.displayName;
    playerState.facebookId = auth.externalIds["FB"];

    playerState.isObserving = this.state.gameState != GoldenFrogGameState.WaitingForAction
                              && this.state.gameState != GoldenFrogGameState.AcceptingBets;

    this.state.players[client.sessionId] = playerState;

    var seatingIndex = this.seatingTable.findIndex((value, index) => {
      return value == null;
    })

    playerState.seatNumber = seatingIndex;
    this.seatingTable[seatingIndex] = playerState;

    logger.info(`Player ${auth.displayName} Joined ${Object.keys(this.state.players).length} players.`);
  }

  onDispose() {
    logger.info("Room Closed");
  }

  async onLeave(client, consented) {
    var player = this.state.players[client.sessionId];
    player.isConnected = false;

    // Open the seat up again
    this.seatingTable[player.seatNumber] = null;
    delete this.state.players[client.sessionId];
    logger.info(`Player left and seat ${player.seatNumber} was opened.`, consented);

    this._disposeIfEmpty();
  }

  broadcastStateChangeMessage(gameStateCountdown: number) {
    var message = new GoldenFrogGameStateChanged();
    message.gameState = this.state.gameState;
    message.gameStateCountdown = gameStateCountdown;

    this.broadcast(message, { afterNextPatch: true });
  }

  broadcastWagerActionMessage(sessionId: string) {
    var message = new GoldenFrogWagerAction();
    message.playerSessionId = sessionId;

    this.broadcast(message, { afterNextPatch: true });
  }

  startAcceptingBetCountdown() {
    if (this.gameStateTimeout && this.gameStateTimeout.active) {
      return;
    }

    logger.info("Start AcceptingBets Countdown", this.state);

    this.gameStateTimeout = this.clock.setTimeout(() => {
      this.gameStateTimeout = null;
  
      this.game.deal();
      this.broadcastStateChangeMessage(this.CardDealTimeoutSeconds);

      this.startInitialHandDealtCountdown();      
    }, (this.AcceptingBetTimeoutSeconds + 1) * 1000);
  }

  startInitialHandDealtCountdown() {
    if (this.gameStateTimeout && this.gameStateTimeout.active) {
      return;
    }

    logger.info("Start InitialHandDealt Countdown", this.state);

    this.gameStateTimeout = this.clock.setTimeout(() => {
      this.gameStateTimeout = null;
  
      if (this.state.table.playerCard3 != null) {
        this.startDeal3rdPlayerCardCountdown();
      }
      else if (this.state.table.bankerCard3 != null) {
        this.startDeal3rdBankerCardCountdown();
      }
      else {
        this.startFinishedCountdown();

      }
    }, (this.CardDealTimeoutSeconds + 1) * 1000);
  }

  startDeal3rdPlayerCardCountdown() {
    if (this.gameStateTimeout && this.gameStateTimeout.active) {
      return;
    }

    this.state.gameState = GoldenFrogGameState.Player3rdDealt;
    this.broadcastStateChangeMessage(this.CardDealTimeoutSeconds);

    logger.info("Start Deal3rdPlayerCard Countdown", this.state);

    this.gameStateTimeout = this.clock.setTimeout(() => {
      this.gameStateTimeout = null;
  
      if (this.state.table.bankerCard3 != null) {
        this.startDeal3rdBankerCardCountdown();
      }
      else {
        this.startFinishedCountdown();
      }     
    }, (this.CardDealTimeoutSeconds + 1) * 1000);
  }

  startDeal3rdBankerCardCountdown() {
    if (this.gameStateTimeout && this.gameStateTimeout.active) {
      return;
    }

    this.state.gameState = GoldenFrogGameState.Dealer3rdDealt;
    this.broadcastStateChangeMessage(this.CardDealTimeoutSeconds);

    logger.info("Start Deal3rdBankerCard Countdown", this.state);

    this.gameStateTimeout = this.clock.setTimeout(() => {
      this.gameStateTimeout = null;

      this.startFinishedCountdown();
    
    }, (this.CardDealTimeoutSeconds + 1) * 1000);
  }

  startFinishedCountdown() {
    if (this.gameStateTimeout && this.gameStateTimeout.active) {
      return;
    }

    this.game.evaluate();

    this.state.gameState = GoldenFrogGameState.Finished;
    this.broadcastStateChangeMessage(this.FinishedGameTimeoutSeconds);

    logger.info("Start Finished Countdown", this.state);

    this.gameStateTimeout = this.clock.setTimeout(() => {
      this.gameStateTimeout = null;

      this.game.reset();
      this.broadcastStateChangeMessage(0);
    
    }, (this.FinishedGameTimeoutSeconds + 1) * 1000);
  }

  handleBetMessage(client: Client, data: any) {
    if (this.state.gameState != GoldenFrogGameState.WaitingForAction &&
      this.state.gameState != GoldenFrogGameState.AcceptingBets) {
      return;
    }

    if (this.state.gameState == GoldenFrogGameState.WaitingForAction) {
      this.state.gameState = GoldenFrogGameState.AcceptingBets;
      this.broadcastStateChangeMessage(this.AcceptingBetTimeoutSeconds);
    }

    var player = this.state.players[client.sessionId];
    var wager = new GoldenFrogWager();
    wager.bankerWager = data.wager.bankerWager;
    wager.playerWager = data.wager.playerWager;
    wager.tieWager = data.wager.tieWager;

    wager.jinChan7Wager = data.wager.jinChan7Wager;
    wager.koi8Wager = data.wager.koi8Wager;

    wager.nineOverOneWager = data.wager.nineOverOneWager;
    wager.natural9Over7Wager = data.wager.natural9Over7Wager;
    wager.any8Over6Wager = data.wager.any8Over6Wager;

    this.game.placeBet(player, wager);

    this.broadcastWagerActionMessage(client.sessionId);

    this.startAcceptingBetCountdown();
  }

  onMessage(client: Client, data: any): void {
    switch (data.command) {
      case "bet":
        this.handleBetMessage(client, data);
        break;
    }
  }
}