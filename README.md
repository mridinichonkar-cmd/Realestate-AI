# 🏡 Real Estate AI – Property Comparison & Price Prediction Tool

A full-stack project combining a **Chrome Extension**, **Flask backend**, and **Machine Learning model** to help users organise property listings and evaluate whether they are **overpriced or undervalued**.

---

## 🚀 Features

- 📌 Extract property details directly from realestate websites via Chrome extension  
- 📊 View and manage saved listings in an interactive table  
- ✏️ Edit missing or incorrect property data (beds, baths, price, etc.)  
- 🧠 Predict property value using a trained ML model  
- ⚖️ Automatically classify listings as:
  - Undervalued  
  - Overpriced  
  - Fairly priced  
- 💾 Persistent storage using Chrome local storage  

---

## 🧠 Machine Learning Model

- Model type: Regression (e.g. Random Forest)
- Predicts property price based on features such as:
  - Bedrooms
  - Bathrooms
  - Parking
  - Property size
  - Location features
- Performance:
  - **MAPE:** ~16%
- Includes classification logic to determine valuation (under/overpriced)

---
## 🧱 Project Structure

<img width="450" height="736" alt="image" src="https://github.com/user-attachments/assets/e3a755cb-290c-466f-9cbc-c667f5c540eb" />


## ⚙️ Setup Instructions

### 1. Clone the repository

bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git

cd YOUR_REPO

git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git

cd YOUR_REPO

### 2. Run the project


- cd realestate-AI

- cd backend

- pip install -r requirements.txt

- python app.py

Backend will run at: http://127.0.0.1:5000

3. Load the Chrome Extension
  Open Chrome
Go to: chrome://extensions/
Enable Developer Mode
- Click Load unpacked
- Select the extension/ folder

🧪 How to Use
1. Open a property listing on real estate.com website
2. Click the extension
3. Click Extract Current Listing
4. Save the property
5. Open Saved Listings
6. Edit missing fields if needed
7. Click Predict


### 🛠️ Tech Stack

Frontend: JavaScript, HTML, CSS (Chrome Extension)
Backend: Flask (Python)
Machine Learning: scikit-learn
Storage: Chrome local storage

### 📄 License

This project is for educational use.


### Screenshots
<img width="628" height="499" alt="image" src="https://github.com/user-attachments/assets/7a5343fe-5225-4c82-8bda-6303a59cf6c9" />
<img width="1933" height="498" alt="image" src="https://github.com/user-attachments/assets/9a91dda5-5215-46d5-abc6-c2eb91bb0c88" />


