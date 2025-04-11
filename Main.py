import streamlit as st
import cv2
import numpy as np
import pickle
import mediapipe as mp
from PIL import Image

# -------------------- Sidebar Content -------------------------
st.sidebar.title("✋ Hand Sign Detection")
st.sidebar.markdown("### 📌 Instructions")
st.sidebar.markdown("""
1. Turn **Camera ON** using the toggle.
2. Show a hand gesture clearly in front of webcam.
3. Detected sign will be shown below the video.
""")

st.sidebar.markdown("---")
st.sidebar.markdown("👨‍🎓 **Student Name**: Your Name")
st.sidebar.markdown("👨‍🏫 **Guide Name**: Guide Name")

# -------------------- Load the Model -------------------------
with open('./model.p', 'rb') as f:
    model_dict = pickle.load(f)

model = model_dict['model']
label_map = model_dict.get('label_map')

# Reverse label map
if label_map:
    labels_dict = {v: k for k, v in label_map.items()}
else:
    labels_dict = {'1': 0, '2': 1, '3': 2, '4': 3, '5': 4, 'a': 5, 'e': 6, 'h': 7, 'i': 8, 'l': 9, 'm': 10, 'o': 11, 'r': 12, 's': 13}

# -------------------- MediaPipe Setup -------------------------
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

hands = mp_hands.Hands(static_image_mode=False, min_detection_confidence=0.5)

# -------------------- Helper: Extract Features -------------------------
def extract_landmark_features(landmarks):
    x_vals = [lm.x for lm in landmarks]
    y_vals = [lm.y for lm in landmarks]
    min_x, min_y = min(x_vals), min(y_vals)

    features = []
    for lm in landmarks:
        features.append(lm.x - min_x)
        features.append(lm.y - min_y)

    return features, x_vals, y_vals

# -------------------- Streamlit App Layout -------------------------
st.title("🧠 Real-time Hand Sign Recognition")
run = st.toggle("🎥 Turn Camera ON")

FRAME_WINDOW = st.image([])  # For showing video stream
output_text = st.empty()     # For displaying predicted sign

# -------------------- Webcam Prediction Loop -------------------------
if run:
    cap = cv2.VideoCapture(0)

    while run:
        ret, frame = cap.read()
        if not ret:
            st.warning("Webcam not found.")
            break

        frame = cv2.flip(frame, 1)
        H, W, _ = frame.shape
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(frame_rgb)

        predicted_char = ""

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                    mp_drawing_styles.get_default_hand_landmarks_style(),
                    mp_drawing_styles.get_default_hand_connections_style()
                )

                features, x_vals, y_vals = extract_landmark_features(hand_landmarks.landmark)

                if len(features) == model.n_features_in_:
                    prediction = model.predict([np.asarray(features)])
                    predicted_char = labels_dict[int(prediction[0])]

                    x1, y1 = int(min(x_vals) * W) - 20, int(min(y_vals) * H) - 20
                    x2, y2 = int(max(x_vals) * W) + 20, int(max(y_vals) * H) + 20

                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 0), 2)
                    cv2.putText(frame, predicted_char, (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 2, cv2.LINE_AA)

        FRAME_WINDOW.image(frame, channels="BGR")
        output_text.markdown(f"### 🔤 Detected Sign: `{predicted_char}`")

    cap.release()
else:
    st.warning("👆 Turn ON the camera to start recognition.")
