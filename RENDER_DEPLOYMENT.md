# PR-Connect Render Deployment Guide

## Overview

PR-Connect is an AI-powered press release generation platform with:
- **Frontend**: Next.js 15.1.8 with TypeScript, Tailwind CSS, voice input functionality
- **Backend**: Flask API with SQLAlchemy, CORS support, uAgents integration
- **Database**: PostgreSQL with structured press release data storage
- **Features**: Multi-outlet press release generation, request history, voice input

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **PostgreSQL Database**: Set up on Render (required for data persistence)

## Step 1: Create PostgreSQL Database

1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: `prconnect-database`
   - **Database**: `prconnect`
   - **User**: `prconnect_user`
   - **Region**: Choose your preferred region (recommend US East for best performance)
   - **PostgreSQL Version**: 15 (recommended)
4. Click "Create Database"
5. **Save the External Database URL** - you'll need this for backend deployment

## Step 2: Deploy Backend (Flask API)

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `pr-connect-backend`
   - **Environment**: `Docker`
   - **Region**: Same as your database
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `backend`
   - **Health Check Path**: `/health`
   
5. **Environment Variables** (Critical - copy exactly):
   ```
   DATABASE_URL=<your-postgresql-external-url-from-step-1>
   FLASK_ENV=production
   FRONTEND_URL=https://pr-connect-frontend.onrender.com
   RENDER_SERVICE_NAME=pr-connect-backend
   PORT=5001
   AGENT_ADRESS=agent1qf376ss48kl8cpsc8pwtmtauscplngqrf0ku437ma5jwcvqw20r2jf38pzp
   ```

6. **Advanced Settings**:
   - **Port**: `5001`
   - **Auto-Deploy**: `Yes`
   - **Health Check Grace Period**: `120` seconds
   - **Build Command**: (leave empty - Docker handles this)
   - **Start Command**: (leave empty - Docker handles this)

7. Click "Create Web Service"

### Backend API Endpoints

The backend provides these endpoints:
- `GET /` - Service information
- `GET /health` - Health check
- `GET /cors-test` - CORS testing
- `POST /generate` - Generate press releases
- `GET /api/outlets` - Available media outlets
- `GET /api/categories` - Press release categories
- `GET /api/requests` - Request history
- `GET /api/requests/{id}` - Specific request details
- `POST /api/init-db` - Initialize database (dev only)

## Step 3: Deploy Frontend (Next.js)

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `pr-connect-frontend`
   - **Environment**: `Docker`
   - **Region**: Same as your backend
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Health Check Path**: `/`

5. **Environment Variables**:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://pr-connect-backend.onrender.com
   NEXT_TELEMETRY_DISABLED=1
   ```

6. **Advanced Settings**:
   - **Port**: `3000`
   - **Auto-Deploy**: `Yes`
   - **Health Check Grace Period**: `120` seconds

7. Click "Create Web Service"

### Frontend Features

The frontend includes:
- **Multi-page Application**: Home, Dashboard, Request Creation, History
- **Voice Input**: Speech-to-text for press release creation
- **Responsive Design**: Mobile-friendly Tailwind CSS styling
- **Real-time Generation**: Live press release creation with progress indicators
- **History Management**: View and manage previous requests

## Step 4: Verify Deployment

### Backend Verification

1. **Health Check**: 
   ```
   GET https://pr-connect-backend.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "Press Release Generator",
     "available_outlets": 4,
     "available_categories": 10,
     "timestamp": "2025-01-XX..."
   }
   ```

2. **CORS Test**:
   ```
   GET https://pr-connect-backend.onrender.com/cors-test
   ```

3. **Database Connection**: Check logs for successful database initialization

### Frontend Verification

1. **Homepage**: Visit `https://pr-connect-frontend.onrender.com`
2. **Request Page**: Test press release generation at `/request`
3. **History Page**: Verify request history at `/history`
4. **Console Logs**: Check browser console for API URL configuration

### Database Schema Verification

The app will automatically create these tables:
- `news_outlets` (id, name)
- `requests` (id, title, body, news_outlet_id, company_name, category, contact_info, additional_notes, created_at)
- `responses` (id, body, request_id, tone, word_count, created_at)

## Step 5: Environment Variables Reference

### Backend Environment Variables

| Variable | Required | Description | Example Value |
|----------|----------|-------------|---------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `FLASK_ENV` | ✅ | Flask environment | `production` |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS | `https://pr-connect-frontend.onrender.com` |
| `RENDER_SERVICE_NAME` | 🔧 | Service name for auto-config | `pr-connect-backend` |
| `PORT` | 🔧 | Server port | `5001` |
| `AGENT_ADRESS` | ⚠️ | uAgent address for AI integration | See deployment config |

### Frontend Environment Variables

| Variable | Required | Description | Example Value |
|----------|----------|-------------|---------------|
| `NODE_ENV` | ✅ | Node environment | `production` |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL | `https://pr-connect-backend.onrender.com` |
| `NEXT_TELEMETRY_DISABLED` | 🔧 | Disable Next.js telemetry | `1` |

## Troubleshooting

### Common Issues

#### 1. CORS Errors
- **Symptom**: Frontend can't reach backend
- **Solution**: Verify `FRONTEND_URL` in backend matches your frontend URL exactly
- **Check**: Backend logs show allowed origins

#### 2. Database Connection Errors
- **Symptom**: Backend logs show PostgreSQL connection failures
- **Solutions**: 
  - Verify `DATABASE_URL` is the **External URL** from your Render database
  - Ensure database and backend are in the same region
  - Check database credentials haven't expired

#### 3. Build Failures
- **Backend**: Check `requirements.txt` dependencies, ensure PostgreSQL client is available
- **Frontend**: Verify `package.json` dependencies, Node.js version compatibility

#### 4. Environment Variables Not Loading
- **Symptom**: Frontend shows fallback URLs in console
- **Solutions**:
  - Ensure variable names are exactly `NEXT_PUBLIC_API_URL` (case sensitive)
  - Redeploy frontend after adding environment variables
  - Check Render environment variables tab for typos

#### 5. Health Check Failures
- **Symptom**: Services show as unhealthy
- **Solutions**:
  - Increase health check grace period to 120 seconds
  - Verify ports (backend: 5001, frontend: 3000)
  - Check application logs for startup errors

### Debug Tools

#### Backend Debug Endpoints
```bash
# Service info
curl https://pr-connect-backend.onrender.com/

# Health check
curl https://pr-connect-backend.onrender.com/health

# CORS test
curl https://pr-connect-backend.onrender.com/cors-test

# Available outlets
curl https://pr-connect-backend.onrender.com/api/outlets

# Categories
curl https://pr-connect-backend.onrender.com/api/categories
```

#### Frontend Debug
- Open browser console and check for API URL configuration logs
- Verify API calls in Network tab
- Check for TypeScript/React errors in console

### Performance Optimization

1. **Database**: Keep database and services in same region
2. **Caching**: Render automatically handles static asset caching
3. **Health Checks**: Monitor response times in Render dashboard
4. **Scaling**: Upgrade to paid plans for auto-scaling and performance boost

## Custom Domains (Optional)

1. In Render Dashboard, go to your services
2. Click "Settings" → "Custom Domains"
3. Add your custom domain
4. Update environment variables to match custom domains:
   - Update `FRONTEND_URL` in backend
   - Update `NEXT_PUBLIC_API_URL` in frontend if using custom backend domain

## Monitoring & Maintenance

### Logs Access
- **Render Dashboard** → Service → Logs tab
- Real-time log streaming available
- Historical logs retained based on plan

### Metrics
- **Render Dashboard** → Service → Metrics tab
- CPU, Memory, Response time tracking
- Alert configuration available on paid plans

### Backup Strategy
- Database: Use Render's automated backup features
- Code: Ensure GitHub repository is up to date
- Environment Variables: Document separately for disaster recovery

## Security Notes

- All environment variables are encrypted at rest
- Database connections use SSL/TLS encryption
- Render provides automatic SSL certificates
- API endpoints include CORS protection
- Non-root users in Docker containers
- Health checks ensure service availability

## Cost Optimization

- **Free Tier**: Suitable for development/testing
- **Paid Plans**: Required for production (always-on services, better performance)
- **Database**: Monitor usage to optimize plan selection
- **Auto-Deploy**: Consider disabling for production branches to control deployments

## Support Resources

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Status Page**: [status.render.com](https://status.render.com)
- **Support**: Available through Render dashboard
- **Community**: Render community forums and Discord 