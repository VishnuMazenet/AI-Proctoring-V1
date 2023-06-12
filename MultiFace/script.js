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
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
            video.srcObject = stream;
            video.addEventListener('loadeddata', detectFaces); // Wait for the video to finish loading

        }
    }
    async function detectFaces() {
        faces = await model.estimateFaces(video);
        var currentTime = Date.now();
        if (faces.length > 1 && (currentTime - lastCaptureTime > 5000)) {
            // Show warning message
            showWarning("Multiple faces detected");
            captureImage("Multiple face detected");
            lastCaptureTime = currentTime;
        }
        requestAnimationFrame(detectFaces);
    }

    // Show warning message
    function showWarning(message) {
        $('.warning').html(message);
        $('.warning').show();
        setTimeout(function () {
            $('.warning').hide();
        }, 3000);
    }

    // Capture image and send to the server
    function captureImage(reason) {
        // Draw the current video frame onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get the base64-encoded image data from the canvas
        var imageData = canvas.toDataURL('image/png');

        ++num;

        // Create the JSON object with image information
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
                $('.num').html(num);
            }
        });
    }

    // Initialize the face detection model and start the video stream
    loadFaceDetectionModel().then(startVideoStream);
});