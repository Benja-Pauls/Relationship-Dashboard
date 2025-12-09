# Quick Deployment Guide

## TL;DR - Deploy in 15 Minutes

### Step 1: Push to GitHub (2 min)
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy Backend - AWS App Runner (5 min)
1. AWS Console → **App Runner** → **Create Service**
2. Connect to GitHub → Select repo → Branch: `main` → Source directory: `backend`
3. Use configuration file: `apprunner.yaml`
4. Service name: `relationship-dashboard-backend`
5. Add environment variables:
   - `PLAID_CLIENT_ID` = your_plaid_id
   - `PLAID_PRODUCTION_API` = your_plaid_secret
   - `CORS_ORIGINS` = `http://localhost:3000` (we'll update this)
6. **Create** and wait for deployment
7. **Copy the App Runner URL** (looks like `https://xxxxx.us-east-1.awsapprunner.com`)

### Step 3: Deploy Frontend - AWS Amplify (5 min)
1. AWS Console → **Amplify** → **New app** → **Host web app**
2. GitHub → Select repo → Branch: `main`
3. Root directory: `relationship-dashboard`
4. Add environment variable:
   - `REACT_APP_API_URL` = `https://YOUR-APP-RUNNER-URL/api`
5. **Save and deploy**
6. **Copy the Amplify URL** (looks like `https://main.xxxxx.amplifyapp.com`)

### Step 4: Update CORS (3 min)
1. Go back to **App Runner** → Your service → **Configuration** → **Environment variables**
2. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://YOUR-AMPLIFY-URL,http://localhost:3000,http://localhost:3001,http://localhost:3002
   ```
3. Save (auto-redeploys)

### Step 5: Test! 🎉
Open your Amplify URL and enjoy your deployed dashboard!

---

## Cost Estimate
- **Total**: ~$5-15/month for light usage
- Both services scale to near-zero when not in use
- First month might be free tier eligible

---

## Need Help?
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions and troubleshooting.

## Architecture
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────────┐
│  AWS Amplify    │─────▶│  AWS App Runner  │
│  (Frontend)     │      │  (Backend)       │
│  React App      │      │  FastAPI         │
└─────────────────┘      └──────────────────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │  Plaid API     │
                         │  (Financial)   │
                         └────────────────┘
```

Simple, cheap, and fully managed! 🚀


