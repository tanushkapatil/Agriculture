from flask import Flask, render_template, request, jsonify
from crop_model import CropRecommender
from fertilizer_model import FertilizerRecommender
import os

app = Flask(__name__)

# Initialize models
crop_recommender = CropRecommender()
fertilizer_recommender = FertilizerRecommender()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/recommend_crop', methods=['POST'])
def recommend_crop():
    try:
        data = request.get_json()
        
        N = float(data['N'])
        P = float(data['P'])
        K = float(data['K'])
        temperature = float(data['temperature'])
        humidity = float(data['humidity'])
        ph = float(data['ph'])
        rainfall = float(data['rainfall'])
        
        result = crop_recommender.recommend(N, P, K, temperature, humidity, ph, rainfall)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/recommend_fertilizer', methods=['POST'])
def recommend_fertilizer():
    try:
        data = request.get_json()
        
        temperature = float(data['temperature'])
        humidity = float(data['humidity'])
        moisture = float(data['moisture'])
        soil_type = data['soil_type']
        crop_type = data['crop_type']
        N = float(data['N'])
        P = float(data['P'])
        K = float(data['K'])
        
        result = fertilizer_recommender.recommend(
            temperature, humidity, moisture, soil_type, crop_type, N, P, K
        )
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    # Create models directory if not exists
    if not os.path.exists('models'):
        os.makedirs('models')
    app.run(debug=True)