GreedyNeuralNet = (function(__super) {
  // This is imported from Coffeescript's library, used for class inheritance
  (function (child, parent) {
    for (var key in parent) {
      if ({}.hasOwnProperty.call(parent, key)) child[key] = parent[key];
    }
    function ctor() {
      this.constructor = child;
    }

    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
    return child;
  })(GreedyNeuralNet, __super);

  /**
   * @constructor
   */
  function GreedyNeuralNet() {
    GreedyNeuralNet.__super__.constructor.apply(this, arguments);

    this.visualDelay = 500;
    this.visualizeState = false;
    this.keepHistory = true;
  }

  return GreedyNeuralNet;
})(Learner);

GreedyNeuralNet.prototype.reward = rewardHighestPunishGameOver;

Learner.prototype.resetState = function() {
  // die network die
  this.network = undefined;
  this.state = {
    previousScore: 0,
    highestTile: 0,
    moves: 0,
    gamesPlayed: 0
  };
};

GreedyNeuralNet.prototype.prepare = function() {
  // Just keep using the old network for the new rounds
  if (!this.network) {
    throw "Greedy Neural Net only works with a trained neural net!"
  } else {
    switch (this.network.layers.input.size) {
      case 20:
        this.input = inputGrid;
        console.info("set input to inputGrid");
        break;
      case 164:
        this.input = inputTilings;
        console.info("set input to inputTilings");
        break;
      default:
        throw "UNSUPPORTED NETWORK INPUTS"
    }
  }

  this.state = this.state || {};
  // long term state, over multiple sessions (keep values)
  _.defaults(this.state, {
    gamesPlayed: 0
  });

  // state for a single session, overwrite previous values
  _.extend(this.state, {
    highestTile: 0,
    moves: 0
  });
};

var inputGrid = function(move) {
  var moveBits = [0, 0, 0, 0];
  if (move) {
    moveBits[move] = 1;
  }
  var tiles = this.grid.flatten();
  for (var i = 0; i < tiles.length; i++) {
    if (tiles[i])
      tiles[i] = Math.log2(tiles[i].value);
    else
      tiles[i] = 0;
  }
  return [].concat(moveBits, tiles);
};

var inputExtended = function(move) {
  var moveBits = [0, 0, 0, 0];
  if (move) {
    moveBits[move] = 1;
  }
  var tiles = this.grid.flatten();
  for (var i = 0; i < tiles.length; i++) {
    if (tiles[i])
      tiles[i] = Math.log2(tiles[i].value);
    else
      tiles[i] = 0;
  }
  var occupiedCells = this.size * this.size - this.grid.availableCells().length;
  // rows and columns get mixed up but its not so bad
  var rowCounts = new Array(this.size);
  var colCounts = new Array(this.size);
  _.fill(rowCounts, 0);
  _.fill(colCounts, 0);

  var previousX = new Array(this.size);
  var previousY = new Array(this.size);
  _.fill(previousX, 0);
  _.fill(previousY, 0);

  var monotoneX = new Array(this.size);
  var monotoneY = new Array(this.size);
  _.fill(monotoneX, 0);
  _.fill(monotoneY, 0);

  var tile;
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (tile = this.grid.cells[x][y]) {
        rowCounts[x] += 1;
        colCounts[y] += 1;
        monotoneX[x] += (tile.value >= previousX[x]) ? 1 : -1
        monotoneY[y] += (tile.value >= previousY[y]) ? 1 : -1

        previousX[x] = tile.value;
        previousY[y] = tile.value
      }
    }
  }


  return [].concat(moveBits, tiles, monotoneX, monotoneY);
};

var inputTilings = function(move) {
  var moveBits = [0, 0, 0, 0];
  if (move) {
    moveBits[move] = 1;
  }
  // 10 * 16 features
  // 10 tiles, 0 to 9
  var activeTiling = Math.round(Math.log2(this.grid.highestTile().value) - 1);
  var emptyBefore = _.fill(new Array(activeTiling * this.size * this.size), 0);
  var emptyAfter = _.fill(new Array((9 - activeTiling) * this.size * this.size), 0);
  var tiles = this.grid.flatten();
  for (var i = 0; i < tiles.length; i++) {
    if (tiles[i])
      tiles[i] = Math.log2(tiles[i].value);
    else
      tiles[i] = 0;
  }
  return [].concat(moveBits, emptyBefore, tiles, emptyAfter);
};

GreedyNeuralNet.prototype.activate = function(input) {
  return this.network.activate(input)[0] * 2048;
};


GreedyNeuralNet.prototype.think = function () {
  var self = this;
  var chosenMove, chosenStateAction;
  var Q, maxQ;
  var input;

  // explore with epsilon chance
  var availableMoves = this.availableMoves();
  maxQ = -Infinity;
  availableMoves.forEach (function(moveCandidate) {
    input = self.input(moveCandidate);
    Q = self.activate(input);
    if (Q > maxQ) {
      chosenStateAction = input;
      maxQ = Q;
      chosenMove = moveCandidate
    }
  });


  // Do move and get reward
  this.move(chosenMove);

  // finish up
  this.state.highestTile = this.grid.highestTile().value;
  this.state.moves += 1;

};

GreedyNeuralNet.prototype.toggleDebug = function () {
  this.debug = !this.debug;
};

GreedyNeuralNet.prototype.serializeState = function () {
  // this is where we can serialize learner state like function params
  var serialized = {};
  var key;
  for (key in this.state) serialized[key] = this.state[key];
  if (this.network) {
    serialized.network = this.network.toJSON();
  }
  return serialized;
};

GreedyNeuralNet.prototype.deserializeState = function (state) {
  if (state.network) {
    this.network = Network.fromJSON(state.network);
  } else {
    throw "NO VALID NETWORK FOUND";
  }
};

GreedyNeuralNet.prototype.whenGameFinishes = function () {
  GreedyNeuralNet.__super__.whenGameFinishes.apply(this, arguments);
  this.state.gamesPlayed += 1;

  if (this.keepHistory) {
    if (_.isEmpty(this.history)) {
      this.history = {
        score: [],
        highest: [],
        moves: []
      }
    }
    this.history.score.push(this.score);
    this.history.highest.push(this.grid.highestTile().value);
    this.history.moves.push(this.state.moves);
  }
};

Learner.prototype.showState = function() {
  if (this.visualizeState)
    this.actuator.showState(this.serializeState());
};


GreedyNeuralNet.prototype.availableMoves = function () {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;
  var cell, tile;
  var vector;
  var traversals;
  var moved;
  var x, y;
  var availableMoves = [];
  var direction;
  var directions = [0, 1, 2, 3];

  this.prepareTiles();

  for (var i = 0; i < directions.length; i++) {
    direction = directions[i];
    vector     = this.getVector(direction);
    traversals = this.buildTraversals(vector);
    moved = false;

    // Traverse the grid in the right direction and move tiles
    for (var j = 0; j < traversals.x.length; j++){
      x = traversals.x[j];
      for (var k = 0; k < traversals.y.length; k++) {
        y = traversals.y[k];
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);

        if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next      = self.grid.cellContent(positions.next);

          if ((next && next.value === tile.value && !next.mergedFrom) ||
              !this.positionsEqual(tile, positions.farthest)) {
            moved = true;
            availableMoves.push(direction);
            break;
          }
        }
      }
      if (moved) break;
    }
  }

  return availableMoves;
};

