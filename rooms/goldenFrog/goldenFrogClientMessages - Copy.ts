import { type, Schema, MapSchema, ArraySchema } from '@colyseus/schema';

export class GoldenFrogGameStateChanged extends Schema {
    @type("string") gameState: string;
    @type("int32") gameStateCountdown: number;
}

export class GoldenFrogWagerAction extends Schema {
    @type("string") playerSessionId;
}