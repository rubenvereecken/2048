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
    this.learnRate = 0.1;
  }

  return NeuralNetLearner;
})(Learner);

var maybe = function(p) {
  return p < Math.random();
};


NeuralNetLearner.prototype.reward = function() {
  // Base reward is difference between current score and previous score
  var score = this.score - this.state.previousScore;
  // Give an extra reward if a new highest tile has been reached
  score += this.state.highestTile - this.grid.highestTile().value;
  return score;
};

NeuralNetLearner.prototype.prepare = function() {
  this.network = new synaptic.Architect.Perceptron(20, 25, 4);
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
  return [].concat(moveBits, this.grid.flatten());
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

  // explore with epsilon chance
  if (maybe(this.epsilon)) {
    move = _.random(0, 3);
    chosen = this.input(move);
  } else {
    var maxQ = 0;
    for (var moveCandidate in [0, 1, 2, 3]) {
      var input = this.input(moveCandidate);
      var Q = this.network.activate(input);
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
  // do the move again so the neural net is prepared to backpropagate the value
  // TODO wtf
  this.activate(chosen);
  this.propagate();

  // finish up
  this.state.previousScore = this.score;
  this.state.highestTile = this.grid.highestTile().value;

};

NeuralNetLearner.prototype.serializeState = function () {
  // this is where we can serialize learner state like function params
  var serialized = _.copy(this.state);
  _.extend(serialized, this.network.toJSON());
  return serialized;
};
