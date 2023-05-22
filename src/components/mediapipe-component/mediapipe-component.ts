import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { cameraStream } from "../../hooks/camera-stream.ts";
import { styles } from "./mediapipe-component.styles.ts";

@customElement("mediapipe-component")
class MediaPipeComponent extends LitElement {
  @query("#videoElement") videoElement!: HTMLVideoElement;
  @query("#canvasElement") canvasElement!: HTMLCanvasElement;

  @property({ type: Boolean }) isTracking = false;

  static styles = [styles];

  async firstUpdated() {
    if (!this.videoElement && !this.canvasElement) return;

    await cameraStream({
      video: this.videoElement,
      constraints: { video: true },
    });
  }

  render() {
    return html`
      <video id="videoElement" autoplay></video>
      <canvas id="canvasElement"></canvas>
    `;
  }
}

export default MediaPipeComponent;
