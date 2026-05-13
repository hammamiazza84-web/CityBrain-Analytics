# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### Code Quality ✅
- [ ] No console errors
- [ ] No TypeScript compilation errors
- [ ] All tests passing
- [ ] Code reviewed
- [ ] No hardcoded credentials

### Backend ✅
- [ ] Mock data replaced with real data
- [ ] Database connections tested
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Environment variables set

### Frontend ✅
- [ ] Build succeeds: `ng build --prod`
- [ ] No warnings in build output
- [ ] Environment config for production set
- [ ] API URL points to production backend
- [ ] OpenAI key configured (or disabled)

### Security ✅
- [ ] No credentials in code
- [ ] API key in environment variables
- [ ] HTTPS enabled
- [ ] CORS whitelist set
- [ ] Input validation implemented
- [ ] SQL injection prevention

### Testing ✅
- [ ] Smoke tests passed
- [ ] Load tests passed
- [ ] Security tests passed
- [ ] E2E tests passed

---

## 🌍 Deployment Options

### Option 1: Heroku (Easiest)

#### Backend to Heroku

1. **Create Heroku account** at heroku.com

2. **Login to Heroku CLI:**
```bash
heroku login
```

3. **Create app:**
```bash
heroku create your-app-name
```

4. **Add Procfile** in backend/:
```
web: python smart_mobility_ai_backend.py
```

5. **Set environment variables:**
```bash
heroku config:set FLASK_ENV=production
heroku config:set DATABASE_URL=postgresql://...
heroku config:set WEATHER_API_KEY=your_key
```

6. **Deploy:**
```bash
cd backend
git push heroku main
```

7. **Check logs:**
```bash
heroku logs --tail
```

**Result:** Backend runs on `https://your-app-name.herokuapp.com`

#### Frontend to Netlify

1. **Build Angular:**
```bash
ng build --prod
```

2. **Connect GitHub** at netlify.com

3. **Set build command:**
```
ng build --prod
```

4. **Set publish directory:**
```
dist/smart-mobility-angular
```

5. **Set environment variables:**
```
NG_APP_API_URL=https://your-app-name.herokuapp.com
NG_APP_OPENAI_ENABLED=true
NG_APP_OPENAI_API_KEY=sk-...
```

6. **Deploy:** Push to GitHub and Netlify auto-deploys

**Result:** Frontend runs on `https://your-app-name.netlify.app`

---

### Option 2: AWS (Scalable)

#### Backend on EC2

1. **Launch EC2 instance** (Ubuntu 20.04)

2. **Connect SSH:**
```bash
ssh -i key.pem ubuntu@your-instance-ip
```

3. **Install Python:**
```bash
sudo apt update
sudo apt install python3-pip python3-venv
```

4. **Deploy code:**
```bash
git clone your-repo
cd your-repo/backend
```

5. **Create venv:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

6. **Run with supervisor:**
```bash
sudo apt install supervisor

# Create /etc/supervisor/conf.d/smart-mobility.conf
[program:smart-mobility]
directory=/home/ubuntu/your-repo/backend
command=/home/ubuntu/your-repo/backend/venv/bin/python smart_mobility_ai_backend.py
autostart=true
autorestart=true
```

7. **Start:**
```bash
sudo supervisorctl start smart-mobility
```

#### Frontend on S3 + CloudFront

1. **Build Angular:**
```bash
ng build --prod
```

2. **Create S3 bucket:**
```bash
aws s3 mb s3://smart-mobility-prod
```

3. **Upload files:**
```bash
aws s3 sync dist/smart-mobility-angular s3://smart-mobility-prod
```

4. **Create CloudFront distribution** pointing to S3

**Result:** Frontend on CloudFront CDN globally

---

### Option 3: Docker (Containerized)

#### Create Docker container for backend

**Create `backend/Dockerfile`:**
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP=smart_mobility_ai_backend.py
ENV FLASK_ENV=production

EXPOSE 5001

CMD ["python", "smart_mobility_ai_backend.py"]
```

**Build & run:**
```bash
docker build -t smart-mobility-api .
docker run -p 5001:5001 smart-mobility-api
```

**Deploy to Docker Hub or private registry**

#### Docker Compose for full stack

**Create `docker-compose.yml`:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/smart_mobility
      - FLASK_ENV=production
    depends_on:
      - db
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=smart_mobility
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  frontend:
    build: ./
    ports:
      - "80:4200"
    environment:
      - NG_APP_API_URL=http://backend:5001
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Run all services:**
```bash
docker-compose up -d
```

---

## 🔐 Security Hardening

### 1. Environment Variables

**Never commit these:**
```bash
echo ".env" >> .gitignore
echo "*.pem" >> .gitignore
echo "credentials.json" >> .gitignore
```

**Use .env.example:**
```
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@localhost/db
WEATHER_API_KEY=your_key_here
OPENAI_API_KEY=sk-...
```

### 2. HTTPS/SSL

**For Heroku/Netlify:**
- Automatic SSL ✅

**For AWS:**
```bash
# Use AWS Certificate Manager
# Point to CloudFront
# Enable SSL/TLS
```

### 3. API Security

```python
# Rate limiting
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(app, key_func=get_remote_address)

@app.get('/api/context/all')
@limiter.limit("100 per hour")
def full_context():
    return {...}

# CORS whitelist
CORS(app, origins=[
    'https://your-domain.com',
    'https://www.your-domain.com'
])
```

### 4. Input Validation

```python
from flask import request
from werkzeug.exceptions import BadRequest

@app.get('/api/user/stats')
def user_stats():
    user_id = request.args.get('user_id')
    
    # Validate input
    if not user_id or not user_id.isdigit():
        return {'error': 'Invalid user_id'}, 400
    
    return {...}
```

---

## 📊 Monitoring & Logging

### Backend Logging

```python
import logging
from logging.handlers import RotatingFileHandler

# Setup logging
handler = RotatingFileHandler(
    'logs/app.log',
    maxBytes=10000000,
    backupCount=10
)
logger = logging.getLogger(__name__)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

@app.before_request
def log_request():
    logger.info(f"Request: {request.method} {request.path}")

@app.after_request
def log_response(response):
    logger.info(f"Response: {response.status_code}")
    return response
```

### Frontend Error Tracking

```typescript
// src/app/app.config.ts
import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: "https://your-sentry-dsn@sentry.io/project",
  environment: "production",
  tracesSampleRate: 1.0
});
```

### Performance Monitoring

```python
# Use New Relic, Datadog, or similar
import newrelic.agent
newrelic.agent.initialize('newrelic.ini')

@app.before_request
def monitor():
    # Automatically tracks request performance
    pass
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions for Auto-Deploy

**Create `.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: ng build --prod

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        run: |
          git push https://heroku:${{ secrets.HEROKU_API_KEY }}@git.heroku.com/${{ secrets.HEROKU_APP_NAME }}.git main

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        run: |
          npm run build
          npx netlify-cli deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 📈 Scaling Strategy

### Stage 1: MVP (Month 1)
- Single server
- ~100 concurrent users
- All data in memory cache

### Stage 2: Growth (Month 2-3)
- Load balancer
- Multiple backend instances
- Redis for caching
- PostgreSQL for persistence

### Stage 3: Scale (Month 4+)
- CDN for frontend
- Horizontal scaling
- Database replication
- Message queue (RabbitMQ)
- Microservices architecture

---

## 🚨 Disaster Recovery

### Backup Strategy

```bash
# Daily database backups
0 2 * * * pg_dump smart_mobility | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Upload to S3
aws s3 sync /backups s3://smart-mobility-backups/

# Keep 30 days
aws s3 rm s3://smart-mobility-backups/ --recursive --exclude "*" --include "*.sql.gz" --before $(date -d '30 days ago' +%Y-%m-%d)
```

### Recovery Plan

1. **Database failure:**
   ```bash
   # Restore from backup
   gunzip < backup.sql.gz | psql smart_mobility
   ```

2. **Application crash:**
   ```bash
   # Auto-restart via supervisor/systemd
   systemctl restart smart-mobility
   ```

3. **Complete loss:**
   ```bash
   # Redeploy from Git
   git pull origin main
   docker-compose up -d
   ```

---

## 📊 Performance Optimization

### Frontend

```typescript
// Lazy loading
const routes = [
  {
    path: 'client',
    loadChildren: () => import('./client/client.module')
      .then(m => m.ClientModule)
  }
];

// Compression
gzip: true
brotli: true

// Cache busting
ng build --prod --output-hashing=all
```

### Backend

```python
# Caching
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'redis'})

@app.get('/api/context/all')
@cache.cached(timeout=30)  # 30 second cache
def full_context():
    return expensive_calculation()

# Connection pooling
SQLALCHEMY_POOL_SIZE = 20
SQLALCHEMY_POOL_RECYCLE = 3600
```

---

## ✅ Post-Deployment

### Validation

- [ ] Frontend loads
- [ ] Chat opens
- [ ] Backend responds
- [ ] API returns data
- [ ] AI generates responses
- [ ] No console errors
- [ ] Performance acceptable

### Monitoring

- [ ] Setup error tracking (Sentry)
- [ ] Setup performance monitoring (New Relic/Datadog)
- [ ] Setup uptime monitoring (UptimeRobot)
- [ ] Setup log aggregation (ELK Stack)

### Optimization

- [ ] Analyze slow queries
- [ ] Optimize database indexes
- [ ] Compress assets
- [ ] Enable CDN
- [ ] Adjust cache times

---

## 🎯 Deployment Timeline

```
Day 1:
✅ Prepare code
✅ Run tests
✅ Security review

Day 2:
✅ Deploy backend to staging
✅ Deploy frontend to staging
✅ Full QA testing

Day 3:
✅ Deploy backend to production
✅ Deploy frontend to production
✅ Monitor for 24h

Day 4+:
✅ Collect metrics
✅ Gather feedback
✅ Plan improvements
```

---

## 📞 Support During/After Deployment

### Deployment Day
- [ ] Team on standby
- [ ] Rollback plan ready
- [ ] Monitoring dashboards open
- [ ] Communication channel active

### Issues Found
- [ ] Document issue
- [ ] Assess severity
- [ ] Execute rollback if critical
- [ ] Fix in development
- [ ] Re-test thoroughly
- [ ] Redeploy

### Post-Deployment
- [ ] Send announcement to users
- [ ] Monitor feedback
- [ ] Track metrics
- [ ] Plan next improvements

---

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** ✅ Ready for Production
