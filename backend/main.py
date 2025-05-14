from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import os
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, List
import numpy as np
import pandas as pd
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from model_randomForest.check_randomforest import predict_careers_from_skills

app = FastAPI(title="Forecast API")

# Firebase setup
try:
    cred = credentials.Certificate("skillsync-583a0-firebase-adminsdk-s26y2-cd86d35d9a.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Warning: Firebase initialization failed: {e}")
    db = None

# Load 2024 values once
df_2024 = pd.read_csv("skill_relevance_extended_2000_2024.csv")
skill_2024_map = dict(zip(df_2024['Skill'].str.lower(), df_2024['2024']))

# Request & Response Models
class ForecastRequest(BaseModel):
    skill: str
    forecast_years: int
    mode: str  # 'arima' or 'nbeats'

class ForecastResponse(BaseModel):
    skill: str
    year: int
    value: float
    lower_ci: float
    upper_ci: float

class CareerPredictRequest(BaseModel):
    allUserSkills: List[str]

# Helpers
def load_arima_model(skill: str):
    path = os.path.join("models", f"{skill}_arima.pkl")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"ARIMA model for '{skill}' not found")
    return joblib.load(path)

def get_cached_forecast(skill: str) -> Dict:
    if db is None:
        return None
    doc_ref = db.collection('forecasts').document(skill)
    doc = doc_ref.get()
    return doc.to_dict() if doc.exists else None

def cache_forecast(skill: str, forecast_data: List[ForecastResponse]):
    if db is None:
        return
    cache = {str(item.year): item.value for item in forecast_data}
    db.collection('forecasts').document(skill).set(cache)

def format_nbeats_forecast(skill: str, forecast_df, years_requested: int) -> List[ForecastResponse]:
    skill_data = forecast_df[forecast_df["unique_id"].str.lower() == skill.lower()].sort_values("ds")
    output = []
    for i in range(min(years_requested, len(skill_data))):
        row = skill_data.iloc[i]
        year = pd.to_datetime(row["ds"]).year
        val = float(row["NBEATS"])
        output.append(ForecastResponse(
            skill=skill,
            year=year,
            value=round(val, 6),
            lower_ci=round(val * 0.95, 6),
            upper_ci=round(val * 1.05, 6)
        ))
    return output

# Main API
@app.post("/forecast/", response_model=List[ForecastResponse])
async def forecast(request: ForecastRequest):
    skill = request.skill.lower()
    mode = request.mode.lower()
    current_year = 2024

    if skill not in skill_2024_map:
        raise HTTPException(status_code=404, detail=f"Skill '{skill}' not found")

    # Always include 2024 as base
    response = [
        ForecastResponse(
            skill=skill,
            year=2024,
            value=skill_2024_map[skill],
            lower_ci=round(skill_2024_map[skill] * 0.95, 6),
            upper_ci=round(skill_2024_map[skill] * 1.05, 6)
        )
    ]

    forecast_horizon = request.forecast_years
    if forecast_horizon <= 0:
        return response

    # --- ARIMA ---
    if mode == "arima":
        try:
            if request.forecast_years == 3:
                cached = get_cached_forecast(skill)
                if cached:
                    try:
                        arima_resp = [
                            ForecastResponse(
                                skill=skill,
                                year=2024 + i,
                                value=cached[str(2024 + i)],
                                lower_ci=cached[str(2024 + i)] * 0.95,
                                upper_ci=cached[str(2024 + i)] * 1.05
                            )
                            for i in range(1, 4)
                            if str(2024 + i) in cached
                        ]
                        if len(arima_resp) == 3:
                            return [response[0]] + arima_resp
                    except Exception as e:
                        print("Cache error:", e)

            model = load_arima_model(skill)
            forecast_result = model.forecast(steps=forecast_horizon)
            std_error = np.std(forecast_result) * 1.96

            for i in range(forecast_horizon):
                val = float(forecast_result.iloc[i])
                response.append(ForecastResponse(
                    skill=skill,
                    year=2025 + i,
                    value=val,
                    lower_ci=val - std_error,
                    upper_ci=val + std_error
                ))

            if request.forecast_years == 3:
                cache_forecast(skill, response[1:])

            return response
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ARIMA error: {e}")

    # --- NBEATS ---
    elif mode == "nbeats":
        try:
            model_path = f"models_nbeats/nbeats_h{forecast_horizon}.pkl"
            print(f"[NBEATS] Loading model: {model_path} for skill '{skill}'")
            if not os.path.exists(model_path):
                raise HTTPException(status_code=500, detail="N-BEATS model not found")
            nf_model = joblib.load(model_path)
            forecast_df = nf_model.predict()
            nbeats_resp = format_nbeats_forecast(skill, forecast_df, forecast_horizon)
            return response + nbeats_resp
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"NBEATS error: {e}")

    # --- Invalid Mode ---
    else:
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'arima' or 'nbeats'.")

@app.post("/predict-careers/")
async def predict_careers(request: CareerPredictRequest):
    result = predict_careers_from_skills(request.allUserSkills)
    return result

# Frontend route
build_path = os.path.join(os.path.dirname(__file__), "build")
app.mount("/static", StaticFiles(directory=os.path.join(build_path, "static")), name="static")

# Ensure skills.txt is accessible
@app.get("/skills.txt")
async def get_skills():
    return FileResponse(os.path.join(build_path, "static", "skills.txt"))

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    return FileResponse(os.path.join(build_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
