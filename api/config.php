<?php
/**
 * Country Farm Matugga - API Configuration
 * 
 * Configure your settings here after uploading to Hostinger
 */

// Security key - Change this to a random string!
define('API_SECRET_KEY', 'change-this-to-a-random-string-123');

// Data storage directory (relative to api folder)
define('DATA_DIR', __DIR__ . '/data/');

// Allowed origins for CORS (your domain)
// Change this to your actual domain after deploying
define('ALLOWED_ORIGINS', [
    'http://localhost',
    'http://127.0.0.1',
    'https://yourdomain.com',      // Replace with your actual domain
    'https://www.yourdomain.com',  // Replace with your actual domain
]);

// Enable debug mode (set to false in production)
define('DEBUG_MODE', false);

// Create data directory if it doesn't exist
if (!file_exists(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}

// CORS headers
function setCorsHeaders() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    // In debug mode, allow all origins
    if (DEBUG_MODE || in_array($origin, ALLOWED_ORIGINS) || in_array('*', ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
    }
    
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, X-API-Key");
    header("Access-Control-Max-Age: 86400");
    header("Content-Type: application/json; charset=utf-8");
    
    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}

// Verify API key for write operations
function verifyApiKey() {
    $headers = getallheaders();
    $apiKey = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : '';
    
    if ($apiKey !== API_SECRET_KEY) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid API key']);
        exit();
    }
}

// Send JSON response
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit();
}

// Send error response
function errorResponse($message, $code = 400) {
    jsonResponse(['error' => true, 'message' => $message], $code);
}

// Get JSON file path for a data key
function getDataFilePath($key) {
    // Sanitize key to prevent directory traversal
    $safeKey = preg_replace('/[^a-zA-Z0-9_-]/', '', $key);
    return DATA_DIR . $safeKey . '.json';
}

// Read data from file
function readData($key) {
    $file = getDataFilePath($key);
    if (file_exists($file)) {
        $content = file_get_contents($file);
        return json_decode($content, true);
    }
    return null;
}

// Write data to file
function writeData($key, $data) {
    $file = getDataFilePath($key);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents($file, $json) !== false;
}
?>
