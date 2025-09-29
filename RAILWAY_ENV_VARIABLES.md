# Railway Environment Variables Setup

## Required Environment Variables

Copy and paste these variables into your Railway dashboard under the Variables tab:

### 1. Database (Already Set by Railway PostgreSQL)
```
DATABASE_URL
```
This is automatically set when you add PostgreSQL. Use the `DATABASE_URL` value from your PostgreSQL service.

### 2. Application Variables (Add these manually)

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# JWT Configuration - CRITICAL: Generate a secure secret!
JWT_SECRET=change-this-to-a-very-long-random-string-at-least-32-characters-use-a-generator
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=https://web-production-764e.up.railway.app,http://localhost:8081,http://localhost:19000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## How to Add Variables in Railway:

1. Go to your Railway project dashboard
2. Click on your `web` service
3. Go to the **Variables** tab
4. Click **"Raw Editor"** or add them one by one
5. If using Raw Editor, paste this:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secure-random-string-here-minimum-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=https://web-production-764e.up.railway.app,http://localhost:8081,http://localhost:19000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## Generate a Secure JWT Secret:

Use one of these methods to generate a secure JWT secret:

### Option 1: Node.js (in terminal)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: Online Generator
Visit: https://www.grc.com/passwords.htm
Use the "63 random alpha-numeric characters" option

### Option 3: OpenSSL (if available)
```bash
openssl rand -hex 32
```

## Important Notes:

1. **JWT_SECRET**: Never use the example secret in production! Generate your own.
2. **DATABASE_URL**: This is automatically provided by Railway PostgreSQL - don't change it
3. **CORS_ORIGIN**: Update this with your actual frontend URLs when deploying the mobile app
4. **PORT**: Railway automatically uses the PORT variable, keep it as 3000

## After Adding Variables:

1. Railway will automatically redeploy your application
2. Check the deployment logs for any errors
3. Your app should be available at: https://web-production-764e.up.railway.app

## Test Your Deployment:

Once deployed, test the health endpoint:
```
https://web-production-764e.up.railway.app/health
```

You should see a JSON response with status "healthy".