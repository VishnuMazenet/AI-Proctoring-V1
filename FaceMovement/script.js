$(document).ready(function () {
    // Get the video element and canvas element
    var video = document.getElementById('video');
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    // Variables for face detection
    let model, faces;

    // Load the face detection model
    async function loadFaceDetectionModel() {
        model = await blazeface.load();
    }

    // Start the video stream and face detection
    async function startVideoStream() {
        if (navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
            video.srcObject = stream;
            video.addEventListener('loadeddata', detectFaces); // Wait for the video to finish loading

        }
    }
    function detectDistraction() {
        if (faces.length === 1) {
            var landmarks = faces[0].landmarks;
            var leftEye = landmarks[0];
            var rightEye = landmarks[1];
            var nose = landmarks[2];
            var leftEyeX = leftEye[0];
            var leftEyeY = leftEye[1];
            var rightEyeX = rightEye[0];
            var rightEyeY = rightEye[1];
            var noseX = nose[0];
            var noseY = nose[1];

            // Calculate the distance between the eyes and nose
            var eyeNoseDist = Math.sqrt(Math.pow(noseX - ((leftEyeX + rightEyeX) / 2), 2) + Math.pow(noseY - ((leftEyeY + rightEyeY) / 2), 2));

            // Calculate the horizontal distance between the eyes
            var eyeDistX = rightEyeX - leftEyeX;

            // Calculate the vertical distance between the eyes
            var eyeDistY = rightEyeY - leftEyeY;

            // Calculate the angle between the eyes and the nose (in degrees)
            var angle = Math.atan2(eyeDistY, eyeDistX) * (180 / Math.PI);

            // Set the distance threshold
            var distanceThreshold = 10; // Adjust this value based on your requirements

            // Set the angle threshold
            var angleThreshold = 120; // Adjust this value based on your requirements

            // Set the X coordinate threshold for detecting left or right rotation
            var rotationThreshold = 10;  // Adjust this value based on your requirements

            // Calculate the angle between the eyes and the reference line
            var referenceLineSlope = (rightEyeY - leftEyeY) / (rightEyeX - leftEyeX);
            var referenceLineAngle = Math.atan(referenceLineSlope) * (180 / Math.PI);

            // Set the angle threshold for detecting left or right rotation
            var rotationThreshold = 10; // Adjust this value based on your requirements

            // Check if the face is rotated to the left
            if (referenceLineAngle > rotationThreshold) {
                showWarning("Face rotated left");
            }
            // Check if the face is rotated to the right
            else if (referenceLineAngle < -rotationThreshold) {
                showWarning("Face rotated right");
            }
            // Check if the face is tilted up
            else if (eyeNoseDist < distanceThreshold && angle > -angleThreshold && angle < angleThreshold) {
                showWarning("Face tilted up");
            }
        }
    }

    // Detect faces in the video stream
    async function detectFaces() {
        faces = await model.estimateFaces(video);
        detectDistraction(); // Call the detectDistraction function
        requestAnimationFrame(detectFaces);
    }

    // Show warning message
    function showWarning(message) {
        $('.warning').html(message);
        $('.warning').show();
        setTimeout(function () {
            $('.warning').hide();
        }, 1000);
    }


    // Initialize the face detection model and start the video stream
    loadFaceDetectionModel().then(startVideoStream);
});