// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  new Learner(4, new KeyboardInputManager(), new HTMLActuator(), new LocalStorageManager());
});
