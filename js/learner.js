Learner = (function(__super) {
  // This is imported from Coffeescript's library, used for class inheritance
  (function (child, parent) {
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
  })(Learner, __super);

  /**
   * @constructor
   */
  function Learner() {
    this.running = false;
    this.visualDelay = 5;

    Learner.__super__.constructor.apply(this, arguments);
    this.visual = this.storageManager.get('visual') || false;
    $('#toggle-visual').prop('checked', this.visual);

    this.originalRounds = this.storageManager.get('rounds') || 1000;
    this.roundsLeft = this.originalRounds;
    $('#learner-rounds').val(this.originalRounds);

    var storedState = this.storageManager.get('learner-state');
    if (storedState)
      this.deserializeState(storedState);
    this.history = {};

    this.inputManager.on("startLearner", this.start.bind(this));
    this.inputManager.on("stopLearner", this.stop.bind(this));
    this.inputManager.on("saveLearner", this.save.bind(this));
    this.inputManager.on("resetLearner", this.reset.bind(this));
    this.inputManager.on("loadState", this.loadState.bind(this));
    this.inputManager.on("toggleVisual", this.toggleVisual.bind(this));

    // asyncThink's `this` will now always point to the `this` object
    this.asyncThink = this.asyncThink.bind(this);

    this.showState();
    window.AI = this;
  }

  return Learner;
})(GameManager);

function NotImplementedException() {
  this.message = "Method not implemented";
}

Learner.moves = {
  up: 0,
  right: 1,
  down: 2,
  left: 3
};

Learner.prototype.serializeState = function () {
  // this is where we can serialize learner state like function params
  return this.state;
};

Learner.prototype.deserializeState = function(state) {
  this.state = state;
};

Learner.prototype.loadState = function (state) {
  this.deserializeState(state);
  this.showState();
  console.debug("Successfully loaded state");
};

Learner.prototype.toggleVisual = function (on) {
  this.visual = on;
  this.storageManager.set('visual', on);
  if (this.visual && this.running) this.actuate();
  else this.actuator.actuate( new Grid(this.size), {
    score: 0,
    bestScore: 0
  });
};

Learner.prototype.showState = function() {
  this.actuator.showState(this.serializeState());
};

Learner.prototype.serialize = function() {
  // TODO remove this
  // I kind of stopped caring about game state sometime ago
  //var s = Learner.__super__.serialize.apply(this, arguments);
  // if any inner state has to be saved do it here
  var s = {};
  return _.extend(s, this.serializeState());
};

Learner.prototype.save = function() {
  this.storageManager.set("learner-state", this.serialize());
  console.info("Successfully saved AI state");
};

/**
 * Usually `think` will call move
 * @param where
 */
Learner.prototype.move = function (where) {
  Learner.__super__.move.apply(this, arguments);
};

/**
 * Resets the internal state of the AI
 */
Learner.prototype.reset = function() {
  console.debug("AI reset");
  this.storageManager.setBestScore(0);
  this.resetState();
  this.showState();
};

Learner.prototype.setup = function() {
  Learner.__super__.setup.apply(this, arguments);
  this.showState();
};

/**
 * Called to start the learner
 * @param event
 */
Learner.prototype.start = function (rounds) {
  console.info("AI started (" + rounds + " rounds)" );
  this.roundsLeft = rounds;
  this.originalRounds = rounds;
  this.storageManager.set('rounds', rounds);
  this.running = true;
  this.showState();
  // TODO maybe we don't want to restart? worth a thought
  this.restart();
};

Learner.prototype.stop = function () {
  console.debug("AI stopped");
  this.running = false;
  this.roundsLeft = 0;
  this.storageManager.setBestScore(0);
  this.showState();
  this.save();  // save AI state
}

/**
 * Called to restart a single game run
 * @param event
 */

Learner.prototype.restart = function (event) {
  console.debug("restart");
  if (this.roundsLeft <= 0) {
    console.info("Finished " + this.originalRounds + " rounds.");
    return this.inputManager.stopLearner();
  } else {
    this.roundsLeft -= 1;
    console.info("Round " + (this.originalRounds - this.roundsLeft) + "/" + this.originalRounds);
  }
  Learner.__super__.restart.apply(this, arguments);
  this.prepare();
  this.play();
};


Learner.prototype.asyncThink = function() {
  this.think();
  this.play();
};

Learner.prototype.play = function() {
  if (this.over || this.won) {
    return this.restart();
  }

  if (this.visual) _.delay(this.asyncThink, this.visualDelay);
  // These defers will slow down the AI but they're worth it to simplify things
  else _.defer(this.asyncThink);
};

///
/// Below are methods that should be overridden
///

/**
 * Prepare the learner for a new series of games.
 * State should be initialized in `this.state`
 */
Learner.prototype.prepare = function () {
  throw new NotImplementedException();
};

/**
 * Called every round. Should access state through `this.state`
 */
Learner.prototype.think = function () {
  throw new NotImplementedException();
};

/**
 * Maybe not very important.
 * Initialize the learner state to something neutral. Does not have to be prepped yet.
 * That can happen through `prepare`.
 */
Learner.prototype.resetState = function() {
  this.state = {};
};

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

Learner.prototype.actuate = function () {
  if (this.visual || this.over) {
    Learner.__super__.actuate.apply(this, arguments);
  }
};
