// Hand Gesture Recognition - Main JavaScript

// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const speakBtn = document.getElementById('speakBtn');
const resultText = document.getElementById('resultText');
const predictionLabel = document.getElementById('prediction-label');
const confidenceMeter = document.querySelector('.meter-fill');
const confidenceValue = document.querySelector('.meter-value');
const connectionStatus = document.getElementById('connection-status');
const statusText = document.getElementById('status-text');
const loadingIndicator = document.getElementById('loading-indicator');
const notification = document.getElementById('notification');
const notificationIcon = document.getElementById('notification-icon');
const notificationMessage = document.getElementById('notification-message');

// Constants
const CONFIDENCE_THRESHOLD = 70; // Must match the backend threshold
const PREDICTION_INTERVAL = 300; // Time in ms between prediction checks
const MIN_STABLE_DETECTIONS = 3; // Number of consecutive detections needed to add a gesture
const SPEAKING_RATE = 1.0; // Speech rate for text-to-speech
const SPEAKING_PITCH = 1.0; // Speech pitch for text-to-speech

// State variables
let isRunning = false;
let currentPrediction = '';
let lastPrediction = '';
let stableDetectionCount = 0;
let predictionInterval = null;
let isServerConnected = false;
let lastAddedGesture = '';
let speechSynthesisAvailable = 'speechSynthesis' in window;

// Initialize the application
function initApp() {
    // Check server connection
    checkServerConnection();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show notification if speech synthesis is not available
    if (!speechSynthesisAvailable) {
        speakBtn.style.display = 'none';
    }
    
    // Automatic connection status check
    setInterval(checkServerConnection, 5000);
}

// Setup event listeners
function setupEventListeners() {
    // Start camera button
    startBtn.addEventListener('click', startCamera);
    
    // Stop camera button
    stopBtn.addEventListener('click', stopCamera);
    
    // Clear text button
    clearBtn.addEventListener('click', () => {
        resultText.value = '';
        showNotification('Text cleared', 'info');
    });
    
    // Copy text button
    copyBtn.addEventListener('click', () => {
        if (resultText.value.trim() === '') {
            showNotification('Nothing to copy', 'warning');
            return;
        }
        
        resultText.select();
        document.execCommand('copy');
        showNotification('Text copied to clipboard', 'success');
    });
    
    // Speak text button
    if (speechSynthesisAvailable) {
        speakBtn.addEventListener('click', () => {
            if (resultText.value.trim() === '') {
                showNotification('Nothing to speak', 'warning');
                return;
            }
            
            speakText(resultText.value);
        });
    }
}

// Check server connection
function checkServerConnection() {
    fetch('/check_camera_status')
        .then(response => {
            if (response.ok) {
                updateConnectionStatus(true);
                return response.json();
            } else {
                throw new Error('Server connection failed');
            }
        })
        .then(data => {
            // Update UI based on the camera status from the server
            updateCameraStatus(data.running);
        })
        .catch(error => {
            console.error('Connection error:', error);
            updateConnectionStatus(false);
        });
}

// Update connection status UI
function updateConnectionStatus(connected) {
    isServerConnected = connected;
    
    if (connected) {
        connectionStatus.classList.remove('offline');
        connectionStatus.classList.add('online');
        statusText.textContent = 'Connected';
    } else {
        connectionStatus.classList.remove('online');
        connectionStatus.classList.add('offline');
        statusText.textContent = 'Disconnected';
        
        // Disable buttons if server is disconnected
        startBtn.disabled = true;
        stopBtn.disabled = true;
    }
}

// Update camera status UI based on server response
function updateCameraStatus(running) {
    isRunning = running;
    
    if (running) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        loadingIndicator.style.display = 'none';
    } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

// Start the camera
function startCamera() {
    if (!isServerConnected) {
        showNotification('Server is not connected', 'error');
        return;
    }
    
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    
    // Disable buttons during loading
    startBtn.disabled = true;
    stopBtn.disabled = true;
    
    // Request to start camera on the server
    fetch('/start_camera')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Camera started successfully
                isRunning = true;
                startBtn.disabled = true;
                stopBtn.disabled = false;
                loadingIndicator.style.display = 'none';
                
                // Start prediction interval
                startPredictionInterval();
                
                showNotification('Camera started successfully', 'success');
            } else {
                // Failed to start camera
                startBtn.disabled = false;
                stopBtn.disabled = true;
                loadingIndicator.style.display = 'none';
                
                showNotification(`Failed to start camera: ${data.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Error starting camera:', error);
            startBtn.disabled = false;
            stopBtn.disabled = true;
            loadingIndicator.style.display = 'none';
            
            showNotification('Error starting camera', 'error');
        });
}

// Stop the camera
function stopCamera() {
    if (!isServerConnected) {
        showNotification('Server is not connected', 'error');
        return;
    }
    
    // Disable buttons during request
    startBtn.disabled = true;
    stopBtn.disabled = true;
    
    // Request to stop camera on the server
    fetch('/stop_camera')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Camera stopped successfully
                isRunning = false;
                startBtn.disabled = false;
                stopBtn.disabled = true;
                
                // Stop prediction interval
                stopPredictionInterval();
                
                // Reset UI
                predictionLabel.textContent = 'Camera stopped';
                confidenceMeter.style.width = '0%';
                confidenceValue.textContent = '0%';
                
                showNotification('Camera stopped successfully', 'success');
            } else {
                // Failed to stop camera
                startBtn.disabled = true;
                stopBtn.disabled = false;
                
                showNotification(`Failed to stop camera: ${data.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Error stopping camera:', error);
            startBtn.disabled = true;
            stopBtn.disabled = false;
            
            showNotification('Error stopping camera', 'error');
        });
}

// Start the prediction interval
function startPredictionInterval() {
    if (predictionInterval) {
        clearInterval(predictionInterval);
    }
    
    predictionInterval = setInterval(getPrediction, PREDICTION_INTERVAL);
}

// Stop the prediction interval
function stopPredictionInterval() {
    if (predictionInterval) {
        clearInterval(predictionInterval);
        predictionInterval = null;
    }
}

// Get prediction from the server
function getPrediction() {
    if (!isServerConnected || !isRunning) return;
    
    fetch('/get_prediction')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.prediction) {
                const prediction = data.prediction;
                
                // Update UI with prediction
                updatePredictionUI(prediction);
                
                // Check for stable prediction
                processStablePrediction(prediction);
            }
        })
        .catch(error => {
            console.error('Error getting prediction:', error);
        });
}

// Update the prediction UI
function updatePredictionUI(prediction) {
    const gestureClass = prediction.class;
    const confidence = prediction.confidence;
    
    // Update prediction label
    if (gestureClass && confidence > 0) {
        predictionLabel.textContent = gestureClass;
        confidenceMeter.style.width = `${confidence}%`;
        confidenceValue.textContent = `${confidence.toFixed(1)}%`;
        
        // Update colors based on confidence
        if (confidence >= CONFIDENCE_THRESHOLD) {
            predictionLabel.style.color = '#4cc9f0';
            confidenceMeter.style.backgroundColor = '#4cc9f0';
        } else {
            predictionLabel.style.color = '#adb5bd';
            confidenceMeter.style.backgroundColor = '#adb5bd';
        }
    } else {
        predictionLabel.textContent = 'No gesture detected';
        confidenceMeter.style.width = '0%';
        confidenceValue.textContent = '0%';
    }
}

// Process stable predictions to avoid flickering
function processStablePrediction(prediction) {
    const gestureClass = prediction.class;
    const confidence = prediction.confidence;
    
    // Check if the prediction is above threshold
    if (confidence >= CONFIDENCE_THRESHOLD) {
        currentPrediction = gestureClass;
        
        // Check if prediction is stable
        if (currentPrediction === lastPrediction) {
            stableDetectionCount++;
            
            // Add gesture to result text if stable for MIN_STABLE_DETECTIONS frames
            if (stableDetectionCount >= MIN_STABLE_DETECTIONS && lastAddedGesture !== currentPrediction) {
                addGestureToResult(currentPrediction);
                lastAddedGesture = currentPrediction;
            }
        } else {
            // Reset counter for new gesture
            stableDetectionCount = 1;
        }
        
        // Update last prediction
        lastPrediction = currentPrediction;
    } else {
        // Reset if below threshold
        stableDetectionCount = 0;
        lastPrediction = '';
        currentPrediction = '';
    }
}

// Add gesture to result text
function addGestureToResult(gesture) {
    // Different handling based on gesture
    switch (gesture) {
        case 'Hi':
            appendToResult('Hello ');
            break;
        case 'No':
            appendToResult('No ');
            break;
        case 'Ok':
            appendToResult('Okay ');
            break;
        case 'Talk':
            appendToResult('Let\'s talk ');
            break;
        case 'You':
            appendToResult('You ');
            break;
    }
}

// Append text to the result textarea
function appendToResult(text) {
    resultText.value += text;
    resultText.scrollTop = resultText.scrollHeight;
    
    // Show notification
    showNotification(`Added: ${text.trim()}`, 'info');
}

// Text-to-speech function
function speakText(text) {
    // Cancel any existing speech
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set speech properties
    utterance.rate = SPEAKING_RATE;
    utterance.pitch = SPEAKING_PITCH;
    
    // Show notification
    showNotification('Speaking...', 'info');
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
    
    // When finished speaking
    utterance.onend = () => {
        showNotification('Finished speaking', 'success');
    };
    
    // Error handling
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        showNotification('Speech synthesis error', 'error');
    };
}

// Show notification
function showNotification(message, type = 'info') {
    // Update notification content
    notificationMessage.textContent = message;
    
    // Update icon based on type
    switch (type) {
        case 'success':
            notificationIcon.textContent = '✓';
            notificationIcon.className = 'success-icon';
            break;
        case 'error':
            notificationIcon.textContent = '✗';
            notificationIcon.className = 'error-icon';
            break;
        case 'warning':
            notificationIcon.textContent = '⚠';
            notificationIcon.className = 'warning-icon';
            break;
        default:
            notificationIcon.textContent = 'ℹ';
            notificationIcon.className = 'info-icon';
            break;
    }
    
    // Show notification
    notification.classList.add('visible');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('visible');
    }, 3000);
}

// Add keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Only handle keyboard shortcuts when focused on document body (not in textarea)
        if (document.activeElement !== document.body) return;
        
        // Ctrl+Shift+S to start camera
        if (event.ctrlKey && event.shiftKey && event.key === 'S') {
            event.preventDefault();
            if (!startBtn.disabled) startCamera();
        }
        
        // Ctrl+Shift+X to stop camera
        if (event.ctrlKey && event.shiftKey && event.key === 'X') {
            event.preventDefault();
            if (!stopBtn.disabled) stopCamera();
        }
        
        // Ctrl+Shift+C to clear text
        if (event.ctrlKey && event.shiftKey && event.key === 'C') {
            event.preventDefault();
            resultText.value = '';
            showNotification('Text cleared', 'info');
        }
    });
}

// Handle window visibility changes
function handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden, pause the camera if running
            if (isRunning) {
                // Store current state
                const wasRunning = isRunning;
                
                // Stop camera but don't update UI
                fetch('/stop_camera')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Stop prediction interval
                            stopPredictionInterval();
                            
                            // Store that we auto-paused
                            document.autoPaused = wasRunning;
                        }
                    })
                    .catch(error => {
                        console.error('Error auto-stopping camera:', error);
                    });
            }
        } else {
            // Page is visible again, resume if it was auto-paused
            if (document.autoPaused) {
                // Try to restart camera
                fetch('/start_camera')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Camera restarted successfully
                            isRunning = true;
                            
                            // Start prediction interval
                            startPredictionInterval();
                            
                            // Clean up auto-pause flag
                            document.autoPaused = false;
                        }
                    })
                    .catch(error => {
                        console.error('Error auto-restarting camera:', error);
                    });
            }
        }
    });
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupKeyboardShortcuts();
    handleVisibilityChange();
});

// Handle window unload
window.addEventListener('beforeunload', () => {
    // Stop camera if running when page is closed
    if (isRunning) {
        fetch('/stop_camera').catch(() => {});
    }
});