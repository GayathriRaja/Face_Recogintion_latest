const video = document.getElementById("video");
const input = document.getElementById("myImg");

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./models"),
]).then(startVideo);

function startVideo() {
  console.log("video");
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("playing", async () => {
  const labeledFaceDescriptors = await labelMatchedPerson();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  const canvas = faceapi.createCanvasFromMedia(video);
  console.log("canvas", canvas);
  console.log("canvas", video);

  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withFaceExpressions();

    if (detections) {
      const resizedDetections = [
        faceapi.resizeResults(detections, displaySize),
      ];
      console.log(resizedDetections);

      const matchingImage = resizedDetections.map((d) =>
        faceMatcher.findBestMatch(d.descriptor)
      );
      console.log(matchingImage[0].label);

      // Code for checking the face detected is same or different person
      if (matchingImage[0].label == "unknown") {
        alert("Someone else image detected");
      }

      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      const box = resizedDetections[0].detection.box;
      const drawbox = new faceapi.draw.DrawBox(box, {
        label: matchingImage.toString(),
      });

      drawbox.draw(canvas);
    }
  }, 100);
});

async function labelMatchedPerson() {
  const results = await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
  console.log(results);
  if (!results.length) {
    // alert("Someone else face detected");
    return;
  }
  const descriptorsNamed = [new Float32Array(results[0].descriptor)];

  return new faceapi.LabeledFaceDescriptors("Gayathri", descriptorsNamed);
}
