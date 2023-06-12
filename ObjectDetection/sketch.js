// ml5.js: Object Detection with COCO-SSD (Webcam Continuous Detection)
// The Coding Train / Daniel Shiffman
// https://thecodingtrain.com/learning/ml5/1.3-object-detection.html
// https://youtu.be/QEzRxnuaZCk

// p5.js Web Editor - Image: https://editor.p5js.org/codingtrain/sketches/ZNQQx2n5o
// p5.js Web Editor - Webcam: https://editor.p5js.org/codingtrain/sketches/VIYRpcME3
// p5.js Web Editor - Webcam Persistence: https://editor.p5js.org/codingtrain/sketches/Vt9xeTxWJ

// let img;
let video;
let detector;
let detections = {};

function preload() {
  // img = loadImage('dog_cat.jpg');
  detector = ml5.objectDetector('cocossd');
}

function gotDetections(error, results) {
  if (error) {
    console.error(error);
  }

  detections = {}; // Clear previous detections

  for (let i = 0; i < results.length; i++) {
    let object = results[i];
    let label = object.label;

    if (detections[label]) {
      detections[label].push(object);
    } else {
      detections[label] = [object];
    }
  }

  detector.detect(video, gotDetections); // Request continuous object detection
}

function setup() {
  createCanvas(400, 320); // Reduced canvas size
  video = createCapture(VIDEO);
  video.size(400, 320); // Reduced video size
  video.hide();
  frameRate(10); // Lower frame rate
  detector.detect(video, gotDetections);
}

function draw() {
  image(video, 0, 0);

  let labels = Object.keys(detections);
  for (let label of labels) {
    let objects = detections[label];
    for (let i = objects.length - 1; i >= 0; i--) {
      let object = objects[i];
      stroke(0, 255, 0);
      strokeWeight(4);
      noFill();
      rect(object.x, object.y, object.width, object.height);
      noStroke();
      fill(0);
      textSize(16);
      text(label, object.x + 10, object.y + 20);
    }
  }
}

console.log("I'm done writing.");
