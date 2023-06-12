$(document).ready(function() {
    // Get the video element and canvas element
    var video = document.getElementById('video');
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    // Variables for face detection
    let model, faces;
    var lastCaptureTime = 0;
    let num = 0;
    let aud = 1;
    let warning;

    // Variables for frequency detection
    var audioContext, analyser, dataArray, soundDetected;
    const MIN_FREQUENCY = 10;
    const MAX_FREQUENCY = 4000;

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

            // Call the frequencyChecker function
            voiceDetector();
        }
    }

    // Check if human voice is detected from microphone
    function voiceDetector() {
        var audioContext = new AudioContext();
        var mediaRecorder;
        var isRecording = false;
        var isPaused = false; // Flag to track if detection is paused
        var detectionInterval; // Variable to store the setInterval reference

        navigator.mediaDevices.getUserMedia({
                audio: true
            })
            .then(function(stream) {
                var audioSource = audioContext.createMediaStreamSource(stream);
                var analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                audioSource.connect(analyser);

                detectionInterval = setInterval(function() {
                    var amplitudeData = new Uint8Array(analyser.fftSize);
                    analyser.getByteTimeDomainData(amplitudeData);
                    var sum = amplitudeData.reduce(function(acc, value) {
                        return acc + value;
                    }, 0);
                    var averageAmplitude = sum / amplitudeData.length;

                    var threshold = 127.6;
                    if (averageAmplitude > threshold) {
                        console.log(averageAmplitude);
                        console.log("Human voice detected");

                        if (!isRecording && !isPaused) {
                            isRecording = true;
                            startRecording(stream);
                        }
                    }
                }, 1000);
            })
            .catch(function(error) {
                console.error(error);
            });

        function startRecording(stream) {
            mediaRecorder = new MediaRecorder(stream);
            var chunks = [];

            mediaRecorder.ondataavailable = function(e) {
                chunks.push(e.data);
            };

            mediaRecorder.onstop = function() {
                isRecording = false;
                var audioBlob = new Blob(chunks, {
                    type: 'audio/wav'
                });

                var fileReader = new FileReader();
                fileReader.onloadend = function() {
                    var audioData = fileReader.result;
                    saveAudioFile(audioData);
                };
                fileReader.readAsDataURL(audioBlob);

                isPaused = true; // Pause voice detection
                setTimeout(resumeDetection, 30000);
            };

            mediaRecorder.start();
            setTimeout(stopRecording, 5000);
        }

        function stopRecording() {
            mediaRecorder.stop();
            chunks = [];
        }

        function resumeDetection() {
            isPaused = false; // Resume voice detection
            console.log("Resuming voice detection...");
        }

        function saveAudioFile(audioData) {
            var data = {
                id: aud,
                audio: audioData
            };

            $.ajax({
                url: 'save_audio.php',
                type: 'POST',
                data: data,
                success: function(response) {
                    console.log('Audio file saved successfully.');
                    console.log(response);
                    ++aud;
                },
                error: function(xhr, status, error) {
                    console.error('Error saving audio file:', error);
                }
            });
        }
    }

    // Detect distraction in the video stream
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
            var distanceThreshold = 20; // Adjust this value based on your requirements

            // Set the angle threshold
            var angleThreshold = 100; // Adjust this value based on your requirements

            // Check if the face is tilted left or right
            if (angle < -30 || angle > 30) {
                showWarning("Face tilted left or right");
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
        var currentTime = Date.now();
        if ((faces.length === 0 || faces.length > 1) && (currentTime - lastCaptureTime > 5000)) {
            // Show warning message
            if (faces.length === 0) {
                showWarning("No face detected");
                warning = "No face detected";
            } else if (faces.length > 1) {
                showWarning("Multiple faces detected");
                warning = "Multiple faces detected";
            } else if (detectMobile()) {
                showWarning("Mobile device detected");
                warning = "Mobile device detected";
            }
            captureImage(warning);
            lastCaptureTime = currentTime;
        }
        detectDistraction(); // Call the detectDistraction function
        requestAnimationFrame(detectFaces);
    }

    // Show warning message
    function showWarning(message) {
        $('.warning').html(message);
        $('.warning').show();
        setTimeout(function() {
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
            success: function(response) {
                console.log('Image captured and sent to the server.');
                console.log(response);
                $('.num').html(num);
            }
        });
    }

    // Initialize the face detection model and start the video stream
    loadFaceDetectionModel().then(startVideoStream);
});