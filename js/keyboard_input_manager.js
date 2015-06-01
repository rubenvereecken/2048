function KeyboardInputManager() {
  this.events = {};

  if (window.navigator.msPointerEnabled) {
    //Internet Explorer 10 style
    this.eventTouchstart    = "MSPointerDown";
    this.eventTouchmove     = "MSPointerMove";
    this.eventTouchend      = "MSPointerUp";
  } else {
    this.eventTouchstart    = "touchstart";
    this.eventTouchmove     = "touchmove";
    this.eventTouchend      = "touchend";
  }

  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;

  document.addEventListener("keydown", function (event) {
    if ($(event.target).is('textarea'))
      return;
    // S starts or stops AI
    if (event.which === 83) {
      self.toggleLearner.call(self, event);
    } else if  (event.which === 86) {
      $("#toggle-visual").prop('checked', !$("#toggle-visual").prop('checked'));
      self.toggleVisual.call(self, event);
    } else if (event.which == 82) {
      self.resetLearner.call(self, event);
    }
  });

  // Respond to button presses
  this.bindButtonPress(".retry-button", this.restart);
/*  this.bindButtonPress(".restart-button", this.restart);*/
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);
  this.bindButtonPress(".toggle-learner", this.toggleLearner);
  this.bindButtonPress(".save-learner", this.saveLearner);
  this.bindButtonPress(".reset-learner", this.resetLearner);
  this.bindButtonPress(".load-state", this.loadState);
  this.bindButtonPress("#toggle-visual", this.toggleVisual);
  this.bindButtonPress(".download-state", this.downloadState);
  this.bindButtonPress(".download-history", this.downloadHistory);
};

KeyboardInputManager.prototype.toggleLearner = function (event) {
  if (event)
    event.preventDefault();
  var btn = $('.toggle-learner');
  var game = $('.game-container');
  if (game.hasClass("started-learner")) {
    game.removeClass('started-learner');
    btn.text("Start AI");
    this.emit("stopLearner");
  } else {
    btn.text("Stop AI");
    game.addClass('started-learner');
    var rounds = parseInt($('#learner-rounds').val());
    this.emit("startLearner", rounds);
  }
};

KeyboardInputManager.prototype.stopLearner = function (event) {
  if (event)
    event.preventDefault();
  var btn = $('.toggle-learner');
  var game = $('.game-container');
  game.removeClass('started-learner');
  btn.text("Start AI");
  this.emit("stopLearner");
};

KeyboardInputManager.prototype.resetLearner = function (event) {
  event.preventDefault();
  this.emit("resetLearner");
};

KeyboardInputManager.prototype.toggleVisual = function () {
  this.emit("toggleVisual", $("#toggle-visual").prop('checked'));
};

KeyboardInputManager.prototype.loadState = function (event) {
  event.preventDefault();
  var state = null;
  try {
    state = JSON.parse($('#learner-state').val());
  } catch (e) {
    return console.error(e.constructor.name + ': ' + e.message);
  }
  this.emit("loadState", state);
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.saveLearner = function (event) {
  event.preventDefault();
  this.emit("saveLearner");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};

KeyboardInputManager.prototype.downloadState = function (event) {
  event.preventDefault();
  console.save(window.AI.serialize(), "state.json");
};

KeyboardInputManager.prototype.downloadHistory = function (event) {
  event.preventDefault();
  if (_.isEmpty(window.AI.history)) {
    console.log("History empty");
  } else {
    console.save(window.AI.history, "history.json");
  }
};
