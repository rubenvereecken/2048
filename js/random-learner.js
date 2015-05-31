RandomLearner = (function(__super) {
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
  })(RandomLearner, __super);

  /**
   * @constructor
   */
  function RandomLearner() {
    RandomLearner.__super__.constructor.apply(this, arguments);
  }

  return RandomLearner;
})(Learner);


RandomLearner.prototype.prepare = function() {
  this.state = {moves: 0};
};

RandomLearner.prototype.think = function () {
  this.move(_.random(0, 3));
  this.state.moves += 1;
};

RandomLearner.prototype.whenGameFinishes = function () {
  RandomLearner.__super__.whenGameFinishes.apply(this, arguments);
  this.history[this.roundsPlayed] = {
    score: this.score,
    highestTile: this.grid.highestTile().value,
    moves: this.state.moves
  }
};
