# FLUX - Intelligent Energy Consumption Analytics Platform

<div align="center">
  <img src="app/static/images/hero_about.png" alt="FLUX Platform" width="100%">
</div>

## 🚀 About the Project

**FLUX** is an enterprise-grade, AI-powered energy consumption prediction and analytics platform specifically tailored for Pakistan's energy sector. Built with a robust Flask backend and a modern Glassmorphism frontend, FLUX leverages Machine Learning (Random Forest) and real-time meteorological data to provide highly accurate, actionable energy forecasts. 

The platform allows individuals and organizations to track historical consumption, predict future loads (weekly, monthly, yearly), and make data-driven decisions to optimize energy usage and reduce costs.

## 🛠️ Complete Technology Stack

### Frontend Architecture
- **Markup & Styling**: HTML5, CSS3 (Custom Variables, Flexbox/Grid, Glassmorphism UI)
- **Templating Engine**: Jinja2
- **Interactivity**: Vanilla JavaScript (ES6+)
- **Data Visualization**: Chart.js (Line, Bar, Radar, Doughnut charts)
- **Design System**: Dark-navy theme with electric blue (`#00d4ff`) and electric pink (`#ff006e`) accents.

### Backend Development
- **Framework**: Python / Flask
- **Architecture**: Application Factory Pattern (`create_app()`), Modular Blueprints (`main_bp`, `auth_bp`, `api_bp`)
- **Authentication**: Flask-Session, Bcrypt password hashing, Custom decorators (`@login_required`, `@admin_required`)
- **API Integration**: 16+ RESTful API endpoints

### Database & Storage
- **Database Engine**: MySQL (XAMPP Setup: Apache + MySQL, phpMyAdmin)
- **Driver**: PyMySQL
- **Schema Design**: Relational tables (`users`, `predictions`) with `CASCADE` foreign keys.

### Machine Learning & Algorithms
- **Algorithm**: Random Forest Regressor (Scikit-Learn)
- **Data Processing**: Pandas, NumPy, StandardScaler
- **Model Pipeline**: 11-feature input vector (Historical kWh, Weather parameters, Time factors). Trains 3 distinct models (Weekly, Monthly, Yearly) utilizing 100 decision trees each.

### External Integrations
- **Weather API**: Open-Meteo REST API (Real-time live weather & 7-day forecasting)

## 📁 Detailed Directory Structure

```text
energy_analysis/
├── app/
│   ├── __init__.py            # Flask app factory (create_app)
│   ├── models.py              # MySQL database models/schema
│   ├── routes/                # Application Blueprints
│   │   ├── main_bp.py         # Core dashboard & prediction routes
│   │   ├── auth_bp.py         # Login, Registration, Session management
│   │   └── api_bp.py          # REST API endpoints
│   ├── services/
│   │   └── predictor.py       # Random Forest ML pipeline & logic
│   ├── static/
│   │   ├── css/               # Modular CSS (admin.css, prediction.css, etc.)
│   │   ├── images/            # Platform assets and default avatars
│   │   └── js/                # Client-side scripts (admin.js, auth.js, etc.)
│   └── templates/             # Jinja2 HTML templates
│       ├── index.html         # Landing page
│       ├── login.html         # Authentication
│       ├── prediction.html    # Core ML interface
│       ├── statistics.html    # Chart.js analytics dashboard
│       ├── admin.html         # Admin dashboard & RF Live Console
│       └── about.html         # Project details & contributors
├── .env                       # Environment variables & DB config
├── requirements.txt           # Python dependencies
└── run.py                     # Application entry point
```

## 🧠 Machine Learning Algorithm & Flow

The heart of FLUX is its predictive engine, designed to forecast energy consumption based on historical patterns and live environmental data.

1. **Data Ingestion**: The system takes 3 base inputs (Previous Week, Month, and Year kWh usage).
2. **Weather Enrichment**: The Open-Meteo API fetches live temperature, humidity, wind speed, and cloud cover based on the user's selected city (from a dictionary of 130+ Pakistani cities).
3. **Feature Engineering**: An 11-feature input vector is constructed (3 historical + 5 weather + 3 time-based features).
4. **Normalization**: `StandardScaler` standardizes the feature scale to prevent variance distortion.
5. **Prediction Generation**: Three specialized Random Forest models (100 trees each) compute the weekly, monthly, and yearly forecasts.
6. **Diagnostics Monitoring**: The Admin panel features an "RF Live" console displaying real-time metrics like Latency, Consensus, and Mean Squared Error (MSE).

## 👥 Project Contributors

The development, research, and deployment of FLUX were successfully executed by the following team:

| Member | Role | Responsibilities |
| :--- | :--- | :--- |
| **Sana Shabir**<br>`F22NDOCS1M01029` | ML / Random Forest | Core ML Pipeline, Data Scaling, Model Training |
| **Laiba Anwar**<br>`F22NDOCS1M01027` | Weather API | API Integration, Data Extraction, Fallback Mechanisms |
| **Muhammad Faizan**<br>`F22NDOCS1M01010` | Frontend + Backend + DB | Architecture, UI/UX, Flask Backend, Database Schema |

---

### Muhammad Faizan
`F22NDOCS1M01010` | **Frontend + Flask Backend + MySQL + Integration**

**What He Did:**
- Flask app factory: `create_app()`, 3 Blueprints (`main_bp`, `auth_bp`, `api_bp`), `db.create_all()`
- Authentication: bcrypt hashing, Flask sessions, `@login_required`, `@admin_required` decorators
- 16+ REST API endpoints (predict, weather, profile, admin user/prediction management)
- MySQL schema: users (12 cols) + predictions (10 cols) with `CASCADE` foreign key
- XAMPP setup: Apache + MySQL, phpMyAdmin, `.env` config, PyMySQL driver
- Frontend: 7 HTML pages (Jinja2), 7 CSS files, 8 JS files, dark/light theme toggle
- Chart.js: line, bar, doughnut charts on Statistics and Admin pages
- Admin dashboard: KPI cards, user/prediction tables, role promote/demote/delete
- Profile picture upload, first-user-is-admin rule, mobile sidebar toggle
- Integrated Sana's RF model + Laiba's weather API into the full web platform

### Sana Shabir
`F22NDOCS1M01029` | **ML / Random Forest Model & Training**

**What She Did:**
- Built the full Random Forest pipeline in `app/services/predictor.py`
- Designed 11-feature input vector (3 kWh values + 5 weather + 3 time features)
- Generated 300 synthetic training samples with seasonal, weather, and noise factors
- Applied `StandardScaler` to normalize all features before training
- Trained 3 RF models (weekly, monthly, yearly) with 100 trees each
- Computed growth %, 7-day daily forecast, and feature importance breakdown
- Built fallback defaults when weather API is unavailable

### Laiba Anwar
`F22NDOCS1M01027` | **Open-Meteo Weather API Integration**

**What She Did:**
- Identified and integrated Open-Meteo API (free, no API key, REST/JSON)
- Built `CITY_COORDS` dictionary with GPS coordinates for 130+ Pakistani cities
- Implemented `fetch_weather(city)` to pull live temperature, humidity, wind, precipitation, cloud cover
- Extracted 7-day forecast data (avg temp max/min, rain, wind) for the forecast chart
- Designed fallback defaults (temp=25, humidity=50, wind=10) when API fails
- Created `/api/weather?city=X` endpoint for live weather card on Prediction page
- Provided the idea of feeding live weather as ML features (contributes 15–30% predictive power)

---

<div align="center">
  <p><strong>Version:</strong> 2.0.0 | <strong>Status:</strong> Production Ready</p>
  <p><em>The Islamia University of Bahawalpur — Bahawalnagar Campus</em></p>
  <p><em>Developed for Academic Final Year Project (FYP) Evaluation</em></p>
</div>
