"""
# FLUX Service: Random Forest Energy Prediction Logic
Uses historical kWh data (week, month, year) + live Open-Meteo weather
to predict future energy consumption using sklearn RandomForestRegressor.
"""
import numpy as np
import requests
from datetime import datetime


# Pakistani city GPS coordinates
CITY_COORDS = {
    "abbottabad":     {"lat": 34.1500, "lon": 73.2167},
    "abdulhakim":     {"lat": 30.7725, "lon": 72.1228},
    "aliabad":        {"lat": 36.3153, "lon": 74.6150},
    "alpurai":        {"lat": 34.9213, "lon": 72.7712},
    "athmuqam":       {"lat": 34.7806, "lon": 73.9167},
    "attockcity":     {"lat": 33.7700, "lon": 72.3600},
    "awaran":         {"lat": 26.4561, "lon": 65.2361},
    "badin":          {"lat": 24.6557, "lon": 68.8372},
    "bagh":           {"lat": 33.9833, "lon": 73.7833},
    "bahawalnagar":   {"lat": 29.9900, "lon": 73.2500},
    "bahawalpur":     {"lat": 29.3956, "lon": 71.6722},
    "bannu":          {"lat": 33.0000, "lon": 70.3833},
    "barkhan":        {"lat": 29.9000, "lon": 69.5200},
    "batgram":        {"lat": 34.6800, "lon": 73.0200},
    "bhakkar":        {"lat": 31.6300, "lon": 71.0600},
    "chakwal":        {"lat": 32.9300, "lon": 72.8500},
    "chaman":         {"lat": 30.9200, "lon": 66.4500},
    "charsadda":      {"lat": 34.1500, "lon": 71.7400},
    "chilas":         {"lat": 35.4167, "lon": 74.1000},
    "chiniot":        {"lat": 31.7200, "lon": 72.9800},
    "chitral":        {"lat": 35.8517, "lon": 71.7864},
    "dadu":           {"lat": 26.7319, "lon": 67.7750},
    "daggar":         {"lat": 34.5000, "lon": 72.4833},
    "dainyor":        {"lat": 35.9179, "lon": 74.3917},
    "dalbandin":      {"lat": 28.8872, "lon": 64.4072},
    "dasu":           {"lat": 35.2921, "lon": 73.2920},
    "deraallahyar":   {"lat": 28.3742, "lon": 68.2711},
    "derabugti":      {"lat": 29.0307, "lon": 69.1510},
    "deraghazikhan":  {"lat": 30.0500, "lon": 70.6333},
    "deraismail":     {"lat": 31.8327, "lon": 70.9024},
    "deramurad":      {"lat": 28.5300, "lon": 68.2200},
    "eidgah":         {"lat": 35.9181, "lon": 74.3094},
    "faisalabad":     {"lat": 31.4180, "lon": 73.0790},
    "gakuch":         {"lat": 36.2167, "lon": 73.8000},
    "gandava":        {"lat": 28.0267, "lon": 67.4811},
    "ghotki":         {"lat": 28.0000, "lon": 69.3200},
    "gilgit":         {"lat": 35.9208, "lon": 74.3144},
    "gojra":          {"lat": 31.1500, "lon": 72.6833},
    "gujranwala":     {"lat": 32.1500, "lon": 74.1833},
    "gujrat":         {"lat": 32.5736, "lon": 74.0789},
    "gwadar":         {"lat": 25.1264, "lon": 62.3225},
    "hafizabad":      {"lat": 32.0717, "lon": 73.6857},
    "hangu":          {"lat": 33.5339, "lon": 71.0557},
    "haripur":        {"lat": 34.0000, "lon": 72.9300},
    "harunabad":      {"lat": 29.6100, "lon": 73.1400},
    "hasilpur":       {"lat": 29.6900, "lon": 72.5500},
    "hassanabdal":    {"lat": 33.8195, "lon": 72.6890},
    "hujrashahmuqim": {"lat": 30.7400, "lon": 73.8200},
    "hyderabad":      {"lat": 25.3969, "lon": 68.3772},
    "islamabad":      {"lat": 33.6989, "lon": 73.0369},
    "jacobabad":      {"lat": 28.2769, "lon": 68.4514},
    "jalalpurjattan": {"lat": 32.6400, "lon": 74.2100},
    "jamshoro":       {"lat": 25.4208, "lon": 68.2737},
    "jaranwala":      {"lat": 31.3454, "lon": 73.4298},
    "jhangcity":      {"lat": 31.2681, "lon": 72.3181},
    "jhelum":         {"lat": 32.9333, "lon": 73.7333},
    "kabirwala":      {"lat": 30.4000, "lon": 71.8600},
    "kalat":          {"lat": 29.0266, "lon": 66.5936},
    "kamalia":        {"lat": 30.7271, "lon": 72.6461},
    "kandhkot":       {"lat": 28.2500, "lon": 69.1800},
    "karachi":        {"lat": 24.8600, "lon": 67.0100},
    "karak":          {"lat": 33.1153, "lon": 71.0955},
    "kasur":          {"lat": 31.1167, "lon": 74.4500},
    "khairpurmirs":   {"lat": 27.5300, "lon": 68.7600},
    "khanewal":       {"lat": 30.2864, "lon": 71.9320},
    "khanpur":        {"lat": 28.6474, "lon": 70.6569},
    "kharan":         {"lat": 28.5846, "lon": 65.4150},
    "kharian":        {"lat": 32.8200, "lon": 73.8900},
    "khushab":        {"lat": 32.3000, "lon": 72.3500},
    "khuzdar":        {"lat": 27.8100, "lon": 66.6100},
    "kohat":          {"lat": 33.5869, "lon": 71.4414},
    "kohlu":          {"lat": 29.8965, "lon": 69.2532},
    "kotaddu":        {"lat": 30.4700, "lon": 70.9700},
    "kotli":          {"lat": 33.5200, "lon": 73.9000},
    "kulachi":        {"lat": 31.9167, "lon": 70.3667},
    "kundian":        {"lat": 32.4842, "lon": 71.4589},
    "lahore":         {"lat": 31.5497, "lon": 74.3436},
    "lakki":          {"lat": 32.6074, "lon": 70.9168},
    "lalamusa":       {"lat": 32.7000, "lon": 73.9600},
    "larkana":        {"lat": 27.5600, "lon": 68.2264},
    "leiah":          {"lat": 30.9600, "lon": 70.9400},
    "lodhran":        {"lat": 29.5300, "lon": 71.6300},
    "loralai":        {"lat": 30.3700, "lon": 68.6000},
    "malakand":       {"lat": 34.5700, "lon": 71.9200},
    "mandibahauddin": {"lat": 32.5861, "lon": 73.4917},
    "mandiburewala":  {"lat": 30.1500, "lon": 72.6833},
    "mansehra":       {"lat": 34.3302, "lon": 73.1968},
    "mardan":         {"lat": 34.1958, "lon": 72.0447},
    "mastung":        {"lat": 29.7994, "lon": 66.8451},
    "matiari":        {"lat": 25.5971, "lon": 68.4467},
    "mianchannun":    {"lat": 30.4357, "lon": 72.3551},
    "mianwali":       {"lat": 32.5853, "lon": 71.5436},
    "mingaora":       {"lat": 34.7717, "lon": 72.3600},
    "mirpurkhas":     {"lat": 25.5269, "lon": 69.0111},
    "multan":         {"lat": 30.1978, "lon": 71.4711},
    "muridke":        {"lat": 31.8026, "lon": 74.2577},
    "musakhelb":      {"lat": 30.8522, "lon": 69.8206},
    "muzaffarabad":   {"lat": 34.3700, "lon": 73.4711},
    "muzaffargarh":   {"lat": 30.0703, "lon": 71.1933},
    "nankanasahib":   {"lat": 31.4392, "lon": 73.7126},
    "narowal":        {"lat": 32.1020, "lon": 74.8730},
    "naushahrofiroz": {"lat": 26.8392, "lon": 68.1408},
    "nawabshah":      {"lat": 26.2442, "lon": 68.4100},
    "newmirpur":      {"lat": 33.1484, "lon": 73.7518},
    "nowshera":       {"lat": 34.0159, "lon": 71.9754},
    "okara":          {"lat": 30.8100, "lon": 73.4597},
    "pakpattan":      {"lat": 30.3547, "lon": 73.3888},
    "panjgur":        {"lat": 26.9667, "lon": 64.1000},
    "parachinar":     {"lat": 33.9000, "lon": 70.1000},
    "pattoki":        {"lat": 31.0250, "lon": 73.8479},
    "peshawar":       {"lat": 34.0000, "lon": 71.5000},
    "pishin":         {"lat": 30.5803, "lon": 66.9961},
    "qilasaifullah":  {"lat": 30.7000, "lon": 68.3500},
    "quetta":         {"lat": 30.1920, "lon": 67.0070},
    "rahimyarkhan":   {"lat": 28.4202, "lon": 70.2952},
    "rajanpur":       {"lat": 29.1035, "lon": 70.3250},
    "rawalakot":      {"lat": 33.8569, "lon": 73.7601},
    "rawalpindi":     {"lat": 33.6007, "lon": 73.0679},
    "risalpurcant":   {"lat": 34.0792, "lon": 71.9967},
    "saddiqabad":     {"lat": 28.3062, "lon": 70.1307},
    "saidusharif":    {"lat": 34.7479, "lon": 72.3551},
    "sahiwal":        {"lat": 30.6706, "lon": 73.1064},
    "sanghar":        {"lat": 26.0450, "lon": 68.9481},
    "sargodha":       {"lat": 32.0836, "lon": 72.6711},
    "shahhadkot":     {"lat": 27.8422, "lon": 67.9250},
    "shakargarh":     {"lat": 32.2618, "lon": 75.1583},
    "shekhupura":     {"lat": 31.7083, "lon": 74.0000},
    "shikarpur":      {"lat": 27.9556, "lon": 68.6377},
    "sibi":           {"lat": 29.5433, "lon": 67.8731},
    "sialkot":        {"lat": 32.4914, "lon": 74.5347},
    "sialkotcity":    {"lat": 32.5000, "lon": 74.5333},
    "sukkur":         {"lat": 27.6995, "lon": 68.8673},
    "swabi":          {"lat": 34.1202, "lon": 72.4702},
    "tandoallahyar":  {"lat": 25.4605, "lon": 68.7175},
    "tandum":         {"lat": 25.1206, "lon": 68.5639},
    "tank":           {"lat": 32.2217, "lon": 70.3793},
    "thatta":         {"lat": 24.7497, "lon": 67.9116},
    "timargara":      {"lat": 34.8252, "lon": 71.8442},
    "tobatek":        {"lat": 30.9961, "lon": 72.4828},
    "turbat":         {"lat": 26.0012, "lon": 63.0485},
    "umarkot":        {"lat": 25.3522, "lon": 69.7408},
    "upperdir":       {"lat": 35.2074, "lon": 71.8768},
    "uthal":          {"lat": 25.8364, "lon": 66.6200},
    "vihari":         {"lat": 30.0452, "lon": 72.3489},
    "zhob":           {"lat": 31.3400, "lon": 69.4500},
    "ziarat":         {"lat": 30.3800, "lon": 67.7200},
}


def fetch_weather(city_key: str) -> dict:
    """Fetch current + 7-day forecast weather from Open-Meteo."""
    coords = CITY_COORDS.get(city_key.lower().replace(" ", ""), {"lat": 30.0, "lon": 70.0})
    lat, lon = coords["lat"], coords["lon"]

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,cloud_cover"
        f"&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"
        f"&timezone=auto&forecast_days=7"
    )

    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        d = r.json()

        current = d.get("current", {})
        daily   = d.get("daily", {})

        temp_max_list  = daily.get("temperature_2m_max", [])
        temp_min_list  = daily.get("temperature_2m_min", [])
        rain_list      = daily.get("precipitation_sum", [])
        wind_list      = daily.get("wind_speed_10m_max", [])

        avg_temp_max   = float(np.mean(temp_max_list)) if temp_max_list else 25.0
        avg_temp_min   = float(np.mean(temp_min_list)) if temp_min_list else 15.0
        avg_rain       = float(np.mean(rain_list)) if rain_list else 0.0
        avg_wind_max   = float(np.mean(wind_list)) if wind_list else 12.0

        return {
            "temperature":     current.get("temperature_2m", 25.0),
            "humidity":        current.get("relative_humidity_2m", 50.0),
            "wind_speed":      current.get("wind_speed_10m", 10.0),
            "precipitation":   current.get("precipitation", 0.0),
            "cloud_cover":     current.get("cloud_cover", 30.0),
            "avg_temp_max":    avg_temp_max,
            "avg_temp_min":    avg_temp_min,
            "avg_rain_7d":     avg_rain,
            "avg_wind_max_7d": avg_wind_max,
            "lat":             lat,
            "lon":             lon,
            "source":          "Open-Meteo (live)",
        }
    except Exception as e:
        print(f"[Weather] fetch failed: {e}")
        return {
            "temperature": 25.0, "humidity": 50.0, "wind_speed": 10.0,
            "precipitation": 0.0, "cloud_cover": 30.0,
            "avg_temp_max": 28.0, "avg_temp_min": 18.0,
            "avg_rain_7d": 0.0, "avg_wind_max_7d": 12.0,
            "lat": lat, "lon": lon, "source": "fallback defaults",
        }


def _build_training_data(week_kwh: float, month_kwh: float, year_kwh: float,
                          weather: dict) -> tuple:
    """
    Synthesise a small training set from the 3 historical values
    and weather context, then train a RandomForest.

    Features (per sample): [week_kwh, month_kwh, year_kwh,
                             temp, humidity, wind, rain, cloud,
                             day_of_year, hour_of_day, is_weekend]
    Target: future kWh for that horizon.
    """
    np.random.seed(42)
    n = 300   # synthetic training samples

    # Base seasonal / diurnal patterns
    days       = np.arange(n)
    seasonal   = np.sin(2 * np.pi * days / 365) * 0.15 + 1.0   # ±15% seasonal
    daily_rand = np.random.normal(1.0, 0.08, n)                  # ±8% daily noise

    # Temperature effect: +1°C above 22°C → +0.7% load (cooling), below 15°C → +0.5% (heating)
    temps = np.random.normal(weather["temperature"], 4, n)
    temp_effect = np.where(temps > 22, (temps - 22) * 0.007,
                  np.where(temps < 15, (15 - temps) * 0.005, 0.0))

    humidity_effect = (np.random.normal(weather["humidity"], 10, n) / 100) * 0.05
    wind_effect     = -(np.random.normal(weather["wind_speed"], 3, n) / 50) * 0.03
    rain_effect     = -(weather["avg_rain_7d"] > 1) * 0.02   # rain → slight load drop
    cloud_effect    = (weather["cloud_cover"] / 100) * 0.01

    is_weekend = (days % 7 >= 5).astype(float)
    weekend_eff = is_weekend * (-0.10)   # -10% on weekends

    total_factor = (seasonal * daily_rand
                    + temp_effect + humidity_effect + wind_effect
                    + rain_effect + cloud_effect + weekend_eff)
    total_factor = np.clip(total_factor, 0.5, 2.0)

    # Build feature matrix
    X = np.column_stack([
        np.full(n, week_kwh)  * (0.95 + np.random.rand(n) * 0.10),
        np.full(n, month_kwh) * (0.95 + np.random.rand(n) * 0.10),
        np.full(n, year_kwh)  * (0.95 + np.random.rand(n) * 0.10),
        temps,
        np.random.normal(weather["humidity"], 10, n),
        np.random.normal(weather["wind_speed"], 3, n),
        np.random.normal(weather["avg_rain_7d"], 1, n).clip(0),
        np.full(n, weather["cloud_cover"]) + np.random.normal(0, 5, n),
        days % 365,                                       # day_of_year
        np.random.randint(0, 24, n).astype(float),       # hour_of_day
        is_weekend,
    ])

    # Targets: week / month / year predictions with the factor applied
    y_week  = (week_kwh  / 52)  * total_factor * 52   # annualise → de-annualise
    y_month = (month_kwh / 12)  * total_factor * 12
    y_year  =  year_kwh         * total_factor

    # Re-normalise so mean ≈ historical input
    y_week  = y_week  * (week_kwh  / (y_week.mean()  + 1e-9))
    y_month = y_month * (month_kwh / (y_month.mean() + 1e-9))
    y_year  = y_year  * (year_kwh  / (y_year.mean()  + 1e-9))

    return X, y_week, y_month, y_year


FEATURE_NAMES = [
    "Historical Weekly kWh", "Historical Monthly kWh", "Historical Yearly kWh",
    "Temperature (°C)", "Humidity (%)", "Wind Speed (km/h)",
    "Precipitation (mm)", "Cloud Cover (%)",
    "Day of Year", "Hour of Day", "Is Weekend",
]


def run_prediction(week_kwh: float, month_kwh: float, year_kwh: float,
                   city: str, category: str = "general") -> dict:
    """
    Full Random Forest prediction pipeline.
    Returns predictions + model explanation.
    """
    # 1. Fetch live weather
    # Lazy imports to save memory at startup
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    
    weather = fetch_weather(city)

    # 2. Build training data & train 3 RF models (week / month / year)
    X, y_week, y_month, y_year = _build_training_data(week_kwh, month_kwh, year_kwh, weather)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    rf_params = dict(n_estimators=100, max_depth=8, min_samples_split=5,
                     random_state=42, n_jobs=-1)

    rf_w = RandomForestRegressor(**rf_params).fit(X_scaled, y_week)
    rf_m = RandomForestRegressor(**rf_params).fit(X_scaled, y_month)
    rf_y = RandomForestRegressor(**rf_params).fit(X_scaled, y_year)

    # 3. Prepare prediction input (current conditions)
    now = datetime.now()
    x_pred = scaler.transform([[
        week_kwh, month_kwh, year_kwh,
        weather["temperature"], weather["humidity"], weather["wind_speed"],
        weather["precipitation"], weather["cloud_cover"],
        now.timetuple().tm_yday,   # day_of_year
        now.hour,
        1.0 if now.weekday() >= 5 else 0.0,
    ]])

    pred_week  = max(0, float(rf_w.predict(x_pred)[0]))
    pred_month = max(0, float(rf_m.predict(x_pred)[0]))
    pred_year  = max(0, float(rf_y.predict(x_pred)[0]))

    # 4. Feature importances (average across 3 models)
    importances = (rf_w.feature_importances_ +
                   rf_m.feature_importances_ +
                   rf_y.feature_importances_) / 3

    feature_importance = [
        {"feature": FEATURE_NAMES[i], "importance": round(float(importances[i]), 4)}
        for i in np.argsort(importances)[::-1]
    ]

    # 5. 7-day daily forecast (for the live chart)
    daily_forecasts = []
    temp_max = weather.get("avg_temp_max", weather["temperature"] + 3)
    temp_min = weather.get("avg_temp_min", weather["temperature"] - 5)
    for d in range(7):
        day_temp = temp_min + (temp_max - temp_min) * (0.3 + 0.7 * np.random.rand())
        x_day = scaler.transform([[
            week_kwh, month_kwh, year_kwh,
            day_temp, weather["humidity"],
            weather["avg_wind_max_7d"], weather["avg_rain_7d"],
            weather["cloud_cover"], now.timetuple().tm_yday + d,
            12.0, 1.0 if (now.weekday() + d) % 7 >= 5 else 0.0,
        ]])
        daily_kwh = max(0, float(rf_w.predict(x_day)[0]) / 7)
        from datetime import timedelta
        day_label = (now + timedelta(days=d)).strftime("%d %b")
        daily_forecasts.append({"day": day_label, "kwh": round(daily_kwh, 2), "temp": round(day_temp, 1)})

    # 6. Growth percentages
    def growth(pred, hist):
        return round((pred - hist) / (hist + 1e-9) * 100, 2) if hist else 0

    # 7. Build model explanation
    top_features = feature_importance[:3]
    weather_impact = round(float(importances[3] + importances[4] + importances[5] + importances[6]) * 100, 1)

    explanation = {
        "algorithm": "Random Forest Regressor",
        "n_estimators": 100,
        "training_samples": 300,
        "features_used": len(FEATURE_NAMES),
        "top_features": top_features,
        "weather_impact_pct": weather_impact,
        "model_summary": (
            f"Trained {100} decision trees on {300} synthesised samples derived "
            f"from your {week_kwh:.0f} kWh/week, {month_kwh:.0f} kWh/month, "
            f"{year_kwh:.0f} kWh/year history. Weather data from {weather['source']} "
            f"contributed {weather_impact}% of predictive power."
        ),
    }

    return {
        "success": True,
        "predictions": {
            "next_week":  round(pred_week, 2),
            "next_month": round(pred_month, 2),
            "next_year":  round(pred_year, 2),
            "growth_week":  growth(pred_week, week_kwh),
            "growth_month": growth(pred_month, month_kwh),
            "growth_year":  growth(pred_year, year_kwh),
        },
        "weather": weather,
        "daily_forecasts": daily_forecasts,
        "feature_importance": feature_importance,
        "explanation": explanation,
    }
