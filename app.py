from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import tensorflow as tf
import numpy as np
import cv2
import caer

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

model = tf.keras.models.load_model('./dataset/best_model.keras')
class_names = ['homer_simpson',
               'ned_flanders',
               'moe_szyslak',
               'lisa_simpson',
               'bart_simpson',
               'marge_simpson',
               'krusty_the_clown',
               'principal_skinner',
               'charles_montgomery_burns',
               'milhouse_van_houten']

IMG_SIZE = (80, 80)

def preprocess_image(image_bytes):
    # Decode image bytes to a NumPy array
    image_array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_GRAYSCALE)  # Convert to grayscale
    image = caer.resize(image, IMG_SIZE)  # Resize to model input size
    image = caer.to_tensor(image, dtype="float32") / 255.0  # Normalize
    image = np.expand_dims(image, axis=-1)  # Add channel dimension
    image = np.expand_dims(image, axis=0)  # Add batch dimension
    return image

@app.route('/predict', methods=['POST'])
def predict():
    file = request.files['file']
    pre_processed_image = preprocess_image(file.read())
    
    prediction = model.predict(pre_processed_image)
    predcted_class = class_names[np.argmax(prediction)]
    confidence = float(np.max(prediction))
    
    return jsonify({
        'character': predcted_class, 
        "confidence": confidence
    })

@app.route('/', methods=['GET'])
def home():
    return "Hello World"

if __name__ == '__main__':
    app.run(debug=True)