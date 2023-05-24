import { css } from "lit";

export const styles = css`
  :host {
    position: relative;
    display: block;
    border: 10px solid red;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
  }

  .pepitox {
    position: absolute;
    right: 0;

    width: 25px;
    aspect-ratio: 1/1;
    background: blue;
    border-radius: 20px;
    z-index: 100;
  }
`;
