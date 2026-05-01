from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join("..", "ml", "model.pkl")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

@app.route("/")
def home():
    return "Backend is running"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        input_df = pd.DataFrame([{
            "suburb": data.get("suburb"),
            "type": data.get("type"),
            "num_bath": data.get("num_bath"),
            "num_bed": data.get("num_bed"),
            "num_parking": data.get("num_parking"),
            "property_size": data.get("property_size"),
            "suburb_median_income": data.get("suburb_median_income"),
            "cash_rate": data.get("cash_rate"),
            "km_from_cbd": data.get("km_from_cbd")   
        }])

        prediction_log = model.predict(input_df)[0]
        prediction = np.expm1(prediction_log)

        listed_price = data.get("listed_price")
        difference = None
        label = None

        if listed_price is not None:
            difference = prediction - listed_price
            threshold = 50000

            if difference > threshold:
                label = "likely undervalued"
            elif difference < -threshold:
                label = "likely overpriced"
            else: label = "Close to predicted value"

        return jsonify({
            "predicted_price": round(float(prediction), 2),
            "listed_price": listed_price,
            "difference": round(float(difference), 2) if difference is not None else None,
            "label": label
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    sample = {
        "suburb": "Parramatta",
        "type": "House",
        "num_bath": 2,
        "num_bed": 3,
        "num_parking": 1,
        "property_size": 500,
        "suburb_median_income": 45000,
        "cash_rate": 0.1,
        "km_from_cbd": 24,
        "listed_price": 980000
    }
    df = pd.DataFrame([sample])
    test_prediction_log = model.predict(df)[0]
    test_prediction = np.expm1(test_prediction_log)
    print("TEST PREDICTION:", test_prediction)
    app.run(debug=True, port=5000)
