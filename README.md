## 📊 Visualization and Evaluation

### 📚 Table of Contents

1. [📁 Dataset Distribution](#-1-dataset-distribution)
2. [🧮 Confusion Matrix](#-2-confusion-matrix)
3. [📏 Per-Class Precision](#-3-per-class-precision)
4. [🖐️ Visualizing Hand Landmarks](#-4-visualizing-hand-landmarks)

---

### 📌 **1. Dataset Distribution**

Displays how many images are available per hand sign class to check for data imbalance.

#### 🔍 Code Snippet

```python
import os
import matplotlib.pyplot as plt

class_counts = {
    label: len(os.listdir(f'dataset/{label}'))
    for label in os.listdir('dataset') if os.path.isdir(f'dataset/{label}')
}

plt.bar(class_counts.keys(), class_counts.values(), color='skyblue')
plt.title("Images per Hand Sign")
plt.xlabel("Sign Label")
plt.ylabel("Image Count")
plt.show()
```

#### ✅ Why This Matters
This helps identify class imbalance, which can hurt model accuracy.

---

### 📌 **2. Confusion Matrix**

Visualizes the classification performance for each class, highlighting misclassifications.

#### 🔍 Code Snippet

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

cm = confusion_matrix(y_test, y_predict)
disp = ConfusionMatrixDisplay(cm, display_labels=label_map.keys())
disp.plot(cmap='Blues', xticks_rotation=45)
plt.title("Confusion Matrix")
plt.show()
```

#### ✅ Why This Matters
It shows how well the model performs on each class and where it makes mistakes.

---

### 📌 **3. Per-Class Precision**

Bar graph of precision scores per label to understand class-wise performance.

#### 🔍 Code Snippet

```python
from sklearn.metrics import classification_report

report = classification_report(y_test, y_predict, target_names=label_map.keys(), output_dict=True)
precisions = [report[label]["precision"] for label in label_map.keys()]

plt.bar(label_map.keys(), precisions, color='green')
plt.title("Precision per Hand Sign")
plt.ylabel("Precision")
plt.ylim(0, 1.1)
plt.show()
```

#### ✅ Why This Matters
You can detect if certain signs are harder for the model to classify correctly.

---

### 📌 **4. Visualizing Hand Landmarks**

Use MediaPipe to draw hand landmarks on a sample image from the dataset.

#### 🔍 Code Snippet

```python
import cv2
import mediapipe as mp

image = cv2.imread('dataset/5/0.jpg')  # Example image
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

with mp.solutions.hands.Hands(static_image_mode=True) as hands:
    result = hands.process(image_rgb)
    if result.multi_hand_landmarks:
        for landmarks in result.multi_hand_landmarks:
            mp.solutions.drawing_utils.draw_landmarks(
                image, landmarks, mp.solutions.hands.HAND_CONNECTIONS)

cv2.imshow("Landmark Visualization", image)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

#### ✅ Why This Matters
Confirms whether hand landmarks are accurately detected before prediction.
