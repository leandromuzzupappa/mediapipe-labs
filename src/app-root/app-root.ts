import { LitElement, html } from "lit";
import { customElement, query } from "lit/decorators.js";
import { cameraStream } from "../hooks/camera-stream";

@customElement("app-root")
export class AppRoot extends LitElement {
  @query(".pepitos-video") video!: HTMLVideoElement;

  async firstUpdated() {
    await cameraStream({
      video: this.video,
      constraints: {
        audio: false,
        video: { width: 1280, height: 720 },
      },
    });
  }

  render() {
    return html`
      <h1>Pepitos!</h1>
      <video class="pepitos-video"></video>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
