(function () {
  const DEFAULT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAVklEQVRYR+2WMQ4AIAgD4f+PVlzFYGSpw3UlQHOaBjexXLzfMJAIjFD1LB6q6q/9RwO3Jd1/s8ztszEAAQiQhBCAAARIQghA4E8C0rO8e3J3+4hiOYEJMwaAIT1kBDMAAAAASUVORK5CYII=';

  AFRAME.registerComponent('ar-scan-gimmick', {
    schema: {
      'src': { type: 'string', default: DEFAULT_IMAGE },
      'opacity': { type: 'number', default: 1.0 }
    },
    init() {
      const scene = this.el.sceneEl;
      const ar = scene.systems.ar;
      this._ar = ar;
      this._img = null;
      this._hadGizmos = false;
      this._onTargetFound = this._onTargetFound.bind(this);
      this._onTargetLost = this._onTargetLost.bind(this);

      scene.addEventListener('ar-started', () => {
        this._validate();
        const session = ar.session;
        this._hadGizmos = session.gizmos.visible;
        const img = this._createImage();
        this.el.parentNode.appendChild(img);
        this._img = img;
        this._registerEvents();
      });
    },
    remove() {
      if (this._img === null) return;
      this._unregisterEvents();
      this.el.parentNode.removeChild(this._img);
      this._img = null;
    },
    _registerEvents() {
      const imageTracker = this._findImageTracker();
      if (imageTracker !== null) {
        imageTracker.addEventListener('targetfound', this._onTargetFound);
        imageTracker.addEventListener('targetlost', this._onTargetLost);
      }
    },
    _unregisterEvents() {
      const imageTracker = this._findImageTracker();
      if (imageTracker !== null) {
        imageTracker.removeEventListener('targetlost', this._onTargetLost);
        imageTracker.removeEventListener('targetfound', this._onTargetFound);
      }
    },
    _onTargetFound(event) {
      const ar = this._ar;
      const img = this._img;
      ar.session.gizmos.visible = false;
      img.style.display = 'none';

      const aVideo = document.querySelector("#ar-video");
      const videoEl = document.querySelector("#WebMShowreel");

      if (aVideo && videoEl) {
        aVideo.setAttribute("visible", "true");
        if (videoEl.paused) {
          videoEl.play().then(() => {
            console.log("Video started playing");
          }).catch(err => {
            console.error("Autoplay failed:", err);
          });
        }
      } else {
        console.error("Video element not found!");
      }
    },
    _onTargetLost(event) {
      const ar = this._ar;
      const img = this._img;
      ar.session.gizmos.visible = this._hadGizmos;
      img.style.display = 'inline-block';

      const aVideo = document.querySelector("#ar-video");
      const videoEl = document.querySelector("#WebMShowreel");

      if (aVideo && videoEl) {
        videoEl.pause();
        console.log("Video paused because target was lost");
      }
    },
    _findImageTracker() {
      const ar = this._ar;
      if (ar !== null) {
        for (const tracker of ar.session.trackers) {
          if (tracker.type == 'image-tracker')
            return tracker;
        }
      }
      return null;
    },
    _createImage() {
      const img = document.createElement('img');
      img.src = this.data.src;
      img.draggable = false;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      img.style.display = 'inline-block';
      img.style.opacity = this.data.opacity;
      if (img.src == DEFAULT_IMAGE)
        img.style.imageRendering = 'pixelated';
      return img;
    },
    _validate() {
      if (!this.el.parentNode.getAttribute('ar-hud'))
        throw new Error('a-entity with ar-scan-gimmick must be a direct child of ar-hud');
    },
  });

  // ---------------------- Added Script for Click Handling ----------------------
AFRAME.registerComponent('clickable-button', {
  schema: {
    color: { type: 'color', default: '#0077CC' },
    pressedColor: { type: 'color', default: '#FF4444' }
  },
  init: function () {
    // Attach the pointer tracker to this element.
    // (This assumes that ar-pointer-tracker is provided by encantar.js.)
    this.el.setAttribute('ar-pointer-tracker', '');
    // Listen for the pointer event (adjust the event name per your documentation)
    this.el.addEventListener('ar-pointer-click', this.onPointerClick.bind(this));
    // Set the initial material color.
    this.el.setAttribute('material', 'color', this.data.color);
  },
  onPointerClick: function (evt) {
    // evt.detail.trackablePointer is assumed to be provided by the ar-pointer-tracker.
    const pointer = evt.detail.trackablePointer;
    // (Optionally, you can add extra hit testing if needed.)
    console.log('Button clicked via trackablePointer:', pointer);
    
    // Change color to provide visual feedback.
    this.el.setAttribute('material', 'color', this.data.pressedColor);
    // Emit a custom event so other components can listen.
    this.el.emit('buttonclicked', { pointer: pointer });
    
    // Revert to original color after a short delay.
    setTimeout(() => {
      this.el.setAttribute('material', 'color', this.data.color);
    }, 200);
  },
  remove: function () {
    this.el.removeEventListener('ar-pointer-click', this.onPointerClick);
  }
});

})();
