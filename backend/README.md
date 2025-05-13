# ARIMA Forecast API

A FastAPI backend service that serves forecasts from pre-trained ARIMA models with Firebase Firestore caching.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up Firebase:
   - Create a Firebase project
   - Download your Firebase credentials JSON file
   - Save it as `firebase-credentials.json` in the project root

3. Place your ARIMA models:
   - Save your trained ARIMA models in the `models/` directory
   - Name them as `{skill}_arima.pkl` (e.g., `python_arima.pkl`)

## Running the API

Start the server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Usage

### Forecast Endpoint

**POST** `/forecast/`

Request body:
```json
{
    "skill": "python",
    "forecast_years": 3
}
```

Response:
```json
[
    {
        "year": 2024,
        "value": 85.5,
        "lower_ci": 80.2,
        "upper_ci": 90.8
    },
    {
        "year": 2025,
        "value": 87.2,
        "lower_ci": 81.9,
        "upper_ci": 92.5
    },
    {
        "year": 2026,
        "value": 89.0,
        "lower_ci": 83.7,
        "upper_ci": 94.3
    }
]
```

## Features

- Loads ARIMA models from disk
- Generates forecasts with confidence intervals
- Caches results in Firebase Firestore
- Automatic API documentation at `/docs` 