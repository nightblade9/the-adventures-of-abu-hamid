// Lots and lots and lots of helpful, default helpers for an actor class.
// It can be moved, sized, clicked, etc.
Crafty.c('Actor', {
  init: function() {
    // Collision: every actor can be collision-detected
    this.requires('Common, Color, Collision')
      .size(32, 32)
      .color("#888888");

    // Used for constant velocity
    this.v = { x: 0, y: 0 };

    this.bind('EnterFrame', function() {
      this.attr({ x: this.x + this.v.x, y: this.y + this.v.y });
    });
  },

  centerOnScreen: function() {
    // TODO: take into account the current camera position
    this.x = -Crafty.viewport.x + ((Crafty.viewport.width - this.w) / 2);
    this.y = -Crafty.viewport.y + ((Crafty.viewport.height - this.h) / 2);
    return this;
  },

  // Execute a callback when collides with an entity with the tag in it. This
  // doesn't resolve the collision so that we're no longer overlapping the target.
  // If you want to displace out of the object, use collideWith.
  collide: function(tagOrTags, callback) {
    if (tagOrTags.constructor.name == 'Array') {
        for (var i = 0; i < tagOrTags.length; i++) {
            this.onHit(tagOrTags[i], function(data) {
              if (callback != null) {
                callback(data);
              }
            });
        }
        return this;
    } else {
        this.onHit(tagOrTags, function(data) {
          if (callback != null) {
            callback(data);
          }
        });
        return this;
    }
  },

  // Collide against a solid object, and resolve the collision so that we're no
  // longer overlapping with the target. (We stop moving; target can keep moving.)
  // For non-resolving, use collide.
  // The callback receives an object (the thing that's hit) before resolving the collision.
  // Setting resolveFirst to true resolves the collision, then executes the callbacks.
  collideWith: function(tag, callback, resolveFirst) {
    resolveFirst = typeof resolveFirst !== 'undefined' ? resolveFirst : true;

    this.requires("Collision").onHit(tag, function(evt) {
      var hitData = evt;

      if (resolveFirst && callback != null) {
        // Invoke callback once per object hit
        for (var i = 0; i < hitData.length; i++) {
          var data = hitData[i];
          callback(data);
        }
      }

      // Execute all the callbacks now if post-resolve.
      for (var i = 0; i < hitData.length; i++) {
        var data = hitData[i];
        // displace backward so we're no longer overlapping
        var dx = -data.nx * data.overlap;
        var dy = -data.ny * data.overlap;

        this.x += dx;
        this.y += dy;

        if (callback != null && !resolveFirst) {
          callback(data);
        }
      }
    });

    return this;
  },

  // Responds to user input; speed = pixels per second
  controllable: function(speed) {    
    this.requires('Fourway').fourway(speed); // Keyboard    
    this.requires("GamepadMultiway");
    // Did we include the gamepad API?
    if (this.gamepadMultiway === "function") {
        this.gamepadMultiway({ "speed": speed }); // Gamepad via web gamepad API
    } else {
      console.warn("Gamepad API libraries not found.");
    }
    return this;
  },

  draggable: function() {
    this.requires('Mouse, Draggable');
    return this;
  },
  
  followWithCamera: function() {
    Crafty.viewport.follow(this);
  },

  height: function() {
      return this.h;
  },

  // Won't work with WebGL; so we force Canvas (see bottom of file)
  img: function(filename, repeat) {
    this.requires('Image');
    this.image(filename, repeat);
    return this;
  },

  // Resize
  size: function(width, height) {
    this.attr({ w: width, h: height });
    return this;
  },

  tween: function(hash, seconds) {
    this.requires('Tween').tween(hash, seconds * 1000);
    return this;
  },

  // Start moving
  velocity: function(x, y) {
    this.v = { x: x || 0, y: y || 0 };
    return this;
  },
  
  width: function() {
      return this.w;
  }
});

Crafty.c('Text2', {
  init: function() {
    this.requires('Common, Graphics, Text');
    this.fontSize(20);
  },

  text: function(contents) {
    this.text(contents);
    return this;
  },

  fontSize: function(size) {
    this.textFont({ size: size + 'px' });
    return this;
  }
});

Crafty.c('Common', {
  init: function() {
    // Collision: every actor can be collision-detected
    this.requires('Graphics, 2D, Moveable, Alpha, Delay');

    // Used for cancelling "after" and "repeatedly" events
    this.timerEvents = [];
    this.isDead = false;
  },

  // Do something once, after a certain amount of time.
  // See: repeatedly
  after: function(seconds, callback) {
    this.delay(callback, seconds * 1000, 0);
    this.timerEvents.push(callback);
    return this;
  },

  // Cancels anything set by "after" or "repeatedly"
  cancelTimerEvents: function() {
    for (var i = 0; i < this.timerEvents.length; i++) {
      this.cancelDelay(this.timerEvents[i]);
    }
  },

  die: function() {
    this.isDead = true;
    this.destroy();
    return this;
  },

  // Stay on screen. Usually used for UI elements.
  // (x, y) are relative to the top-left of the screen.
  followForUi(x, y) {
    this.bind("EnterFrame", function() {
      this.x = -Crafty.viewport.x + x;
      this.y = -Crafty.viewport.y + y;
    });
    return this;
  },

  // Execute a callback when clicked on. Technically, when you press the mouse
  // down (anywhere), hover it over this entity, and then release. #derp
  // See: mouseDown
  onClick: function(callback) {
    this.requires('Mouse').bind('Click', function(data) {
      callback.call(this, data);
    });
    return this;
  },

  // Fires callback once every time key is pressed down. If you press and hold
  // down the appropriate key, it still invokes the callback only once.
  onKeyPress: function(key, callback) {
    this.requires('Keyboard').bind('KeyUp', function(e) {
      if (e.key == key) {
        callback.call(this);
      }
    });
    return this;
  },

  onMouseDown: function(callback) {
    this.requires('Mouse').bind('MouseDown', function(e) {
      callback(e);
    });
    return this;
  },

  onMouseUp: function(callback) {
    this.requires('Mouse').bind('MouseUp', function(e) {
      callback(e);
    });
    return this;
  },

  onMouseOut: function(callback) {
    this.requires('Mouse').bind('MouseOut', function(e) {
      callback(e);
    });
    return this;
  },

  onMouseOver: function(callback) {
    this.requires('Mouse').bind('MouseOver', function(e) {
      callback(e);
    });
    return this;
  },

  // Keep doing something. Forever.
  repeatedly: function(callback, secondsInterval) {
    this.delay(callback, secondsInterval * 1000, -1);
    this.timerEvents.push(callback);
    return this;
  }
});

// Overrides for built-in functions like 'move', etc.
Crafty.c('Moveable', {
  init: function() {
    this.requires("Tween");
  },

  // Tween to location in T fractional seconds (defaults to 1.0s)
  move: function(x, y, t, callback) {
    // We might be tweening. Even if not, if there's a tween in progress
    // that affects our X or Y, strange things will happen: we'll be in
    // two places at once, collision handlers won't fire, etc.
    // To be safe, cancel any tweens on our x/y coordinates.
    this.cancelTween("x");
    this.cancelTween("y");
    
    if (t == null || t == 0) {
      this.attr({ x: x, y: y });
      if (callback != null) {
        callback();
      }
    } else {
      this.tween({ x: x, y: y }, t * 1000);
      this.bind('TweenEnd', callback);
    }
    return this;
  }
});

// WebGL gives a cross-origin error in Chrome when trying to load graphics
// Hence, we always force DOM.
Crafty.c("Graphics", {
  init: function() {
    // if (Crafty.support.webgl) {
    //   this.requires("WebGL");
    //   this.graphics = "WebGL";
    // } else if (Crafty.support.canvas) {
    //   this.requires("Canvas");
    //   this.graphics = "Canvas";
    // } else {
      this.requires("DOM");
      this.graphics = "DOM";
    // }
  }
});
