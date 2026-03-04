<?php
/**
 * Country Farm Matugga - Data API
 * 
 * Handles reading and writing data to JSON files
 * 
 * Endpoints:
 *   GET  /api/data.php?key=farmProducts     - Read data
 *   POST /api/data.php                      - Write data (requires API key)
 *   GET  /api/data.php?action=all           - Read all data (for initial load)
 */

require_once 'config.php';

setCorsHeaders();

// Valid data keys that can be stored
$validKeys = [
    'farmProducts',
    'farmVideos',
    'websiteContent',
    'farmQuotes',
    'farmOrders',
    'farmCustomers',
    'farmExpenses'
];

// Handle GET request (read data)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // Read all data at once
    if (isset($_GET['action']) && $_GET['action'] === 'all') {
        $allData = [];
        foreach ($validKeys as $key) {
            $data = readData($key);
            if ($data !== null) {
                $allData[$key] = $data;
            }
        }
        jsonResponse(['success' => true, 'data' => $allData]);
    }
    
    // Read single key
    if (isset($_GET['key'])) {
        $key = $_GET['key'];
        
        if (!in_array($key, $validKeys)) {
            errorResponse('Invalid data key', 400);
        }
        
        $data = readData($key);
        jsonResponse(['success' => true, 'data' => $data]);
    }
    
    // No key specified
    jsonResponse([
        'success' => true,
        'message' => 'Country Farm Matugga API',
        'endpoints' => [
            'GET ?key=farmProducts' => 'Read products',
            'GET ?action=all' => 'Read all data',
            'POST (with API key)' => 'Write data'
        ]
    ]);
}

// Handle POST request (write data)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Verify API key for write operations
    verifyApiKey();
    
    // Get POST body
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);
    
    if (!$body) {
        errorResponse('Invalid JSON body', 400);
    }
    
    // Write single key
    if (isset($body['key']) && isset($body['data'])) {
        $key = $body['key'];
        
        if (!in_array($key, $validKeys)) {
            errorResponse('Invalid data key: ' . $key, 400);
        }
        
        if (writeData($key, $body['data'])) {
            jsonResponse(['success' => true, 'message' => 'Data saved', 'key' => $key]);
        } else {
            errorResponse('Failed to save data', 500);
        }
    }
    
    // Write multiple keys at once
    if (isset($body['updates']) && is_array($body['updates'])) {
        $results = [];
        $errors = [];
        
        foreach ($body['updates'] as $key => $data) {
            if (!in_array($key, $validKeys)) {
                $errors[] = "Invalid key: $key";
                continue;
            }
            
            if (writeData($key, $data)) {
                $results[] = $key;
            } else {
                $errors[] = "Failed to save: $key";
            }
        }
        
        if (count($errors) > 0 && count($results) === 0) {
            errorResponse(implode(', ', $errors), 500);
        }
        
        jsonResponse([
            'success' => true,
            'saved' => $results,
            'errors' => $errors
        ]);
    }
    
    errorResponse('Missing key/data or updates in request body', 400);
}

// Method not allowed
http_response_code(405);
jsonResponse(['error' => 'Method not allowed']);
?>
