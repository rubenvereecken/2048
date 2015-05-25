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
    Learner.__super__.constructor.apply(this, arguments);

    this.running = false;

    this.inputManager.on("startLearner", this.start.bind(this));
    this.inputManager.on("stopLearner", this.stop.bind(this));
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

Learner.prototype.serialize = function() {
  var s = Learner.__super__.serialize.apply(this, arguments);
  // TODO
  // if any inner state has to be saved do it here
  return s;
};


Learner.prototype.move = function (where) {
  Learner.__super__.move.apply(this, arguments);
  this.think();
};

Learner.prototype.think = function () {
  if (!this.running) return;

  var self = this;
  _.delay(function() {
    self.move(_.random(0, 3));
  }, 100);
};


/**
 * Called to start the learner
 * @param event
 */
Learner.prototype.start = function () {
  console.debug("AI started");
  this.running = true;
  this.think();
}

Learner.prototype.stop = function () {
  console.debug("AI stopped");
  this.running = false;
}

/**
 * Called to restart a single game run
 * @param event
 */

Learner.prototype.restart = function (event) {
  console.debug("restart");
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

Learner.prototype.dsactuate = function (grid, state) {
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

Learner.prototype.availableMoves = function() {
  var self = this;

  if (this.isGameTerminated()) return []; // Don't do anything if the game's over

  var cell, tile;

  var available  = [];

  // Save the current tile positions and remove merger information
  //this.prepareTiles();

  // Never ever use labels and goto's. Except when hacking big time.
  outside:
      for (var direction in [0, 1, 2, 3]) {
        var vector     = this.getVector(direction);
        var traversals = this.buildTraversals(vector);

        // Traverse the grid in the right direction and move tiles
        for (var x in traversals.x) {
          for (var y in traversals.y) {
            cell = { x: x, y: y };
            tile = self.grid.cellContent(cell);

            if (tile) {
              var positions = self.findFarthestPosition(cell, vector);
              var next      = self.grid.cellContent(positions.next);

              // Only one merger per row traversal?
              if (next && next.value === tile.value && !next.mergedFrom) {
                var merged = new Tile(positions.next, tile.value * 2);
                merged.mergedFrom = [tile, next];

                self.grid.insertTile(merged);
                self.grid.removeTile(tile);

                // Converge the two tiles' positions
                tile.updatePosition(positions.next);

                // Update the score
                self.score += merged.value;

                // The mighty 2048 tile
                if (merged.value === 2048) self.won = true;
              } else {
                // no merging, then move
                if (!self.positionsEqual(tile, positions.farthest)) {
                  available.push(direction);
                  continue outside;
                }
              }

              if (!self.positionsEqual(cell, tile)) {
                moved = true; // The tile moved from its original cell!
              }
            }
          }
        }
      }

  return available;
};

