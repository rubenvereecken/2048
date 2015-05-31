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
    this.learnRate = 0.45;
    this.gamma = 0.95;
    this.networkRate = 0.1;
  }

  return NeuralNetLearner;
})(Learner);

var maybe = function(p) {
  return p >= Math.random();
};

NeuralNetLearner.MAX_REWARD = 2048;

NeuralNetLearner.prototype.reward = function() {
  // Base reward is difference between current score and previous score
  // every merge thisis the value of the resulting tile
  var score = this.score - this.state.previousScore;
  if (score > NeuralNetLearner.MAX_REWARD)
    console.debug("Exceeded max reward " + score);
  // Give an extra reward if a new highest tile has been reached, proportional to its value
  var currentHighest = this.grid.highestTile().value;
  if (currentHighest > this.state.highestTile)
    score += this.state.highestTile;*/

  score /= NeuralNetLearner.MAX_REWARD;

  return score;
};

Learner.prototype.resetState = function() {
  this.network = undefined;
  this.state = {
    previousScore: 0,
    totalReward: 0,
    highestTile: 0
  };
};

NeuralNetLearner.prototype.prepare = function() {
  // Just keep using the old network for the new rounds
  if (!this.network)
    this.network = new synaptic.Architect.Perceptron(20,25, 1);
  this.state = {
    previousScore: this.score,
    totalReward: 0,
    highestTile: 0
  };
};

NeuralNetLearner.prototype.input = function(move) {
  var moveBits = [0, 0, 0, 0];
  if (move) {
    moveBits[move] = 1;
  }
  var tiles = this.grid.flatten();
  for (var i = 0; i < tiles.length; i++) {
    if (tiles[i])
      tiles[i] = Math.log2(tiles[i].value)/11;
    else
      tiles[i] = 0;
  }
  return [].concat(moveBits, tiles);
};

NeuralNetLearner.prototype.vectorFromMove = function(move) {
  var moveBits = [0, 0, 0, 0];
  moveBits[move] = 1;
  return moveBits;
};

NeuralNetLearner.prototype.think = function () {
  var reward;
  var move;
  var chosen;
  var Q, maxQ;
  var moveCandidate, input;


  // explore with epsilon chance
  if (maybe(this.epsilon)) {
    move = _.random(0, 3);
    chosen = this.input(move);
  } else {
    maxQ = 0;
    for (moveCandidate in [0, 1, 2, 3]) {
      input = this.input(moveCandidate);
      Q = this.network.activate(input)[0];
      if (Q > maxQ) {
        chosen = input;
        maxQ = Q;
        move = moveCandidate
      }
    }
  }

  // Do move and get reward
  this.move(move);
  reward = this.reward();
  this.state.totalReward += reward;

  // Update
  // Find the highest new Q value Q(s', a')
  maxQ = 0;
  for (moveCandidate in [0, 1, 2, 3]) {
    // this uses the new state we're currently in
    input = this.input(moveCandidate);
    Q = this.network.activate(input)[0];
    if (Q > maxQ) {
      chosen = input;
      maxQ = Q;
      move = moveCandidate;
    }
  }

  // do the move again so the neural net is prepared to backpropagate the value
  var oldQ = this.network.activate(chosen)[0];
  var newQ = oldQ + this.learnRate * (reward + this.gamma * maxQ - oldQ);
  this.network.propagate(this.networkRate, [newQ]);
  // finish up
  this.state.previousScore = this.score;
  this.state.highestTile = this.grid.highestTile().value;

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
