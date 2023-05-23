import { html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import vision from "@mediapipe/tasks-vision";
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;

import { cameraStream } from "../../hooks/camera-stream.ts";
import { styles } from "./mediapipe-component.styles.ts";

@customElement("mediapipe-component")
class MediaPipeComponent extends LitElement {
  static styles = [styles];

  @query("#videoElement") videoElement!: HTMLVideoElement;
  @query("#canvasElement") canvasElement!: HTMLCanvasElement;
  @query("#video-blend-shapes") videoBlendshapes!: HTMLDivElement;

  @property({ type: Boolean }) isLoaded = false;
  @property({ type: Boolean }) isTracking = false;
  @property({ type: Boolean }) isWebcamRunning = false;

  @state() faceLandmarker: any = null;
  @state() faceLandmarkerResult: any = null;
  @state() runningMode: "IMAGE" | "VIDEO" = "VIDEO";

  // dont know what is this
  @state() filesetResolver: any = null;
  @state() canvasCtx: any = null;
  @state() lastVideoTime = -1;
  @state() result = undefined;
  @state() drawingUtils: any = null;
  //

  async firstUpdated() {
    if (!this.videoElement && !this.canvasElement) return;

    const stream = await cameraStream({
      video: this.videoElement,
      constraints: { video: true },
    });

    if (!stream) return console.log("not streaming");

    this.isWebcamRunning = true;
    await this.handleLoading();
    this.startTracking();
  }

  async handleLoading() {
    this.filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    this.faceLandmarker = await FaceLandmarker.createFromOptions(
      this.filesetResolver,
      {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode: this.runningMode,
        numFaces: 1,
      }
    );

    this.isLoaded = true;
    console.log("loaded");
  }

  startTracking() {
    console.log("tracking");
    this.canvasCtx = this.canvasElement.getContext("2d");

    if (!this.canvasCtx) return console.log("no canvas context");
    this.drawingUtils = new DrawingUtils(this.canvasCtx);

    if (!this.faceLandmarker)
      return console.log("Wait! faceLandmarker not loaded yet.");

    const constraints = {
      video: true,
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      this.videoElement.srcObject = stream;
      this.videoElement.addEventListener("loadeddata", this.predictWebcam);
    });
  }

  predictWebcam = async () => {
    this.videoElement.width = window.innerWidth / 1;

    const ratio = this.videoElement.videoHeight / this.videoElement.videoWidth;

    this.canvasElement.style.width = this.videoElement.videoWidth + "px";
    this.canvasElement.style.height =
      this.videoElement.videoWidth * ratio + "px";
    this.canvasElement.width = this.videoElement.videoWidth;
    this.canvasElement.height = this.videoElement.videoHeight;

    await this.faceLandmarker.setOptions({
      runningMode: this.runningMode,
    });

    let nowInMs = new Date();
    if (this.lastVideoTime !== this.videoElement.currentTime) {
      this.lastVideoTime = this.videoElement.currentTime;
      this.result = this.faceLandmarker.detectForVideo(
        this.videoElement,
        nowInMs
      );
    }

    if (this.result && this.result.faceLandmarks) {
      for (const landmarks of this.result.faceLandmarks) {
        console.log(landmarks);
        this.drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: "#C0C0C070", lineWidth: 1 }
        );
        this.drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
          { color: "#FF3030" }
        );
        this.drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
          { color: "#FF3030" }
        );
        this.drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
          { color: "#30FF30" }
        );
        this.drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
          { color: "#30FF30" }
        );
        this.drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
          { color: "#E0E0E0" }
        );
        this.drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LIPS,
          { color: "#E0E0E0" }
        );
        this.drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
          { color: "#FF3030" }
        );
        this.drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
          { color: "#30FF30" }
        );
      }
    }

    //this.drawBlendshapes(this.videoBlendshapes, this.result.faceBlendshapes);

    if (this.isWebcamRunning === true) {
      window.requestAnimationFrame(this.predictWebcam);
    }
  };

  drawBlendshapes(el: HTMLElement, blendShapes: any[]) {
    if (!blendShapes.length) {
      return;
    }

    let htmlMaker = "";
    blendShapes[0].categories.map((shape) => {
      htmlMaker += `
        <li class="blend-shapes-item">
          <span class="blend-shapes-label">${
            shape.displayName || shape.categoryName
          }</span>
          <span class="blend-shapes-value" style="width: calc(${
            +shape.score * 100
          }% - 120px)">${(+shape.score).toFixed(4)}</span>
        </li>
      `;
    });

    el.innerHTML = htmlMaker;
  }

  render() {
    return html`
      <video id="videoElement" autoplay></video>
      <canvas
        id="canvasElement"
        style="position: absolute; left: 0px; top: 0px; "
      ></canvas>
      <div class="blend-shapes">
        <ul class="blend-shapes-list" id="video-blend-shapes"></ul>
      </div>
    `;
  }
}

export default MediaPipeComponent;
