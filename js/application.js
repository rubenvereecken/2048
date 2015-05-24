// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var learner = new Learner();
  new GameManager(4, learner, learner, new LocalStorageManager());
});
