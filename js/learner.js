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

  function Learner(size, _, _, _) {
    this.running = false;
    this.visualDelay = 5;

    Learner.__super__.constructor.apply(this, arguments);
    this.visual = this.storageManager.get('visual') || false;
    $('#toggle-visual').prop('checked', this.visual);

    this.originalRounds = this.storageManager.get('rounds') || 1000;
    this.roundsLeft = this.originalRounds;
    $('#learner-rounds').val(this.originalRounds);

    this.state = this.storageManager.get('learner-state') || {TODO: true};

    this.inputManager.on("startLearner", this.start.bind(this));
    this.inputManager.on("stopLearner", this.stop.bind(this));
    this.inputManager.on("saveLearner", this.save.bind(this));
    this.inputManager.on("resetLearner", this.reset.bind(this));
    this.inputManager.on("loadState", this.loadState.bind(this));
    this.inputManager.on("toggleVisual", this.toggleVisual.bind(this));

    this.showState();
  }

  return Learner;
})(GameManager);




//__extends(Learner, GameManager);

Learner.moves = {
  up: 0,
  right: 1,
  down: 2,
  left: 3
};

Learner.prototype.serializeState = function () {
  // TODO this is where we can serialize learner state like function params
  return this.state;
};

Learner.prototype.loadState = function (state) {
  this.state = state;
  this.showState();
  console.debug("Successfully loaded state");
};

Learner.prototype.toggleVisual = function (on) {
  this.visual = on;
  this.storageManager.set('visual', on);
  if (this.visual) this.actuate();
  else this.actuator.actuate( new Grid(), {
    score: 0,
    bestScore: 0
  });
};

Learner.prototype.showState = function() {
  this.actuator.showState(this.serializeState());
};

Learner.prototype.serialize = function() {
  var s = Learner.__super__.serialize.apply(this, arguments);
  // TODO
  // if any inner state has to be saved do it here
  return _.extend(s, this.serializeState());
};

Learner.prototype.save = function() {
  this.storageManager.set("learner-state", this.state);
  console.info("Successfully saved AI state");
};

Learner.prototype.move = function (where) {
  Learner.__super__.move.apply(this, arguments);

  // TODO after-move logic in here

  this.think();
};


Learner.prototype.think = function () {
  if (!this.running) return;

  var self = this;

  var thinkRandom = function() {
    self.move(_.random(0, 3));
  };

  if (this.visual) _.delay(thinkRandom, this.visualDelay);
  // Have to do async defers (delay 1ms) because of exceeded callstack...
  // this will seriously delay the AI
  else _.defer(thinkRandom);
};

Learner.prototype.reset = function() {
  console.debug("AI reset");
  this.storageManager.setBestScore(0);
  this.loadState({});
  this.showState();
}

Learner.prototype.setup = function() {
  Learner.__super__.setup.apply(this, arguments);
  this.showState();
}

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
  this.think();
}

Learner.prototype.stop = function () {
  console.debug("AI stopped");
  this.running = false;
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
  if (this.over) {
    // restart will stop when it needs to
    Learner.__super__.actuate.apply(this, arguments);
    this.restart();
  }

  // stopping is for pussies;
  if (this.won) {
    this.keepPlaying();
  }

  if (this.visual) {
    Learner.__super__.actuate.apply(this, arguments);
  }
};
