// Wait for the DOM to be ready
$(document).ready(function () {
    // Get the video element and canvas element
    var video = document.getElementById('video');
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    // Variables for face detection
    let model, faces;
    var lastCaptureTime = 0;
    let num = 0;
    let warning;

    // Load the face detection model
    async function loadFaceDetectionModel() {
        model = await blazeface.load();
    }

    // Start the video stream and face detection
    async function startVideoStream() {
        if (navigator.mediaDevices.getUserMedia) {
            // Request access to the user's webcam
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });

            // Set the video source to the webcam stream
            video.srcObject = stream;

            // Wait for the video to finish loading
            video.addEventListener('loadeddata', detectFaces);
        }
    }

    // Perform face detection on the video frames
    async function detectFaces() {
        // Use the face detection model to estimate faces in the video frames
        faces = await model.estimateFaces(video);

        // Get the current time
        var currentTime = Date.now();

        // Check if no face is detected or multiple faces are detected
        if ((faces.length === 0 || faces.length > 1) && (currentTime - lastCaptureTime > 5000)) {
            // Show a warning message
            if (faces.length === 0) {
                showWarning("No face detected");
                warning = "No face detected";
            }

            // Capture an image
            captureImage(warning);

            // Update the last capture time
            lastCaptureTime = currentTime;
        }

        // Continue detecting faces in the next frame
        requestAnimationFrame(detectFaces);
    }

    // Show a warning message
    function showWarning(message) {
        // Display the warning message on the screen
        $('.warning').html(message);
        $('.warning').show();

        // Hide the warning message after 3 seconds
        setTimeout(function () {
            $('.warning').hide();
        }, 3000);
    }

    // Capture an image and send it to the server
    function captureImage(reason) {
        // Draw the current frame of the video onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get the base64-encoded image data from the canvas
        var imageData = canvas.toDataURL('image/png');

        // Increment the image ID
        ++num;

        // Create a JSON object with image information
        var imageInfo = {
            id: num,
            name: reason,
            warning: reason
        };

        // Send the image data and JSON object to the server using AJAX
        $.ajax({
            type: 'POST',
            url: 'process_image.php',
            data: {
                image: imageData,
                info: JSON.stringify(imageInfo)
            },
            success: function (response) {
                console.log('Image captured and sent to the server.');
                console.log(response);

                // Update the number of captured images
                $('.num').html(num);
            }
        });
    }

    // Initialize the face detection model and start the video stream
    loadFaceDetectionModel().then(startVideoStream);
});