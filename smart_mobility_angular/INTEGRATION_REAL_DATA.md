# 🔧 Integration Guide - Connecting Real Data

## 📋 Vue d'ensemble

Cette guide explique comment connecter **vos vraies données** au lieu des données simulées dans le backend AI.

---

## 🏗️ Architecture Actuelle

```
Smart Mobility AI Backend (smart_mobility_ai_backend.py)
├── Mock Data (Random values)                    ← À REMPLACER
│   ├── Transport delays
│   ├── Stress levels
│   ├── CO2 emissions
│   └── User stats
└── HTTP Endpoints (JSON)                        ← KEEPER
    ├── /api/transport/status
    ├── /api/stress/current-level
    ├── /api/environment/co2-stats
    └── ... 12+ endpoints
```

---

## 🔄 Processus d'Intégration

### Étape 1: Identifier vos sources de données

**Exemple pour Smart Mobility:**

```
Transport delays     ← XGBoost model + Real-time API
Stress levels        ← ML model output
CO2 emissions        ← Sensor data + User transport mode
Weather              ← Weather API (OpenWeatherMap)
Infrastructure       ← IoT sensors + Database
User stats           ← PostgreSQL database
Alerts               ← Rule engine + Monitoring system
Rankings             ← Redis cache or Database
```

### Étape 2: Ajouter les connexions

Exemple pour **Transport Delays** (XGBoost):

#### AVANT (Mock):
```python
@app.get('/api/transport/status')
def transport_status():
    return {
        'avgDelay': random.randint(5, 25),  # ← MOCK
        'affectedLines': random.sample([...], 2)
    }
```

#### APRÈS (Real):
```python
from your_models import load_xgboost_model
from your_db import get_live_transport_data

@app.get('/api/transport/status')
def transport_status():
    # Charger données réelles
    current_data = get_live_transport_data()
    
    # Prédictions du modèle
    model = load_xgboost_model()
    predictions = model.predict(current_data)
    
    return {
        'avgDelay': predictions.delay,
        'affectedLines': predictions.affected_lines,
        'confidence': predictions.confidence
    }
```

---

## 📊 Intégration par Service

### 1. Transport Delays (XGBoost)

```python
# ═════════════════════════════════════════════════
# BEFORE: Mock data
# ═════════════════════════════════════════════════
def transport_status():
    return {
        'avgDelay': random.randint(5, 25)
    }

# ═════════════════════════════════════════════════
# AFTER: Real XGBoost predictions
# ═════════════════════════════════════════════════
import joblib
import numpy as np
from datetime import datetime

# Load model once at startup
xgboost_model = joblib.load('models/delay_predictor.pkl')

def transport_status():
    # Get current time features
    now = datetime.now()
    features = np.array([[
        now.hour,
        now.day,
        now.weekday(),
        get_temperature(),
        get_current_congestion()
    ]])
    
    # Predict delay
    predicted_delay = xgboost_model.predict(features)[0]
    
    # Query database for affected lines
    affected = db.query("""
        SELECT line, delay FROM transport_real_time 
        WHERE delay > ? 
        LIMIT 5
    """, predicted_delay * 0.8)
    
    return {
        'avgDelay': int(predicted_delay),
        'affectedLines': [r['line'] for r in affected],
        'confidence': 0.92,
        'source': 'XGBoost Model + Real-time API'
    }
```

### 2. Stress Level (ML Model)

```python
# ═════════════════════════════════════════════════
# INTEGRATION: Real Stress Predictions
# ═════════════════════════════════════════════════
from sklearn.preprocessing import StandardScaler
import pandas as pd

stress_model = joblib.load('models/stress_predictor.pkl')
scaler = joblib.load('models/stress_scaler.pkl')

def stress_level():
    # Collect features from real-time data
    features = pd.DataFrame({
        'congestion': [get_congestion_index()],
        'crowd_density': [get_crowd_density()],
        'temperature': [get_temperature()],
        'hour': [datetime.now().hour],
        'weather': [get_weather_code()]
    })
    
    # Scale and predict
    scaled = scaler.transform(features)
    stress = stress_model.predict(scaled)[0]
    
    # Get trend from recent history
    recent = db.query("""
        SELECT stress FROM stress_history 
        WHERE timestamp > datetime('now', '-1 hour')
        ORDER BY timestamp
    """)
    
    trend = 'improving' if recent[-1] < recent[0] else 'worsening'
    
    return {
        'level': int(stress * 100),
        'trend': trend,
        'factors': get_stress_factors(),
        'source': 'ML Model + Real-time Sensors'
    }
```

### 3. CO2 Emissions (Database)

```python
# ═════════════════════════════════════════════════
# INTEGRATION: Real CO2 Data from Sensors/DB
# ═════════════════════════════════════════════════
from datetime import datetime, timedelta

def co2_stats(user_id):
    # Get user's trips today
    trips = db.query("""
        SELECT mode, distance FROM user_trips
        WHERE user_id = ? AND date(timestamp) = date('now')
    """, user_id)
    
    # Calculate emissions by mode
    co2_factors = {
        'car': 0.21,          # kg CO2 per km
        'bus': 0.05,
        'metro': 0.041,
        'bike': 0
    }
    
    total_emissions = sum(
        trip['distance'] * co2_factors[trip['mode']]
        for trip in trips
    )
    
    # Compare with city average
    city_avg = db.query("""
        SELECT avg_co2 FROM city_statistics
        WHERE date = date('now')
    """)[0]['avg_co2']
    
    return {
        'today': round(total_emissions, 2),
        'comparison': round((1 - total_emissions/city_avg) * 100, 1),
        'saved_kg': round((city_avg - total_emissions), 2),
        'source': 'User Trip History + CO2 Database'
    }
```

### 4. Weather (API)

```python
# ═════════════════════════════════════════════════
# INTEGRATION: OpenWeatherMap API
# ═════════════════════════════════════════════════
import requests

WEATHER_API_KEY = os.getenv('WEATHER_API_KEY')
CACHE = {'weather': None, 'timestamp': None}

def get_cached_weather():
    """Cache weather for 15 minutes to avoid rate limits"""
    now = datetime.now()
    if (CACHE['weather'] and 
        (now - CACHE['timestamp']).seconds < 900):
        return CACHE['weather']
    
    # Fetch fresh data
    response = requests.get(
        'https://api.openweathermap.org/data/2.5/weather',
        params={
            'lat': 48.8566,      # Paris
            'lon': 2.3522,
            'appid': WEATHER_API_KEY,
            'units': 'metric'
        }
    )
    
    data = response.json()
    CACHE['weather'] = data
    CACHE['timestamp'] = now
    return data

def weather_current():
    data = get_cached_weather()
    
    return {
        'temperature': data['main']['temp'],
        'condition': data['weather'][0]['main'],
        'humidity': data['main']['humidity'],
        'wind': data['wind']['speed'],
        'source': 'OpenWeatherMap API'
    }
```

### 5. Infrastructure Status (IoT/Sensors)

```python
# ═════════════════════════════════════════════════
# INTEGRATION: MQTT Sensors + Time Series DB
# ═════════════════════════════════════════════════
from influxdb_client import InfluxDBClient

influx_client = InfluxDBClient(
    url='http://localhost:8086',
    token=os.getenv('INFLUX_TOKEN')
)

def infra_status():
    # Query infrastructure metrics from InfluxDB
    query = '''
        from(bucket:"smart_mobility")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "infrastructure")
        |> last()
    '''
    
    tables = influx_client.query_api().query(query)
    
    metrics = {}
    for table in tables:
        for record in table.records:
            metrics[record.field] = record.value
    
    return {
        'health': metrics.get('health_score', 85),
        'energy': metrics.get('power_usage', 1250),
        'temperature': metrics.get('server_temp', 45),
        'uptime': metrics.get('uptime_percent', 99.8),
        'source': 'MQTT Sensors + InfluxDB'
    }
```

### 6. User Statistics (PostgreSQL)

```python
# ═════════════════════════════════════════════════
# INTEGRATION: PostgreSQL Database
# ═════════════════════════════════════════════════
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONN = psycopg2.connect(
    host='localhost',
    database='smart_mobility',
    user='app_user',
    password=os.getenv('DB_PASSWORD')
)

def user_stats(user_id):
    cursor = DB_CONN.cursor(cursor_factory=RealDictCursor)
    
    # Get user trips
    cursor.execute("""
        SELECT 
            COUNT(*) as total_trips,
            SUM(CASE WHEN date(created_at) = date('now') 
                THEN 1 ELSE 0 END) as today_trips,
            SUM(distance) as total_km,
            SUM(co2_saved) as total_co2_saved
        FROM trips
        WHERE user_id = %s
    """, (user_id,))
    
    trips = cursor.fetchone()
    
    # Get user points
    cursor.execute("""
        SELECT points, rank FROM user_profiles WHERE id = %s
    """, (user_id,))
    
    profile = cursor.fetchone()
    
    return {
        'trips': trips['total_trips'],
        'co2_saved': trips['total_co2_saved'],
        'points': profile['points'],
        'rank': profile['rank'],
        'source': 'PostgreSQL Database'
    }
```

### 7. Alerts (Rule Engine)

```python
# ═════════════════════════════════════════════════
# INTEGRATION: Real-time Alert System
# ═════════════════════════════════════════════════
from datetime import datetime, timedelta

def active_alerts():
    # Query active alerts from database
    alerts = db.query("""
        SELECT id, severity, category, title, message, 
               created_at, expected_end
        FROM alerts
        WHERE resolved_at IS NULL
        AND created_at > datetime('now', '-24 hours')
        ORDER BY severity DESC, created_at DESC
    """)
    
    result = []
    for alert in alerts:
        result.append({
            'id': alert['id'],
            'severity': alert['severity'],
            'category': alert['category'],
            'title': alert['title'],
            'message': alert['message'],
            'startTime': alert['created_at'],
            'estimatedEnd': alert['expected_end'],
            'source': 'Alert Database'
        })
    
    return {
        'alerts': result,
        'count': len(result),
        'timestamp': datetime.now().isoformat()
    }
```

### 8. Predictions (ML Pipeline)

```python
# ═════════════════════════════════════════════════
# INTEGRATION: XGBoost + LSTM Models
# ═════════════════════════════════════════════════
import tensorflow as tf
import numpy as np

lstm_model = tf.keras.models.load_model('models/traffic_lstm.h5')

def predictions_next_hour():
    # Get historical data for LSTM
    history = db.query("""
        SELECT traffic_level FROM traffic_history
        WHERE timestamp > datetime('now', '-24 hours')
        ORDER BY timestamp
    """)
    
    # Prepare sequence for LSTM
    sequence = np.array([h['traffic_level'] for h in history[-60:]])
    sequence = sequence.reshape(1, -1, 1)
    
    # Predict next 60 minutes
    predictions = lstm_model.predict(sequence)
    
    hourly = []
    for i in range(4):  # 4 x 15-minute intervals
        hourly.append({
            'time': (datetime.now() + timedelta(minutes=15*i)).isoformat(),
            'traffic': 'Moderate' if predictions[0][i] < 60 else 'Heavy',
            'expectedDelay': int(predictions[0][i])
        })
    
    return {
        'hourly': hourly,
        'confidence': 0.88,
        'model': 'LSTM Neural Network',
        'source': 'ML Pipeline'
    }
```

---

## 🔗 Configuration d'Environment

Créer `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/smart_mobility
DB_PASSWORD=your_password

# APIs
WEATHER_API_KEY=your_openweather_key
OPENAI_API_KEY=sk-your-key

# Sensors/IoT
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=your_token
MQTT_BROKER=localhost
MQTT_PORT=1883

# Cache
REDIS_URL=redis://localhost:6379

# Models
MODEL_PATH=./models
```

### Charger dans le code:

```python
from dotenv import load_dotenv
import os

load_dotenv()

DB_CONN = create_connection(os.getenv('DATABASE_URL'))
WEATHER_KEY = os.getenv('WEATHER_API_KEY')
```

---

## 🧪 Test d'Intégration

### Tester endpoint avec vraies données:

```bash
# Terminal
curl http://localhost:5001/api/user/stats?user_id=123

# Doit retourner:
{
  "trips": 45,        # ← From DB, pas random!
  "co2_saved": 120.5, # ← Calculé
  "points": 850,      # ← From DB
  "source": "PostgreSQL Database"
}
```

### Vérifier les logs:

```python
# Ajouter debug logging
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.get('/api/user/stats')
def user_stats(user_id):
    logger.info(f"Fetching stats for user {user_id}")
    try:
        # ... code ...
        logger.info(f"Success: {result}")
        return result
    except Exception as e:
        logger.error(f"Error: {e}")
        return {'error': str(e)}, 500
```

---

## 🚨 Error Handling

```python
@app.get('/api/transport/status')
def transport_status():
    try:
        # Essayer données réelles
        real_data = get_live_transport_data()
        return format_response(real_data)
    
    except ConnectionError as e:
        logger.warning(f"DB connection failed: {e}")
        # Fallback à cache
        return get_cached_transport_data()
    
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        # Fallback à mock (pour dev)
        return generate_mock_response()
```

---

## 📈 Migration Strategy

### Phase 1: Hybrid Mode (Week 1)
```python
# Use mock data if real data unavailable
USE_MOCK_FALLBACK = True
```

### Phase 2: Gradual Transition (Week 2-3)
```python
# Progressively switch endpoints
ENDPOINTS_USING_REAL_DATA = [
    'user/stats',      # ✅ Ready
    'transport/status' # ✅ Ready
]
```

### Phase 3: Full Production (Week 4)
```python
# All endpoints use real data
USE_MOCK_FALLBACK = False
REQUIRE_REAL_DATA = True
```

---

## 📊 Monitoring

```python
import time
from prometheus_client import Counter, Histogram

request_count = Counter(
    'api_requests_total',
    'Total API requests',
    ['endpoint']
)

request_duration = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['endpoint']
)

@app.get('/api/user/stats')
def user_stats(user_id):
    start = time.time()
    try:
        result = get_real_user_stats(user_id)
        request_count.labels('user_stats').inc()
        request_duration.labels('user_stats').observe(
            time.time() - start
        )
        return result
    except Exception as e:
        request_count.labels('user_stats_error').inc()
        raise
```

---

## 🔒 Performance Tips

1. **Cache aggressively**
   ```python
   @cache_for(300)  # 5 min cache
   def get_stress_level():
       return expensive_calculation()
   ```

2. **Use connection pools**
   ```python
   from sqlalchemy import create_engine
   engine = create_engine(DB_URL, poolsize=20)
   ```

3. **Async operations**
   ```python
   from flask_cors import cross_origin
   from concurrent.futures import ThreadPoolExecutor
   
   executor = ThreadPoolExecutor(max_workers=4)
   ```

---

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** ✅ Ready for Integration
