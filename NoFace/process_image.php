<?php
if (isset($_POST['image']) && isset($_POST['info'])) {
    // Get the base64-encoded image data
    $imageData = $_POST['image'];

    // Remove the "data:image/png;base64," prefix from the data
    $imageData = str_replace('data:image/png;base64,', '', $imageData);

    // Decode the base64-encoded image data
    $decodedImage = base64_decode($imageData);

    // Get the JSON object and decode it
    $info = json_decode($_POST['info'], true);

    // Add the image information to the JSON object
    $file = $info['name'];

    $file_ = str_replace(' ', '_', $file);

    $id = $info['id'];

    // Generate a unique filename for the image
    $filename = $file_ . '(' . $id . ').png';

    $filePath = 'picture/';

    // Save the image to the server
    file_put_contents($filePath. $filename, $decodedImage);

    $info['name'] = $filename;

    // Save the updated JSON object to a file
    $jsonFilename = 'image_info.json';
    $jsonContents = file_get_contents($jsonFilename);
    $jsonData = json_decode($jsonContents, true);
    if ($jsonData === null) {
        $jsonData = array();
    }
    $jsonData['images'][] = $info;
    file_put_contents($jsonFilename, json_encode($jsonData));

    // Return a response if necessary
    echo 'Image saved as ' . $filename;
}
