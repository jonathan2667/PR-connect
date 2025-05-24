# Render Deployment Guide

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **PostgreSQL Database**: Set up on Render

## Step 1: Create PostgreSQL Database

1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: `prconnect-database`
   - **Database**: `prconnect`
   - **User**: `prconnect_user`
   - **Region**: Choose your preferred region
4. Click "Create Database"
5. **Save the External Database URL** (you'll need this)

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
   
5. **Environment Variables**:
   ```
   DATABASE_URL=<your-postgresql-external-url>
   FLASK_ENV=production
   FRONTEND_URL=https://pr-connect-frontend.onrender.com
   RENDER_SERVICE_NAME=pr-connect-backend
   ```

6. **Advanced Settings**:
   - **Port**: `5001`
   - **Auto-Deploy**: `Yes`

7. Click "Create Web Service"

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
   ```

6. **Advanced Settings**:
   - **Port**: `3000`
   - **Auto-Deploy**: `Yes`

7. Click "Create Web Service"

## Step 4: Verify Deployment

1. **Backend Health Check**: 
   - Visit: `https://pr-connect-backend.onrender.com/health`
   - Should return JSON with service status

2. **Frontend**: 
   - Visit: `https://pr-connect-frontend.onrender.com`
   - Should load your application

3. **Database Migration**:
   - The backend will automatically create tables on first run
   - Check logs to ensure database connection is successful

## Step 5: Configure Custom Domains (Optional)

1. In Render Dashboard, go to your services
2. Click "Settings" → "Custom Domains"
3. Add your custom domain
4. Update environment variables to match custom domains

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Ensure `FRONTEND_URL` in backend matches your frontend URL
   - Check CORS configuration in `backend/app.py`

2. **Database Connection**:
   - Verify `DATABASE_URL` is correct
   - Check database logs in Render dashboard

3. **Build Failures**:
   - Check build logs in Render dashboard
   - Verify Dockerfile syntax
   - Ensure all dependencies are in requirements.txt/package.json

4. **Health Check Failures**:
   - Check if your app is listening on the correct port
   - Verify health check endpoints are accessible

### Environment Variables Reference:

**Backend**:
- `DATABASE_URL`: PostgreSQL connection string
- `FLASK_ENV`: `production`
- `FRONTEND_URL`: Your frontend URL
- `RENDER_SERVICE_NAME`: Your backend service name

**Frontend**:
- `NODE_ENV`: `production`
- `NEXT_PUBLIC_API_URL`: Your backend URL

## Monitoring

1. **Logs**: Access via Render Dashboard → Service → Logs
2. **Metrics**: Available in Render Dashboard
3. **Health Checks**: Automatic monitoring via health check endpoints

## Scaling

- Render automatically handles scaling based on traffic
- For more control, upgrade to paid plans for manual scaling options

## Security Notes

- All environment variables are encrypted at rest
- Use Render's built-in SSL certificates
- Database connections are encrypted
- Consider setting up monitoring and alerting for production use 