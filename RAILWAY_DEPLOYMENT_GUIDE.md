# Railway Deployment Guide for Go2 Parking Backend

## Your Railway URL
Your app is deployed at: **https://web-production-764e.up.railway.app**

## Step 1: Set Environment Variables in Railway Dashboard

Go to your Railway dashboard and add these variables in the **Variables** tab of your `web` service:

### Copy and Paste These Exact Values:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=808bf6583315eaee564d73c10653fec950d501862a581183a723a9eff5a04e33
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=https://web-production-764e.up.railway.app,http://localhost:8081,http://localhost:19000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Important Notes:
- **DATABASE_URL**: This is already set by Railway PostgreSQL - DO NOT CHANGE IT
- **DATABASE_PUBLIC_URL**: Use this for external connections if needed

## Step 2: Push Latest Changes to GitHub

Run these commands in your backend directory:

```bash
cd Go2-ParkingSoftware-Backend

# Add all changes
git add .

# Commit changes
git commit -m "Add Railway production configuration and database initialization"

# Push to GitHub
git push origin main
```

## Step 3: Railway Will Auto-Deploy

Once you push to GitHub, Railway will automatically:
1. Detect the changes
2. Install dependencies
3. Generate Prisma client
4. Create database tables (via prisma db push)
5. Build TypeScript
6. Start the server
7. Initialize database with default data

## Step 4: Verify Deployment

### Check Health Endpoint:
```
https://web-production-764e.up.railway.app/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "uptime": ...,
  "environment": "production"
}
```

### Test Login Endpoint:
```bash
curl -X POST https://web-production-764e.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@go2parking.com",
    "password": "Owner@123"
  }'
```

## Default Login Credentials

After deployment, these accounts will be available:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@go2parking.com | Owner@123 |
| Manager | manager@go2parking.com | Manager@123 |
| Attendant 1 | attendant1@go2parking.com | Attendant@123 |
| Attendant 2 | attendant2@go2parking.com | Attendant@123 |

## Troubleshooting

### If deployment fails:

1. **Check Logs**: Click on your service and go to the "Logs" tab
2. **Database Connection Issues**:
   - Ensure DATABASE_URL is set (automatically by Railway)
   - Check if PostgreSQL service is running
3. **Build Errors**:
   - Check if all dependencies are in package.json
   - Ensure TypeScript compiles without errors

### Common Issues:

1. **"Cannot find module"**: Run `npm install` locally and commit package-lock.json
2. **Database errors**: The database will be automatically initialized on first run
3. **CORS errors**: Update CORS_ORIGIN to include your frontend URL

## API Endpoints

Base URL: `https://web-production-764e.up.railway.app`

### Authentication
- POST `/api/auth/login` - Login
- POST `/api/auth/register` - Register new user
- POST `/api/auth/refresh` - Refresh token
- POST `/api/auth/logout` - Logout

### Tickets
- GET `/api/tickets` - List tickets
- GET `/api/tickets/:id` - Get ticket details
- POST `/api/tickets` - Create ticket
- PATCH `/api/tickets/:id` - Update ticket
- POST `/api/tickets/:id/pay` - Pay ticket

### Users
- GET `/api/users/me` - Current user profile
- GET `/api/users` - List users (Manager/Owner)
- PATCH `/api/users/:id` - Update user

### Locations
- GET `/api/locations` - List locations
- GET `/api/locations/:id` - Get location
- GET `/api/locations/:id/stats` - Location statistics

### Reports
- GET `/api/reports/summary` - Summary report
- GET `/api/reports/revenue` - Revenue report
- GET `/api/reports/activity` - Activity logs

## Next Steps

1. **Test all endpoints** using Postman or curl
2. **Change default passwords** immediately in production
3. **Set up monitoring** (optional)
4. **Configure custom domain** (optional)

## Support

If you encounter issues:
1. Check Railway logs
2. Ensure all environment variables are set
3. Verify GitHub connection is active
4. Check PostgreSQL service is running