interface ICameraStream {
  video: HTMLVideoElement;
  constraints: MediaStreamConstraints;
}

export const cameraStream = async ({
  video,
  constraints,
}: ICameraStream): Promise<MediaStream | undefined> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.style.transform = "scaleX(-1)";
    video.onloadedmetadata = () => video.play();
    return stream;
  } catch (error) {
    console.error("Error accessing video stream", error);
  }
};
