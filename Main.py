from flask import Flask, render_template, Response, jsonify
import cv2
import numpy as np
import tensorflow as tf
import os
import json

app = Flask(__name__)

# Load your pre-trained model
model = None

def load_model():
    global model
    try:
        model = tf.keras.models.load_model('hand_gesture_data.h5')
        print("Model loaded successfully!")
        return True
    except Exception as e:
        print(f"Failed to load model: {str(e)}")
        return False

# Labels for prediction
labels = ['Hi', 'My', 'Name', 'Is', 'and', 'Friend', 'Thank You', 'I am', 
         'listening', 'do you', 'talk', 'want to', 'a', 'e', 'm', 'n','o', 's', 'r']

camera = None
prediction_text = ""

def process_frame(frame):
    global prediction_text
    
    # Preprocess the frame for model input
    # Note: You might need to adjust this preprocessing based on how your model was trained
    resized = cv2.resize(frame, (224, 224))  # Adjust size based on your model's expected input
    normalized = resized / 255.0  # Normalize pixel values
    
    # Make prediction
    try:
        if model is not None:
            input_data = np.expand_dims(normalized, axis=0)
            predictions = model.predict(input_data)
            predicted_class_index = np.argmax(predictions[0])
            
            if 0 <= predicted_class_index < len(labels):
                prediction_text = labels[predicted_class_index]
            else:
                prediction_text = "Unknown"
    except Exception as e:
        prediction_text = f"Error: {str(e)}"
    
    # Draw a box for the hand gesture area
    cv2.rectangle(frame, (50, 50), (300, 300), (0, 255, 0), 2)
    cv2.putText(frame, "Place hand here", (50, 40), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 0), 2)
    
    # Display the predicted text on the frame
    cv2.putText(frame, f"Prediction: {prediction_text}", (50, 350), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
                
    return frame

def generate_frames():
    global camera
    
    if camera is None:
        camera = cv2.VideoCapture(0)  # Open the camera
        
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            # Process frame to detect hand signs
            processed_frame = process_frame(frame)
            
            # Convert to JPEG format
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def index():
    return render_template('Index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_camera')
def start_camera():
    global camera
    if camera is None:
        camera = cv2.VideoCapture(0)
    return jsonify({"status": "Camera started"})

@app.route('/stop_camera')
def stop_camera():
    global camera
    if camera is not None:
        camera.release()
        camera = None
    return jsonify({"status": "Camera stopped"})

@app.route('/get_prediction')
def get_prediction():
    global prediction_text
    return jsonify({"text": prediction_text})

if __name__ == '__main__':
    load_model()
    app.run(debug=True)