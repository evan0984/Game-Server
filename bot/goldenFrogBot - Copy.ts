import { Room, Client } from 'colyseus.js';
var data = require("./accounts.json");
const gameSparks = require('gamesparks-node');
const util = require('util')

const GameSparksApiKey = "Y391137p9nZ7";
const GameSparksApiSecret = "yAzX6U0XzD0A3MvSjABChUZvg3ziei6a";

function makeRandomChoice(percentToTake) {
    var random = Math.random();

    if (random <= percentToTake) {
        return true;
    }
    else {
        return false;
    }
}

function onGameSparksMessage(m) {
    console.log("GS Message", m);
}

function onGameSparksInit() {
}

function onGameSparksError(e) {
    console.log("GS Error", e);
}

gameSparks.initPreviewListener(GameSparksApiKey, GameSparksApiSecret, 20, onGameSparksMessage, onGameSparksInit, onGameSparksError);
const sendAsPromise = util.promisify(gameSparks.sendAs);


export async function requestJoinOptions(this: Client, i: number) {
    var facebookToken = data.facebookAccessTokens[i];

    var resp = await sendAsPromise(null, '.FacebookConnectRequest', {
        'accessToken': facebookToken
    }
    );

    return { gameSparksPlayerId: resp.userId };
}

export function onJoin(this: Room) {
    console.log("joined.");

    this.send({
        command: "bet",
        wager: {
            bankerWager: 100,
            playerWager: 0,
            tieWager: 0,

            jinChan7Wager: 0,
            koi8Wager: 0,

            nineOverOneWager: 0,
            natural9Over7Wager: 0,
            any8Over6Wager: 0
        }
    })
}

export function onMessage(this: Room, message) {
    var obj = Object.assign({}, message);

    switch (obj.gameState) {
        case "WaitingForAction":
            this.send({
                command: "bet",
                wager: {
                    bankerWager: 100,
                    playerWager: 0,
                    tieWager: 0,
        
                    jinChan7Wager: 0,
                    koi8Wager: 0,
        
                    nineOverOneWager: 0,
                    natural9Over7Wager: 0,
                    any8Over6Wager: 0
                }
            })
            break;
    }

    console.log("Got Message: ", obj);
}

export function onLeave(this: Room) {
    console.log("left.");
}

export function onError(this: Room, err) {
    console.error("!! ERROR !!", err.message);
}

