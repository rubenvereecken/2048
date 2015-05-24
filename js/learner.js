// This is imported from Coffeescript's library, used for class inheritance
__extends = function (child, parent) {
  for (var key in parent) {
    if (__hasProp.call(parent, key)) child[key] = parent[key];
  }
  function ctor() {
    this.constructor = child;
  }

  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
};

function randomMove() {
  return Math.floor(Math.random() * 4);
}

function Learner() {
  Learner.__super__.constructor.apply(this, arguments);
  var self = this;
  this.actuator = new HTMLActuator();

  this.bindButtonPress(".start-learner", this.start);
  this.newGame = true;
  this.started = false;
}

__extends(Learner, KeyboardInputManager);

Learner.moves = {
  up: 0,
  right: 1,
  down: 2,
  left: 3
};

Learner.prototype.continueGame = function () {
  this.actuator.clearMessage();
};

Learner.prototype.move = function (where) {
  if (!isFinite(where)) where = Learner.moves[where];
  this.emit("move", where);
};

/**
 * Called to start the learner
 * @param event
 */
Learner.prototype.start = function (event) {
  event.preventDefault();
  console.debug("start AI");
  this.newGame = true;
  this.started = true;
  this.actuate(this.grid, _.extend(this.state, {dontVisualize: true}));
}

/**
 * Called to restart a single game run
 * @param event
 */
Learner.prototype.restart = function (event) {
  console.debug("restart");
  this.newGame = true;
  Learner.__super__.restart.apply(this, arguments);
};

Learner.prototype.keepPlaying = function (event) {
  event.preventDefault();
  console.debug("keep playing");
  this.emit("keepPlaying");
}

/**
 *
 * @param grid column-wise array
 * @param state
 *  {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(),
    terminated: this.isGameTerminated()
    }
 */
Learner.prototype.actuate = function (grid, state) {
  console.log(arguments);
  // gets value updates
  var self = this;

  if (this.started) {
    _.delay(function() {
      self.move(randomMove());
    }, 500);
  }

  this.grid = grid;
  this.state = state;

  //console.log(this.gameManager.movesAvailable());


  // visualize
  if (!state.dontVisualize)
    this.actuator.actuate.apply(this.actuator, arguments);
}
//_.extend(Learner.prototype, new HTMLActuator());
