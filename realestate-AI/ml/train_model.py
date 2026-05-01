import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
import pickle

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

df = pd.read_csv("data/domain_properties.csv")

df["date_sold"] = pd.to_datetime(
    df["date_sold"],
    errors="coerce",
    format= "mixed")

df["sold_year"] = df["date_sold"].dt.year
df["sold_month"] = df["date_sold"].dt.month

df = df.dropna(subset=["price", "num_bed", "num_bath", "suburb","num_parking", "property_size", "km_from_cbd",
    "cash_rate", "property_inflation_index",
    "sold_year", "sold_month"
])

features = [
    "suburb",
    "type",
    "num_bath",
    "num_bed",
    "num_parking",
    "property_size",
    "suburb_median_income",
    "km_from_cbd",
    "cash_rate"
]

X = df[features]
Y = np.log1p(df["price"])

df = df.sort_values("date_sold")
split_index = int(len(df) * 0.8)

X = df[features]
Y = np.log1p(df["price"])

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]
Y_train = Y.iloc[:split_index]
Y_test = Y.iloc[split_index:]

categorical = ["suburb", "type"]


preprocessor = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical)
], remainder="passthrough")

model = Pipeline([
    ("preprocess", preprocessor),
    ("regressor", RandomForestRegressor(
    n_estimators=300,
    max_depth=25,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1))
])

model.fit(X_train,Y_train)
Y_pred = model.predict(X_test)

# Convert back to price scale
Y_test_price = np.expm1(Y_test)
Y_pred_price = np.expm1(Y_pred)

# feature_names = model.named_steps["preprocess"].get_feature_names_out()
# importances = model.named_steps["regressor"].feature_importances_

# sorted_features = sorted(
#     zip(feature_names, importances),
#     key=lambda x: x[1],
#     reverse=True
# )

# for name, score in sorted_features[:15]:
#     print(name, score)

mape = np.mean(np.abs((Y_test_price - Y_pred_price) / Y_test_price)) * 100
print("MAPE:", mape)

print("MAE:", mean_absolute_error(Y_test_price, Y_pred_price))
print("R2:", r2_score(Y_test_price, Y_pred_price))


with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model saved as model.pkl")

      
