import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from pmdarima import auto_arima
import warnings
import os

warnings.filterwarnings("ignore")

CSV_PATH = "skill_relevance.csv"
YEAR_COLUMNS = [str(y) for y in range(2004, 2024)]

# Load and clean data
df = pd.read_csv(CSV_PATH)
df['Skill'] = df['Skill'].str.strip().str.title()
df.set_index("Skill", inplace=True)

# Create directory to store models
os.makedirs("models", exist_ok=True)

# List of skills to process
skills_to_run = ["Tcpip", "Abtesting"]

for skill in skills_to_run:
    if skill not in df.index:
        print(f"❌ Skill not found in data: {skill}")
        continue
    try:
        ts = df.loc[skill, YEAR_COLUMNS].astype(float)
        ts.index = pd.to_datetime(ts.index, format='%Y')
        ts = ts.sort_index()

        auto_model = auto_arima(ts, seasonal=False, stepwise=True)
        model = ARIMA(ts, order=auto_model.order)
        model_fit = model.fit()

        model_path = f"models/{skill.replace(' ', '_').lower()}_arima.pkl"
        model_fit.save(model_path)
        print(f"✔️ Model saved for: {skill}")

    except Exception as e:
        print(f"❌ Failed to build model for {skill}: {e}")
