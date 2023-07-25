import { html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

import { cameraStream } from "../../hooks/camera-stream";
import { styles } from "./hand-tracker.styles";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";

export enum EHANDS {
  "HAND1" = 0,
  "HAND2" = 1,
}

export enum EHAND_CONNECTIONS {
  "WRIST" = 0,
  "THUMB_CMC" = 1,
  "THUMB_MCP" = 2,
  "THUMB_IP" = 3,
  "THUMB_TIP" = 4,
  "INDEX_FINGER_MCP" = 5,
  "INDEX_FINGER_PIP" = 6,
  "INDEX_FINGER_DIP" = 7,
  "INDEX_FINGER_TIP" = 8,
  "MIDDLE_FINGER_MCP" = 9,
  "MIDDLE_FINGER_PIP" = 10,
  "MIDDLE_FINGER_DIP" = 11,
  "MIDDLE_FINGER_TIP" = 12,
  "RING_FINGER_MCP" = 13,
  "RING_FINGER_PIP" = 14,
  "RING_FINGER_DIP" = 15,
  "RING_FINGER_TIP" = 16,
  "PINKY_MCP" = 17,
  "PINKY_PIP" = 18,
  "PINKY_DIP" = 19,
  "PINKY_TIP" = 20,
}

@customElement("hand-tracker")
export class HandTracker extends LitElement {
  static styles = [styles];

  @query("video") video!: HTMLVideoElement;
  @query("canvas") canvas!: HTMLCanvasElement;
  @query(".pepitox") ball!: HTMLDivElement;

  @property({ type: Boolean }) isStreaming = false;
  @property({ type: Boolean }) isHandLandMark = false;
  @property({ type: Boolean }) isTracking = false;

  @state() videoConstraints = {
    video: true,
  };
  @state() vision: any = undefined;
  @state() handLandmarker: any = undefined;
  @state() lastVideoTime = -1;
  @state() detections: any = undefined;
  @state() ctx: CanvasRenderingContext2D | null = null;
  @state() stream: MediaStream | undefined = undefined;

  async firstUpdated() {
    this.setupCanvas();

    await this.updateComplete;
    await this.setupHandLandMarker();
    await this.setupCamera();
  }

  async setupCamera() {
    this.stream = await cameraStream({
      video: this.video,
      constraints: this.videoConstraints,
    });

    if (!this.stream) return console.log("No stream");

    this.isStreaming = true;
    this.video.addEventListener("loadeddata", this.startTracking);
  }

  setupCanvas() {
    /* this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    this.canvas.style.width = `${this.video.videoWidth}px`;
    this.canvas.style.height = `${this.video.videoHeight}px`; */

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;

    this.ctx = this.canvas.getContext("2d");
  }

  async setupHandLandMarker() {
    this.vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(this.vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });

    if (!this.handLandmarker)
      return console.log("algo malio sal con el hand landmarker");

    this.isHandLandMark = true;
  }

  startTracking = async () => {
    if (this.video.currentTime !== this.lastVideoTime) {
      this.detections = await this.handLandmarker.detectForVideo(
        this.video,
        performance.now()
      );
    }

    if (!this.ctx) return console.log("no ctx");

    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.detections) return;

    for (let landmarks of this.detections.landmarks) {
      if (this.detections.landmarks.length > 0) {
        this.handleLandmark(landmarks);
      }

      drawConnectors(this.ctx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 2,
      });
      drawLandmarks(this.ctx, landmarks, {
        color: "#FF0000",
        lineWidth: 1,
        fillColor: "#FF0000",
        radius: 2,
      });
    }

    this.ctx.restore();

    if (!this.isTracking && !this.isStreaming) return;
    window.requestAnimationFrame(this.startTracking);
  };

  handleLandmark(landmarks: any) {
    this.flipLandmarks(landmarks);

    //console.log(this.detections.landmarks);
    const indexPosition =
      this.detections.landmarks[EHANDS.HAND1][
        EHAND_CONNECTIONS.INDEX_FINGER_TIP
      ];
    const thubmPosition =
      this.detections.landmarks[EHANDS.HAND1][EHAND_CONNECTIONS.THUMB_TIP];

    this.moveBall(indexPosition);
    this.userClickWithItsFingers(indexPosition, thubmPosition);
  }

  flipLandmarks(landmarks: any) {
    for (let landmark of landmarks) {
      console.log(landmark);

      /* console.log("video", {
        video: this.video.videoWidth,
        lm: landmark.x,
        lm2: landmark.x * this.video.videoWidth,
        t:
          (this.video.videoWidth - landmark.x * this.video.videoWidth) /
          this.video.videoWidth,
      }); */
      /* landmark.x =
        (this.video.videoWidth - landmark.x * this.video.videoWidth) /
        this.video.videoWidth; */
    }
  }

  userClickWithItsFingers(indexPosition: any, thubmPosition: any) {
    const distance = Math.sqrt(
      Math.pow(indexPosition.x - thubmPosition.x, 2) +
        Math.pow(indexPosition.y - thubmPosition.y, 2)
    );

    const now = new Date().getTime();
    const cooldown = 1000;
    const lastClick = localStorage.getItem("lastClick");

    const scale = Math.min(1 - distance * 40, 1);

    this.ball.style.scale = `${scale}`;

    if (lastClick && now - parseInt(lastClick) < cooldown) return;

    localStorage.setItem("lastClick", now.toString());

    if (distance < 0.04) {
      alert("CLICKCITO");
    }
  }

  moveBall(landmark: any) {
    const x = landmark.x * window.innerWidth;
    const y = landmark.y * window.innerHeight;

    console.log("x", x, "y", y);

    this.ball.style.translate = `${x - 400}px ${y - 400}px`;

    this.handleBallOutsideCanvas();
  }

  handleBallOutsideCanvas() {
    const ballRect = this.ball.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();

    if (ballRect.left < canvasRect.left) {
      this.ball.style.background = "red";
      return;
    }

    if (ballRect.right > canvasRect.right) {
      this.ball.style.background = "green";
      return;
    }

    if (ballRect.top < canvasRect.top) {
      this.ball.style.background = "black";
      return;
    }

    if (ballRect.bottom > canvasRect.bottom) {
      this.ball.style.background = "yellow";
      return;
    }

    this.ball.style.background = "blue";
  }

  render() {
    return html`
      <video></video>
      <canvas></canvas>
      <div class="pepitox"></div>
    `;
  }
}
