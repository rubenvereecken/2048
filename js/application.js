// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  new RandomLearner(4, new KeyboardInputManager(), new HTMLActuator(), new LocalStorageManager());
});
