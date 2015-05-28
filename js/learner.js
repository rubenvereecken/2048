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

    this.state = this.storageManager.get('learner-state') || this.beginState();

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

Learner.moves = [
  0, // up
  1, // down
  2, // right
  3 //left
];

Learner.parameters = {
  alpha: 0.1,
  gamma: 0.9,
  lambda: 0.1,
  epsilon: 0.1,
  featureSize: 23 // 11 powers of 2, 4 rows, 4 corners to check if highest value there, 4 actions
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
  var s = Learner.__super__.serialize.apply(this, arguments);
  // TODO
  // if any inner state has to be saved do it here
  var p = this.state.parameterVector.serialize();
  return _.extend(s, p, this.serializeState());
};

Learner.prototype.save = function() {
  this.storageManager.set("learner-state", this.state);
  console.info("Successfully saved AI state");
};

Learner.prototype.move = function (where) {
  Learner.__super__.move.apply(this, arguments);


/*   // TODO after-move logic in here
  // stopping is for pussies;

  */
};

Learner.prototype.presentFeatures =  function (state, action) {
  //TODO finish this!
  // returns an array of featurenumbers present in the current state-action pair
  // Currently 23 features are defined: 11 feat. representing the presence of a particular power of 2,
  // 4 feat. representing the presence of numbers in a specific row/column,
  // 4 feat. representing the corners
  // 4 representing the actions
  return [];
};

Learner.prototype.think = function () {
  //this function does one episode of the learning process
  if (!this.running) return;
  var self = this;
  // TODO make the function underneath neat (abstractions or something)
  var qlearning = function () {
    //null vector
    console.info("Start New episode");
    var e = math.zeros(Learner.parameters.featureSize);
    var action = math.pickRandom(Learner.moves);
    var state = this.grid; // the game grid
    var presentFeatures = self.presentFeatures(state, action);

    var feature;
    while(!(this.won || this.over)){
      console.debug("New step");
      for(feature in presentFeatures){
        e[feature]+=1;
      }

      self.move(action);
      //TODO fetch reward
      var reward = 1;
      state = this.grid;

      var sum = 0;
      for(feature in presentFeatures){
        sum+=this.state.parameterVector[feature];
      }

      var delta = reward - sum;
      var Qs = math.zeros(Learner.moves.length);
      for(action in Learner.moves){
        var features = self.presentFeatures(state, action);
        var Q = 0;
        for(feature in features){
          Q+=this.state.parameterVector[feature];
        }
        Qs[action] = Q;
      }

      delta +=  Learner.parameters.gamma * math.max(Qs);
      self.state.parameterVector = math.add(self.state.parameterVector, math.multiply(Learner.parameters.alpha*delta,e));

      var prob = Math.random();
      if(prob < Learner.parameters.epsilon){
        // random action
        action = math.pickRandom(Learner.moves);
        e = math.zeros(Learner.parameters.featureSize);
      }
      else{
        var Qs = math.zeros(Learner.moves.length);
        for(action in Learner.moves){
          var features = self.presentFeatures(state, action);
          var Q = 0;
          for(feature in features){
            Q+=this.state.parameterVector[feature];
          }
          Qs[action] = Q;
        }
        action = argmax(Qs);
      }

    }
    this.restart();
  };

  var thinkRandom = function() {
    self.move(_.random(0, 3));
    if (this.won) {
      // not tested yet
      this.keepPlaying();
    }

    if (this.over) {
      // Custom logic if it's over? Maybe AI needs it
      this.restart();
    } else {
      this.think();
    }
  };

  if (this.visual) _.delay(qlearning, this.visualDelay);
  // Have to do async defers (delay 1ms) because of exceeded callstack...
  // this will seriously delay the AI
  else _.defer(qlearning);
};

Learner.prototype.beginState = function() {
  return {placeholder: "This is where the state should come",
  parameterVector: math.zeros(Learner.parameters.featureSize)}
};

/**
 * Resets the internal state of the AI
 */
Learner.prototype.reset = function() {
  console.debug("AI reset");
  this.storageManager.setBestScore(0);
  this.loadState(this.beginState());
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
};

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
  this.think();
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

