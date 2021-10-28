import { BaccaratGameEngine, BaccaratResultsEngine, Hand, GameResult } from "baccarat-engine";


export class GoldenFrogSideBetResults {
    isKoi8: boolean;
    isJinChan7: boolean;

    isNineOverOne: boolean;
    isNatural9Over7: boolean;
    isAny8Over6: boolean;
}

export class GoldenFrogSideBets {
    resultsEngine: BaccaratResultsEngine = new BaccaratResultsEngine();

    public calculateSideBets(hand: Hand) : GoldenFrogSideBetResults {
        var result = new GoldenFrogSideBetResults();
        result.isKoi8 = this.isKoi8(hand);
        result.isJinChan7 = this.isJinChan7(hand);

        result.isNineOverOne = this.isNineOverOne(hand);
        result.isNatural9Over7 = this.isNatural9Over7(hand);
        result.isAny8Over6 = this.isAny8Over6(hand);

        return result;
    }

    public isKoi8(hand: Hand) : boolean {
        var baseEvaluation = this.resultsEngine.calculateGameResult(hand);

        if (baseEvaluation.outcome == GameResult.Player) {
            var value = this.resultsEngine.calculateHandValue(hand.playerCards);

            return value == 8 && hand.playerCards.length == 3;
        }

        return false;
    }

    public isJinChan7(hand: Hand) : boolean {
        var baseEvaluation = this.resultsEngine.calculateGameResult(hand);

        if (baseEvaluation.outcome == GameResult.Banker) {
            var value = this.resultsEngine.calculateHandValue(hand.bankerCards);

            return value == 7 && hand.bankerCards.length == 3;
        }

        return false;
    }

    public isNineOverOne(hand: Hand) : boolean {
        var baseEvaluation = this.resultsEngine.calculateGameResult(hand);

        if (baseEvaluation.outcome != GameResult.Tie) {
            var bankerValue = this.resultsEngine.calculateHandValue(hand.bankerCards);
            var playerValue = this.resultsEngine.calculateHandValue(hand.playerCards);

            var bankerCards = hand.bankerCards.length;
            var playerCards = hand.playerCards.length;

            if (bankerCards != 3 || playerCards != 3) {
                return false;
            }

            return (playerValue == 9 && bankerValue == 1) || (playerValue == 1 && bankerValue == 9);
        }

        return false;
    }

    public isNatural9Over7(hand: Hand) : boolean {
        var baseEvaluation = this.resultsEngine.calculateGameResult(hand);

        if (baseEvaluation.outcome != GameResult.Tie) {
            if (baseEvaluation.natural == GameResult.PlayerNatural9) {
                var bankerValue = this.resultsEngine.calculateHandValue(hand.bankerCards);

                return bankerValue == 7;
            }
            else if (baseEvaluation.natural == GameResult.BankerNatural9) {
                var playerValue = this.resultsEngine.calculateHandValue(hand.playerCards);

                return playerValue == 7;
            }
        }

        return false;
    }

    public isAny8Over6(hand: Hand) : boolean {
        var baseEvaluation = this.resultsEngine.calculateGameResult(hand);

        if (baseEvaluation.outcome != GameResult.Tie) {
            var bankerValue = this.resultsEngine.calculateHandValue(hand.bankerCards);
            var playerValue = this.resultsEngine.calculateHandValue(hand.playerCards);

            if (bankerValue == 8 && playerValue == 6) {
                return true;
            }
            if (playerValue == 8 && bankerValue == 6) {
                return true;
            }
        }

        return false;
    }
}