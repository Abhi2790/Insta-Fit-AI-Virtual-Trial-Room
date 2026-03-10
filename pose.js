/**
 * =============================================================
 * pose.js — Body Pose Tracking via MediaPipe
 * =============================================================
 *
 * STATUS: Phase 2 — not yet wired into app.js
 *
 * PURPOSE:
 *   Wraps the MediaPipe Pose model to detect 33 body landmarks
 *   from a live webcam feed. Exposes named landmarks and derived
 *   measurements (shoulder width, torso height, etc.) that the
 *   overlay engine uses to position clothing on the body.
 *
 * HOW TO ACTIVATE:
 *   1. Uncomment the MediaPipe <script> tags in index.html
 *   2. In app.js, after camera starts, add:
 *        poseTracker.start(video, onPoseResults);
 *   3. In app.js, implement onPoseResults:
 *        function onPoseResults(results) {
 *          const m = poseTracker.getMeasurements(canvas.width, canvas.height);
 *          updateConfidence(poseTracker.getConfidence());
 *          if (state.selectedItem && m) {
 *            overlayRenderer.draw(m, state.selectedItem);
 *          }
 *        }
 *
 * CDN SCRIPTS REQUIRED (add to index.html <head>):
 *   <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
 *
 * FUTURE IMPROVEMENTS:
 *   - [ ] Add TensorFlow.js body segmentation for edge-blur effect
 *   - [ ] Smooth landmark positions with a low-pass filter
 *   - [ ] Support multiple people in frame (multi-pose)
 *   - [ ] Add sitting/standing pose classification
 *   - [ ] Cache measurements to reduce jitter on fast movements
 * =============================================================
 */


class PoseTracker {

  constructor() {
    this.pose         = null;   // MediaPipe Pose instance
    this.camera       = null;   // MediaPipe Camera utility
    this.landmarks    = null;   // Raw 33-point array from last result
    this.onResults    = null;   // Callback passed in by app.js
    this.confidence   = 0;      // Average visibility of key landmarks (0–1)
  }


  /* -----------------------------------------------------------
     START
     Initialises MediaPipe Pose and begins processing the video.
     @param videoEl   — the <video> element with the webcam feed
     @param callback  — function(results) called every frame
     ----------------------------------------------------------- */

  start(videoEl, callback) {
    this.onResults = callback;

    // Initialise MediaPipe Pose model
    this.pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    this.pose.setOptions({
      modelComplexity:          1,      // 0 = fast/less accurate, 2 = slow/very accurate
      smoothLandmarks:          true,   // reduces jitter between frames
      enableSegmentation:       false,  // body mask — enable for background blur (Phase 3)
      smoothSegmentation:       false,
      minDetectionConfidence:   0.6,    // minimum score to accept a detection
      minTrackingConfidence:    0.5,    // minimum score to keep tracking
    });

    // Register our results handler
    this.pose.onResults((results) => this._handleResults(results));

    // Start camera loop using MediaPipe's Camera utility
    this.camera = new Camera(videoEl, {
      onFrame: async () => {
        await this.pose.send({ image: videoEl });
      },
      width: 640,
      height: 854,
    });

    this.camera.start();
  }


  /* -----------------------------------------------------------
     STOP
     Stops pose tracking and releases resources.
     ----------------------------------------------------------- */

  stop() {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    this.landmarks  = null;
    this.confidence = 0;
  }


  /* -----------------------------------------------------------
     _HANDLE RESULTS  (private)
     Called by MediaPipe every frame.
     Stores landmarks and fires the app callback.
     ----------------------------------------------------------- */

  _handleResults(results) {
    if (results.poseLandmarks) {
      this.landmarks = results.poseLandmarks;

      // Compute average visibility of 4 key landmarks as confidence score
      const keyIndices = [11, 12, 23, 24]; // left/right shoulder + hip
      const sum = keyIndices.reduce((acc, i) => acc + (this.landmarks[i]?.visibility ?? 0), 0);
      this.confidence = sum / keyIndices.length;
    } else {
      this.landmarks  = null;
      this.confidence = 0;
    }

    // Fire the app callback even if no landmarks (so app can show "no body detected")
    if (this.onResults) this.onResults(results);
  }


  /* -----------------------------------------------------------
     GET MEASUREMENTS
     Converts normalised MediaPipe landmarks (0–1) into pixel
     coordinates, and derives clothing-placement measurements.

     @param canvasW  — overlay canvas width in pixels
     @param canvasH  — overlay canvas height in pixels
     @returns object with pixel positions, or null if no body
     ----------------------------------------------------------- */

  getMeasurements(canvasW, canvasH) {
    if (!this.landmarks) return null;

    const lm = this.landmarks;

    // Helper: convert normalised (0–1) coords to canvas pixels
    const px = (i) => ({
      x: lm[i].x * canvasW,
      y: lm[i].y * canvasH,
      v: lm[i].visibility ?? 0,
    });

    // Key body points — see MediaPipe landmark map:
    // https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
    const pts = {
      nose:           px(0),
      leftShoulder:   px(11),
      rightShoulder:  px(12),
      leftElbow:      px(13),
      rightElbow:     px(14),
      leftWrist:      px(15),
      rightWrist:     px(16),
      leftHip:        px(23),
      rightHip:       px(24),
      leftKnee:       px(25),
      rightKnee:      px(26),
      leftAnkle:      px(27),
      rightAnkle:     px(28),
    };

    // Derived measurements used by overlay.js
    return {
      ...pts,

      // Shoulder width in pixels
      shoulderWidth: Math.abs(pts.leftShoulder.x - pts.rightShoulder.x),

      // Torso height: shoulder midpoint to hip midpoint
      torsoHeight: Math.abs(
        ((pts.leftShoulder.y + pts.rightShoulder.y) / 2) -
        ((pts.leftHip.y     + pts.rightHip.y)      / 2)
      ),

      // Leg length: hip midpoint to ankle midpoint
      legLength: Math.abs(
        ((pts.leftHip.y   + pts.rightHip.y)   / 2) -
        ((pts.leftAnkle.y + pts.rightAnkle.y) / 2)
      ),

      // Thigh length: hip to knee
      thighLength: Math.abs(
        ((pts.leftHip.y  + pts.rightHip.y)  / 2) -
        ((pts.leftKnee.y + pts.rightKnee.y) / 2)
      ),

      // Midpoints for easy centering
      shoulderMid: {
        x: (pts.leftShoulder.x + pts.rightShoulder.x) / 2,
        y: (pts.leftShoulder.y + pts.rightShoulder.y) / 2,
      },
      hipMid: {
        x: (pts.leftHip.x + pts.rightHip.x) / 2,
        y: (pts.leftHip.y + pts.rightHip.y) / 2,
      },
    };
  }


  /* -----------------------------------------------------------
     GET CONFIDENCE
     Returns the current body detection confidence (0–1).
     Pass to app.js's updateConfidence() each frame.
     ----------------------------------------------------------- */

  getConfidence() {
    return this.confidence;
  }

}


// Export as singleton so app.js can import one instance
// Usage in app.js:  poseTracker.start(videoEl, callback);
const poseTracker = new PoseTracker();
