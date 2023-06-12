<?php
// Get the audio data from the POST request
$audioData = $_POST['audio'];
$id = $_POST['id'];

// Decode the base64-encoded audio data
$decodedAudioData = base64_decode(preg_replace('#^data:audio/\w+;base64,#i', '', $audioData));

// Set the file path and name
$filePath = 'audio/';
$fileName = 'recorded_audio' . $id . '.wav';

// Save the audio file
file_put_contents($filePath . $fileName, $decodedAudioData);

echo 'Audio saved as ' . $fileName;
