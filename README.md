# Golden Frog Game Server
Backend server for the Golden Frog mobile game client.  Allows the client to play golden frog baccarat games and interacts with [Gamesparks](gamesparks.com) as a game backend.

## Prerequisites
+ Install [Node.JS](https://nodejs.org/)

## Configuration
All configuration is passed through environment variables.

1) Find your Gamesparks instance keys.  You can find this by logging in to Gamesparks and finding the "GameSparks API Key" and "GameSparks API Secret" you are deploying to.
2) Rename .env.example to .env
3) Edit the contents of .env and add the variables from step 1.


## Installation / Running Locally
Run the following commands:

```bash
npm install
npm start
```

## Testing
The server can be tested by connecting bots.
