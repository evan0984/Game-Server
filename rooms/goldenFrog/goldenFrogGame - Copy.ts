import { GoldenFrogState, GoldenFrogPlayer, GoldenFrogWager, GoldenFrogGameState, GoldenFrogEvaluation, GoldenFrogGameHistory, GoldenFrogTable } from "./goldenFrogState";
import { BaccaratGameEngine, BaccaratResultsEngine, Hand, GameResult, RoadmapGenerator } from "baccarat-engine";
import { GoldenFrogSideBets, GoldenFrogSideBetResults } from "./goldenFrogSideBets";

export class GoldenFrogGame {
    baccaratGameEngine : BaccaratGameEngine = new BaccaratGameEngine();
    resultsEngine: BaccaratResultsEngine = new BaccaratResultsEngine();
    sideBets: GoldenFrogSideBets = new GoldenFrogSideBets();
    roadmapGenerator: RoadmapGenerator = new RoadmapGenerator();
    hand: Hand;
    gameNumber: number = 0;

    constructor(private state: GoldenFrogState) {
    }

    placeBet(player: GoldenFrogPlayer, wager: GoldenFrogWager) {
        if (this.state.gameState != GoldenFrogGameState.WaitingForAction &&
            this.state.gameState != GoldenFrogGameState.AcceptingBets) {
            return;
        }

        var totalWager = wager.bankerWager + wager.playerWager + wager.tieWager + wager.jinChan7Wager + wager.koi8Wager;
        totalWager += wager.nineOverOneWager + wager.natural9Over7Wager + wager.any8Over6Wager;

        if (totalWager > player.credits) {
            return;
        }

        player.isObserving = false;
        player.wager = wager.clone();
    }

    deal() {
        if (this.state.gameState != GoldenFrogGameState.AcceptingBets) {
            return;
        }

        this.hand = this.baccaratGameEngine.dealGame();

        this.state.table.playerCard1 = this.cardToString(this.hand.playerCards[0]);
        this.state.table.playerCard2 = this.cardToString(this.hand.playerCards[1]);
        if (this.hand.playerCards.length == 3)
            this.state.table.playerCard3 = this.cardToString(this.hand.playerCards[2]);
        this.state.table.bankerCard1 = this.cardToString(this.hand.bankerCards[0]);
        this.state.table.bankerCard2 = this.cardToString(this.hand.bankerCards[1]);
        if (this.hand.bankerCards.length == 3)
            this.state.table.bankerCard3 = this.cardToString(this.hand.bankerCards[2]);

        this.state.gameState = GoldenFrogGameState.InitialHandDealt;
    }

    evaluate() {
        var result = this.resultsEngine.calculateGameResult(this.hand);
        var sideBetResults = this.sideBets.calculateSideBets(this.hand);
        result.sideBetResults = sideBetResults;

        // Game Results To State
        this.state.evaluation.outcome = result.outcome;
        this.state.evaluation.isKoi8 = sideBetResults.isKoi8;
        this.state.evaluation.isJinChan7 = sideBetResults.isJinChan7;

        this.state.evaluation.isNineOverOne = sideBetResults.isNineOverOne;
        this.state.evaluation.isNatural9Over7 = sideBetResults.isNatural9Over7;
        this.state.evaluation.isAny8Over6 = sideBetResults.isAny8Over6;

        // Game History
        var gameHistory = new GoldenFrogGameHistory();
        gameHistory.gameNumber = this.gameNumber;
        gameHistory.evaluation = this.state.evaluation.clone();
        gameHistory.table = this.state.table.clone();
        this.state.gameHistory.push(gameHistory);
        this.gameNumber++;

        // Calculate Payouts
        for (var sessionId in this.state.players) {
            let player = this.state.players[sessionId];

            if (result.outcome == GameResult.Tie) {
                // Return their player and banker wager
                player.payout.playerPayout = player.wager.playerWager;
                player.payout.bankerPayout = player.wager.bankerWager;

                player.payout.tiePayout = player.wager.tieWager * 8;
            }
            else if (result.outcome == GameResult.Banker) {
                player.payout.bankerPayout = player.wager.bankerWager * 2;
            }
            else if (result.outcome == GameResult.Player) {
                player.payout.playerPayout = player.wager.playerWager * 2;
            }

            if (sideBetResults.isKoi8) {
                player.payout.koi8Payout = player.wager.koi8Wager * 25;
            }
            if (sideBetResults.isJinChan7) {
                player.payout.jinChan7Payout = player.wager.jinChan7Wager * 40;
            }

            if (sideBetResults.isNineOverOne) {
                player.payout.nineOverOnePayout = player.wager.nineOverOneWager * 150;
            }
            if (sideBetResults.isNatural9Over7) {
                player.payout.natural9Over7Payout = player.wager.natural9Over7Wager * 50;
            }
            if (sideBetResults.isAny8Over6) {
                player.payout.any8Over6Payout = player.wager.any8Over6Wager * 25
            }
        }
    }

    reset() {
        if (this.state.gameState != GoldenFrogGameState.Finished) {
            return;
        }

        for (var sessionId in this.state.players) {
            let player = this.state.players[sessionId];
    
            player.reset();
        }

        this.state.table = new GoldenFrogTable();
        this.state.evaluation = new GoldenFrogEvaluation();

        this.state.gameState = GoldenFrogGameState.WaitingForAction;
    }

    cardToString(card: any) {
        var suit = "";
        var value = "";

        switch (card.suit) {
            case "club":
                suit = "c";
                break;
            case "diamond":
                suit = "d";
                break;
            case "heart":
                suit = "h";
                break;
            case "spade":
                suit = "s";
                break;
        }

        value = card.value;
        if (value == '10')
            value = 'T';

        return value + suit;
    }
}