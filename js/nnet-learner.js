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
    this.hiddenLayerSize = 15;

    // these two influence each other...
    this.learnRate = 0.5;
    this.networkRate = 0.3;

    //for softmax
    this.temperature = 0.1;

    this.visualDelay = 500;
    this.visualizeState = false;
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

var rewardHighestPunishOtherwise = function() {
  var score = 0;
  var currentHighest = this.grid.highestTile().value;
  if (currentHighest > this.state.highestTile)
    score += currentHighest;
  else score -= 1;
  return score;
};

var rewardBasedOnGameScore = function() {
  // Base reward is difference between current score and previous score
  // every merge thisis the value of the resulting tile
  var score = this.score - this.state.previousScore;
  if (score > NeuralNetLearner.MAX_REWARD)
    console.debug("Exceeded max reward " + score);
  // Give an extra reward if a new highest tile has been reached, proportional to its value
/*  var currentHighest = this.grid.highestTile().value;
  if (currentHighest > this.state.highestTile)
    score += currentHighest;*/
  return score / NeuralNetLearner.MAX_REWARD;
};

NeuralNetLearner.prototype.reward = rewardHighestOnly;

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

var prefixSum = function (arr) {
  var builder = function (acc, n) {
    var lastNum = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(lastNum + n);
    return acc;
  };
  return _.reduce(arr, builder, []);
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
  return this.network.propagate(this.networkRate, [adjusted]);
};

NeuralNetLearner.prototype.think = function () {
  var reward;
  var move;
  var chosen;
  var Q, maxQ;
  var moveCandidate, input;

  var availableMoves = this.availableMoves();
  //softmax exploration
  var gibsFactors = [];
  for (var i = 0; i < availableMoves.length; i++) {
    moveCandidate = availableMoves[i];
    input = this.input(moveCandidate);
    Q = this.activate(input);
    gibsFactors.push(Math.exp(Q/this.temperature));
  }
  var sum=0;
  for (var i=gibsFactors.length; i--;) {
    sum+=gibsFactors[i];
  }
  for (index = 0; index < gibsFactors.length; index++) {
    gibsFactors[index] /= sum;
  }
  //cummulative distribution
  var distr = prefixSum(gibsFactors);
  // select action
  move = Math.random();
  for (index = 0; index < distr.length; index++) {
    if(move <= distr[index]){
      move = availableMoves[index];
      break;
    }
  }

  /*
   // explore with epsilon chance
  if (maybe(this.epsilon)) {
    move = _.sample(availableMoves);
    chosen = this.input(move);
  } else {
    maxQ = -Infinity;
    for (var i = 0; i < availableMoves.length; i++) {
      moveCandidate = availableMoves[i];
      input = this.input(moveCandidate);
      Q = this.activate(input);
      if (Q > maxQ) {
        chosen = input;
        maxQ = Q;
        move = moveCandidate
      }
    }
  }
  */

  console.log(move);
  // Do move and get reward
  this.move(move);
  reward = this.reward();

  // Update
  // Find the highest new Q value Q(s', a')
  maxQ = 0;
  availableMoves = this.availableMoves();
  for (var i = 0; i < availableMoves.length; i++) {
    moveCandidate = availableMoves[i];
    // this uses the new state we're currently in
    input = this.input(moveCandidate);
    Q = this.activate(input);
    if (Q > maxQ) {
      chosen = input;
      maxQ = Q;
      move = moveCandidate;
    }
  }

  // do the move again so the neural net is prepared to backpropagate the value
  var oldQ = this.activate(chosen);
  var newQ = oldQ + this.learnRate * (reward + this.gamma * maxQ - oldQ);
  this.propagate(newQ);
  if (this.debug)
    console.debug("reward = " + reward + " oldQ = " + oldQ + " newQ = " + newQ + " finalQ = " + this.activate(chosen));

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
  this.history[this.roundsPlayed] = {
    score: this.score,
    reward: this.state.totalReward,
    highestTile: this.grid.highestTile().value,
    moves: this.state.moves
  }
  this.state.gamesPlayed += 1;
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

