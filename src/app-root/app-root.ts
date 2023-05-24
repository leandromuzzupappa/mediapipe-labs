import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

import "../components/mediapipe-component/mediapipe-component";
import "../components/hand-tracker/hand-tracker";

@customElement("app-root")
export class AppRoot extends LitElement {
  render() {
    return html`
      <h1>Pepitos sss!</h1>
      <hand-tracker></hand-tracker>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
