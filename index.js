const crypto = require('crypto')
const uuid = require('uuid/v4');

/*
Provable fairness
------------------
Steps
1. Client: Request random seed from server
2. Server: Generate random seed (SS) and provide hash (SSH) to client
3. Client: Create random seed (CS) and send it to server
4. Server: Combine client seed with server seed and hash result (CSH)
5. Server: Determine game outcome from CSH and adjust internal values accordingly
6. Server: Send CSH to client, client will display same game outcome
7. Client: Verify game outcome
Subsequent rounds
Go back to step 3
*/

/* Shared values and functions */

const hashAlgorithm = 'sha256'

// Not very secure, look at using a true random generator such as https://api.random.org/json-rpc/1/
const getRandomHexSeed = () => crypto.randomBytes(128).toString('hex');

function sha256Hash(n){
  let hash = crypto.createHash(hashAlgorithm);
  hash.update(n)
  return hash.digest('hex')
}

// Function to determine the outcome of a dice game, for now just returns win if first value in hash hex is greater than 10
function diceOutcome(hash){
  let firstChar = parseInt(hash[0], 16)
  if(firstChar > 10) return 'won';
  return 'loss'
}

function gameOutcome(game){
  switch(game.gametype){
    case('dice'):
      return diceOutcome(game.outcomeHash)
    default:
      throw new Error('Unrecognized game type')
  }
}
/* End shared values and functions */

class Server {
  constructor(){
    this.games = {}
    this.gametypes = ['dice']
  }

  createGame(gametype){
    if(this.gametypes.indexOf(gametype) === -1) throw new Error('Unrecognized game type')
    let randomSeed = getRandomHexSeed()
    let game = {
      id: uuid(),
      gametype: gametype,
      serverSeed: randomSeed,
      serverSeedHash: sha256Hash(randomSeed)
    }
    console.log(`Server Output: New game \n\tid: ${game.id}\tgametype: ${game.gametype}`)
    this.games[game.id] = game
    return {
      id: game.id,
      serverSeedHash: game.serverSeedHash,
      gametype: gametype
    }
  }

  updateGame(id, clientSeed){
    if (!this.games[id]) throw Error('Unrecognized game id')
    let game = this.games[id]
    game.clientSeed = clientSeed
    game.outcomeHash = sha256Hash(game.clientSeed + game.serverSeed)
    game.outcome = gameOutcome(game)
    this.executeOutcome(game)
    console.log(`Server Output: Game finished\n\tid: ${game.id}\toutcome: ${game.outcome}`)
    return {
      outcome: game.outcome,
      serverSeed: game.serverSeed
    }
  }

  executeOutcome(game){
    // do something with outcome
  }
}

let server = new Server()

class Client {
  constructor(){
    this.games = {}
  }

  playGame(gametype){
    let game = server.createGame(gametype)
    this.games[game.id] = game
    console.log(`Client Output: New game\n\tid:${game.id}`)
    game.clientSeed = getRandomHexSeed()
    let result = server.updateGame(game.id, game.clientSeed)
    game.serverSeed = result.serverSeed
    game.outcome = result.outcome
    game.verified = this.verifyGame(game.id)
    console.log(`Client Output: Game finished\n\tid: ${game.id}\toutcome: ${game.outcome}\tverified: ${game.verified}`)
  }

  verifyGame(id){
    let game = this.games[id]
    let verifyHash = sha256Hash(game.serverSeed)
    if(verifyHash !== game.serverSeedHash) throw new Error('Rejected: server seed does not match supplied hash value')
    game.outcomeHash = sha256Hash(game.clientSeed + game.serverSeed)
    let outcome = gameOutcome(game)
    if(game.outcome !== outcome) throw new Error('Rejected: provided outcome does not match expected result')
    return true
  }
}

let client = new Client()
client.playGame('dice')
