import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import pickle
import os

class CropRecommender:
    def __init__(self):
        self.model = None
        self.data_path = 'data/crop_recommendation.csv'
        self.model_path = 'models/crop_model.pkl'
        self.load_data()
        
    def load_data(self):
        if os.path.exists(self.model_path):
            self.model = pickle.load(open(self.model_path, 'rb'))
        else:
            self.train_model()
    
    def train_model(self):
        # Load dataset
        df = pd.read_csv(self.data_path)
        
        # Split features and target
        X = df.drop('label', axis=1)
        y = df['label']
        
        # Split train-test
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        print(f"Accuracy: {accuracy_score(y_test, y_pred)}")
        print(classification_report(y_test, y_pred))
        
        # Save model
        pickle.dump(self.model, open(self.model_path, 'wb'))
    
    def recommend(self, N, P, K, temperature, humidity, ph, rainfall):
        input_data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
        prediction = self.model.predict(input_data)
        probabilities = self.model.predict_proba(input_data)[0]
        crops = self.model.classes_
        
        # Get top 3 recommendations
        top3_idx = np.argsort(probabilities)[-3:][::-1]
        recommendations = [
            {"crop": crops[i], "probability": float(probabilities[i])}
            for i in top3_idx
        ]
        
        return {
            "top_recommendation": prediction[0],
            "recommendations": recommendations
        }