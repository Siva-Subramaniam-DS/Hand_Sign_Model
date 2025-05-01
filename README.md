# Hand Gesture Recognition System

A real-time hand gesture recognition system that uses computer vision and deep learning to interpret hand gestures through a webcam. The system can recognize five different gestures: Hi, No, Ok, Talk, and You.

## Features

- Real-time hand gesture recognition through webcam
- Support for 5 different gestures:
  - 👋 Hi: Wave with palm facing forward
  - ✋ No: Hand up, palm facing forward
  - 👌 Ok: Thumb and index finger form a circle
  - 🤙 Talk: Thumb and pinky extended like a phone
  - 👉 You: Index finger pointing forward
- Web-based interface with live video feed
- Confidence score display for each prediction
- Text-to-speech capability for recognized gestures
- Gesture guide with visual examples
- Responsive design for different screen sizes

## Technical Stack

- **Backend:**
  - Python
  - Flask (Web Framework)
  - TensorFlow/Keras (Deep Learning)
  - OpenCV (Computer Vision)
  - MediaPipe (Hand Tracking)

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript
  - Font Awesome (Icons)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd Hand_Sign_Model
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install required packages:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the Flask application:
```bash
python saradhe/hand_gesture_realtime.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

3. Click the "Start Camera" button to begin gesture recognition
4. Position your hand within the green box in the video feed
5. Make one of the supported gestures
6. The system will display the recognized gesture and confidence score

## Project Structure

```
Hand_Sign_Model/
├── saradhe/
│   ├── hand_gesture_realtime.py  # Main application file
│   ├── Train.ipynb              # Model training notebook
│   ├── templates/
│   │   ├── Index.html          # Main web interface
│   │   └── about.html          # About page
│   └── static/
│       ├── Index.css           # Stylesheet
│       └── Index.js            # Frontend JavaScript
└── README.md
```

## Model Details

- Uses a ResNet50V2-based model for gesture classification
- Input image size: 224x224 pixels
- Confidence threshold: 50%
- Region of Interest (ROI) for hand detection
- Hand tracking using MediaPipe

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- MediaPipe for hand tracking capabilities
- TensorFlow/Keras for deep learning framework
- OpenCV for computer vision processing 