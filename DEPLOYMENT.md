# Relationship Dashboard - AWS Deployment Guide

## Overview
This guide will help you deploy your Relationship Dashboard to AWS using:
- **Frontend**: AWS Amplify (auto-deploys from GitHub)
- **Backend**: AWS App Runner (auto-deploys from GitHub)

**Cost**: ~$5-15/month for light usage (both services scale to zero when not in use)

---

## Prerequisites

1. **AWS Account** with billing enabled
2. **GitHub Repository** with your code pushed
3. **AWS CLI** configured locally:
   ```bash
   aws configure --profile relationship-dashboard
   # Enter your AWS access key and secret key
   # Region: us-east-1
   ```

---

## Step 1: Deploy Backend (AWS App Runner)

### 1.1 Push Code to GitHub
```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 1.2 Create App Runner Service

1. Go to **AWS Console** → **App Runner** → **Create Service**

2. **Source**:
   - Repository type: **Source code repository**
   - Provider: **GitHub**
   - Connect your GitHub account (if not already connected)
   - Repository: Select your `Relationship-Dashboard` repo
   - Branch: **main** (or whatever branch you want)
   - **Source directory**: `backend`
   - Deployment trigger: **Automatic**

3. **Configure Build**:
   - Build settings: **Use a configuration file**
   - Configuration file: `apprunner.yaml` (already created in backend/)

4. **Configure Service**:
   - Service name: `relationship-dashboard-backend`
   - Virtual CPU: **1 vCPU**
   - Virtual memory: **2 GB**
   - Port: **8000** (should auto-detect from apprunner.yaml)

5. **Environment Variables** (Add these):
   ```
   PLAID_CLIENT_ID=your_plaid_client_id
   PLAID_PRODUCTION_API=your_plaid_secret
   PLAID_ENV=production
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
   ```
   *(You'll update CORS_ORIGINS after deploying frontend)*

6. **Security**:
   - Instance role: **Create new service role** (or select existing if you have one)
   - The auto-created role should have basic permissions

7. **Review and Create**

8. **Wait for deployment** (~5-10 minutes)

9. **Copy your App Runner URL**:
   - After deployment completes, you'll see a URL like:
   - `https://xxxxx.us-east-1.awsapprunner.com`
   - **Save this URL** - you'll need it for the frontend!

---

## Step 2: Deploy Frontend (AWS Amplify)

### 2.1 Create Amplify App

1. Go to **AWS Console** → **AWS Amplify** → **New app** → **Host web app**

2. **Connect Repository**:
   - Source: **GitHub**
   - Authorize AWS Amplify to access your GitHub
   - Select repository: **Relationship-Dashboard**
   - Branch: **main**

3. **App Settings**:
   - App name: `relationship-dashboard`
   - Amplify will auto-detect it's a React app

4. **Build Settings**:
   - Root directory: `relationship-dashboard`
   - Build command: `npm run build`
   - The default amplify.yml should work, but if you need to customize:
   
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd relationship-dashboard
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: relationship-dashboard/build
       files:
         - '**/*'
     cache:
       paths:
         - relationship-dashboard/node_modules/**/*
   ```

5. **Environment Variables**:
   - Add this environment variable:
   ```
   REACT_APP_API_URL=https://your-app-runner-url.us-east-1.awsapprunner.com/api
   ```
   *(Replace with your actual App Runner URL from Step 1.9)*

6. **Save and Deploy**

7. **Wait for build** (~3-5 minutes)

8. **Copy your Amplify URL**:
   - After deployment, you'll see a URL like:
   - `https://main.xxxxx.amplifyapp.com`

---

## Step 3: Update Backend CORS

Now that you have your Amplify URL, you need to allow it in your backend:

1. Go back to **App Runner** → **Services** → **relationship-dashboard-backend**

2. **Configuration** → **Environment variables** → **Edit**

3. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://main.xxxxx.amplifyapp.com,http://localhost:3000,http://localhost:3001,http://localhost:3002
   ```
   *(Replace with your actual Amplify URL)*

4. **Save** - App Runner will automatically redeploy with new settings

---

## Step 4: Test Your Deployment

1. Open your Amplify URL in a browser
2. The dashboard should load
3. Try adding a message or updating metrics
4. Check that financial data loads (if you've connected Plaid)

---

## Step 5: Custom Domain (Optional)

### For Amplify (Frontend):
1. In Amplify console → **Domain management**
2. Add your domain (e.g., `dashboard.yourdomain.com`)
3. Follow AWS's instructions to update your DNS records
4. SSL certificate is automatically provisioned

### For App Runner (Backend):
1. In App Runner console → **Custom domains**
2. Add your API domain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed
4. Update frontend's `REACT_APP_API_URL` to use custom domain

---

## Monitoring & Costs

### App Runner:
- **Logs**: App Runner → Service → Logs tab
- **Metrics**: App Runner → Service → Metrics tab
- **Cost**: ~$5-10/month for light usage (scales to zero)

### Amplify:
- **Logs**: Amplify → App → Build history
- **Cost**: ~$0.01 per build, ~$0.15/GB stored and served
- **Free tier**: 1000 build minutes/month, 5 GB storage, 15 GB served

### Total Expected Cost:
- **Development**: ~$5-15/month
- **Light production use**: ~$10-25/month

---

## Troubleshooting

### Backend won't start:
- Check **App Runner logs** for errors
- Ensure all environment variables are set correctly
- Verify `requirements.txt` is up to date

### Frontend can't connect to backend:
- Check `REACT_APP_API_URL` is set correctly in Amplify
- Verify CORS_ORIGINS includes your Amplify URL in App Runner
- Check App Runner service is running (not failed)

### Data not persisting:
- App Runner uses **ephemeral storage** - data resets on redeploy
- For production, consider using **AWS S3** or **EFS** for persistent storage
- Or upgrade to a small EC2 instance with persistent storage

### Plaid connection issues:
- Ensure `PLAID_CLIENT_ID` and `PLAID_PRODUCTION_API` are set in App Runner
- Check that you're using the correct Plaid environment
- Verify redirect URIs in Plaid dashboard include your Amplify URL

---

## Local Development After Deployment

Your local development still works the same:

```bash
# Terminal 1 - Backend
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd relationship-dashboard
npm start
```

The frontend will use `http://localhost:8000` by default when running locally.

---

## Future Improvements

1. **Persistent Storage**: Move JSON files to S3 or add a lightweight database
2. **Custom Domain**: Add your own domain name
3. **CI/CD**: Currently auto-deploys on push to main (already set up!)
4. **Monitoring**: Set up CloudWatch alarms for errors
5. **Backup**: Implement automated backups of your data files

---

## Quick Reference

| Service | Purpose | URL After Deployment |
|---------|---------|---------------------|
| AWS App Runner | Backend API | `https://xxxxx.us-east-1.awsapprunner.com` |
| AWS Amplify | Frontend React App | `https://main.xxxxx.amplifyapp.com` |

**Environment Variables**:
- **Backend (App Runner)**: `PLAID_CLIENT_ID`, `PLAID_PRODUCTION_API`, `CORS_ORIGINS`
- **Frontend (Amplify)**: `REACT_APP_API_URL`


