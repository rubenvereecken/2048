NeuralNetLearner = (function(__super) {
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
  })(NeuralNetLearner, __super);

  /**
   * @constructor
   */
  function NeuralNetLearner() {
    NeuralNetLearner.__super__.constructor.apply(this, arguments);


    this.epsilon = 0.1;
    this.gamma = 0.95;
    this.hiddenLayerSize = 25;

    // these two influence each other...
    this.learnRate = 0.5;
    this.networkRate = 0.75;

    this.visualDelay = 500;
    this.visualizeState = false;
    this.keepHistory = true;
  }

  return NeuralNetLearner;
})(Learner);

var maybe = function(p) {
  return p >= Math.random();
};

NeuralNetLearner.MAX_REWARD = 2048;

/**
 * Reward only if new merge is higher
 * @returns {number}
 */
var rewardHighestOnly = function() {
  var score = 0;
  var currentHighest = this.grid.highestTile().value;
  if (currentHighest > this.state.highestTile)
    score += currentHighest;
  return score;
};

var rewardHighestPunishGameOver = function() {
  var score = 0;
  var currentHighest = this.grid.highestTile().value;
  if (currentHighest > this.state.highestTile)
    score += currentHighest;
  if (this.over && !this.won)
    score -= 1024;
  return score;
};

var rewardBasedOnGameScore = function() {
  // Base reward is difference between current score and previous score
  // every merge thisis the value of the resulting tile
  var score = this.score - this.state.previousScore;
  // Give an extra reward if a new highest tile has been reached, proportional to its value
/*  var currentHighest = this.grid.highestTile().value;
  if (currentHighest > this.state.highestTile)
    score += currentHighest;*/
  if (this.over && !this.won)
    score -= 1024;
  return score;
};

NeuralNetLearner.prototype.reward = rewardHighestPunishGameOver;

Learner.prototype.resetState = function() {
  // die network die
  this.network = undefined;
  this.state = {
    previousScore: 0,
    totalReward: 0,
    highestTile: 0,
    moves: 0,
    gamesPlayed: 0
  };
};

NeuralNetLearner.prototype.prepare = function() {
  // Just keep using the old network for the new rounds
  if (!this.network) {
    this.network = new synaptic.Architect.Perceptron(NeuralNetLearner.networkInputSize, this.hiddenLayerSize, 1);
/*    this.network.neurons().forEach(function (neuron) {
      neuron.neuron.squash = Neuron.squash.IDENTITY;
    });*/
    // fuck you neural net
    for (var i = 0; i < 100000; i++) {
      this.activate(this.input(_.random(0, 3)));
      this.network.propagate(1, [0]);
    }
  }

  // long term state, over multiple sessions (keep values)
  _.defaults(this.state, {
    gamesPlayed: 0
  });

  // state for a single session, overwrite previous values
  _.extend(this.state, {
    previousScore: this.score,
    totalReward: 0,
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
        monotoneX[x] += (tile.value >= previousX[x]) ? 1 : -1;
        monotoneY[y] += (tile.value >= previousY[y]) ? 1 : -1;

        previousX[x] = tile.value;
        previousY[y] = tile.value;
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

NeuralNetLearner.prototype.input = inputGrid;
NeuralNetLearner.networkInputSize = 20; // 20 or 164

NeuralNetLearner.prototype.activate = function(input) {
  return this.network.activate(input)[0] * NeuralNetLearner.MAX_REWARD;
};

NeuralNetLearner.prototype.propagate = function(val) {
  // adjusted should be in [0, 1]
  var adjusted = val / NeuralNetLearner.MAX_REWARD;
  adjusted = adjusted > 0 ? adjusted : 0;
  return this.network.propagate(this.networkRate, [adjusted]);
};

NeuralNetLearner.prototype.think = function () {
  var self = this;
  var chosenMove, chosenStateAction;
  var Q, maxQ;
  var input;


  // explore with epsilon chance
  var availableMoves = this.availableMoves();
  if (maybe(this.epsilon)) {
    chosenMove = _.sample(availableMoves);
    chosenStateAction = this.input(chosenMove);
  } else {
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
  }

  // Do move and get reward
  this.move(chosenMove);
  var reward = this.reward();

  // Update
  // Find the highest new Q value Q(s', a')
  maxQ = -Infinity;
  availableMoves.forEach (function(moveCandidate) {
    input = self.input(moveCandidate);
    Q = self.activate(input);
    if (Q > maxQ) {
      maxQ = Q;
    }
  });

  // do the move again so the neural net is prepared to backpropagate the value
  var oldQ = this.activate(chosenStateAction);
  var newQ = oldQ + this.learnRate * (reward + this.gamma * maxQ - oldQ);
  //for (i in _.range(10))
    this.propagate(newQ);

  if (this.debug)
    console.debug("reward = " + reward + " oldQ = " + oldQ + " newQ = " + newQ +" finalQ = " + this.activate(chosenStateAction));

  // finish up
  this.state.previousScore = this.score;
  this.state.highestTile = this.grid.highestTile().value;
  this.state.moves += 1;
  this.state.totalReward += reward;

};

NeuralNetLearner.prototype.toggleDebug = function () {
  this.debug = !this.debug;
};

NeuralNetLearner.prototype.serializeState = function () {
  // this is where we can serialize learner state like function params
  var serialized = {};
  var key;
  for (key in this.state) serialized[key] = this.state[key];
  if (this.network) {
    serialized.network = this.network.toJSON();
  }
  return serialized;
};

NeuralNetLearner.prototype.deserializeState = function (state) {
  this.state = state;
  if (state.network) {
    this.network = Network.fromJSON(state.network);
    delete this.state.network;
  }
};

NeuralNetLearner.prototype.stop = function () {
  NeuralNetLearner.__super__.stop.apply(this, arguments);
};

NeuralNetLearner.prototype.whenGameFinishes = function () {
  NeuralNetLearner.__super__.whenGameFinishes.apply(this, arguments);
  this.state.gamesPlayed += 1;

  if (this.keepHistory) {
    if (_.isEmpty(this.history)) {
      this.history = {
        score: [],
        reward: [],
        highest: [],
        moves: []
      }
    }
    this.history.score.push(this.score);
    this.history.reward.push(this.state.totalReward);
    this.history.highest.push(this.grid.highestTile().value);
    this.history.moves.push(this.state.moves);
  }
};

Learner.prototype.showState = function() {
  if (this.visualizeState)
    this.actuator.showState(this.serializeState());
};


NeuralNetLearner.prototype.availableMoves = function () {
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

