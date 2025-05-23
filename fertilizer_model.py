import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import pickle
import os

class FertilizerRecommender:
    def __init__(self):
        self.model = None
        self.le_soil = LabelEncoder()
        self.le_crop = LabelEncoder()
        self.le_fertilizer = LabelEncoder()
        self.data_path = 'data/fertilizer_recommendation.csv'
        self.model_path = 'models/fertilizer_model.pkl'
        self.load_data()
    
    def load_data(self):
        if os.path.exists(self.model_path):
            self.model = pickle.load(open(self.model_path, 'rb'))
            # Load encoders
            self.le_soil = pickle.load(open('models/le_soil.pkl', 'rb'))
            self.le_crop = pickle.load(open('models/le_crop.pkl', 'rb'))
            self.le_fertilizer = pickle.load(open('models/le_fertilizer.pkl', 'rb'))
        else:
            self.train_model()
    
    def train_model(self):
        # Load dataset
        df = pd.read_csv(self.data_path)
        
        # Encode categorical features
        df['Soil Type'] = self.le_soil.fit_transform(df['Soil Type'])
        df['Crop Type'] = self.le_crop.fit_transform(df['Crop Type'])
        df['Fertilizer Name'] = self.le_fertilizer.fit_transform(df['Fertilizer Name'])
        
        # Split features and target
        X = df.drop('Fertilizer Name', axis=1)
        y = df['Fertilizer Name']
        
        # Split train-test
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        print(f"Accuracy: {accuracy_score(y_test, y_pred)}")
        print(classification_report(y_test, y_pred))
        
        # Save model and encoders
        pickle.dump(self.model, open(self.model_path, 'wb'))
        pickle.dump(self.le_soil, open('models/le_soil.pkl', 'wb'))
        pickle.dump(self.le_crop, open('models/le_crop.pkl', 'wb'))
        pickle.dump(self.le_fertilizer, open('models/le_fertilizer.pkl', 'wb'))
    
    def recommend(self, temperature, humidity, moisture, soil_type, crop_type, N, P, K):
        # Encode inputs
        try:
            soil_encoded = self.le_soil.transform([soil_type])[0]
            crop_encoded = self.le_crop.transform([crop_type])[0]
        except ValueError as e:
            return {"error": str(e)}
        
        input_data = np.array([[temperature, humidity, moisture, soil_encoded, crop_encoded, N, P, K]])
        prediction = self.model.predict(input_data)
        fertilizer = self.le_fertilizer.inverse_transform(prediction)[0]
        
        # Get nutrient deficiency analysis
        deficiencies = []
        if N < 20:
            deficiencies.append("Nitrogen (N)")
        if P < 10:
            deficiencies.append("Phosphorus (P)")
        if K < 15:
            deficiencies.append("Potassium (K)")
        
        return {
            "fertilizer": fertilizer,
            "deficiencies": deficiencies,
            "soil_health": {
                "N": N,
                "P": P,
                "K": K,
                "status": "Good" if not deficiencies else "Needs Improvement"
            }
        }