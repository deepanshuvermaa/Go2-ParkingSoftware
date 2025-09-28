# Go2 Parking Backend API

Production-ready backend API for the Go2 Parking Management System.

## Features

- JWT-based authentication with refresh tokens
- Role-based access control (Owner, Manager, Attendant)
- PostgreSQL database with Prisma ORM
- RESTful API endpoints
- Rate limiting and security headers
- Activity logging
- Comprehensive reporting

## Tech Stack

- Node.js + TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Helmet (Security)
- CORS enabled

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Railway account (for deployment)

## Local Development

### 1. Install Dependencies

```bash
cd Go2-ParkingSoftware-Backend
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong secret key for JWT
- `PORT`: Server port (default: 3000)

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will run at `http://localhost:3000`

## Railway Deployment

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

### 2. Add PostgreSQL Database

In Railway dashboard:
1. Click "New Service"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically set `DATABASE_URL`

### 3. Set Environment Variables

In Railway dashboard or via CLI:

```bash
railway variables set JWT_SECRET="your-super-secret-jwt-key"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set JWT_REFRESH_EXPIRES_IN="30d"
railway variables set NODE_ENV="production"
railway variables set CORS_ORIGIN="https://your-frontend-url.com"
```

### 4. Deploy

```bash
# Deploy to Railway
railway up

# Or connect GitHub repo for automatic deploys
railway link
```

### 5. Run Migrations

After first deployment:

```bash
railway run npx prisma migrate deploy
railway run npm run db:seed  # Optional: seed initial data
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users` - List all users (Manager/Owner)
- `GET /api/users/:id` - Get specific user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user (Owner only)

### Tickets
- `GET /api/tickets` - List tickets
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets` - Create new ticket
- `PATCH /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/pay` - Process payment
- `POST /api/tickets/sync` - Sync offline tickets

### Locations
- `GET /api/locations` - List all locations
- `GET /api/locations/:id` - Get location details
- `POST /api/locations` - Create location (Owner)
- `PATCH /api/locations/:id` - Update location
- `GET /api/locations/:id/stats` - Get location statistics

### Pricing
- `GET /api/pricing` - List pricing rules
- `GET /api/pricing/:id` - Get pricing rule
- `POST /api/pricing` - Create pricing rule
- `PATCH /api/pricing/:id` - Update pricing rule
- `DELETE /api/pricing/:id` - Deactivate pricing rule
- `GET /api/pricing/calculate/:locationId` - Calculate parking fee

### Reports
- `GET /api/reports/summary` - Get summary report
- `GET /api/reports/revenue` - Revenue report (Owner/Manager)
- `GET /api/reports/activity` - Activity logs (Owner/Manager)
- `GET /api/reports/attendant-performance` - Performance metrics

## Default Credentials (After Seeding)

- **Owner**: owner@go2parking.com / Owner@123
- **Manager**: manager@go2parking.com / Manager@123
- **Attendant 1**: attendant1@go2parking.com / Attendant@123
- **Attendant 2**: attendant2@go2parking.com / Attendant@123

## Update Mobile App Configuration

After deploying the backend, update your React Native app:

1. Open `Go2-ParkingSoftware/.env`
2. Set `API_BASE_URL` to your Railway backend URL:
   ```
   API_BASE_URL=https://your-app.railway.app
   ```

3. Update `app.json` if using Expo:
   ```json
   {
     "expo": {
       "extra": {
         "apiBaseUrl": "https://your-app.railway.app"
       }
     }
   }
   ```

## Monitoring

- Health check: `GET /health`
- View logs in Railway dashboard
- Monitor database connections in Railway PostgreSQL dashboard

## Security Notes

1. **Change default credentials** immediately after deployment
2. **Use strong JWT secret** (min 32 characters)
3. **Configure CORS** for your specific frontend domains
4. **Enable HTTPS** (Railway provides this automatically)
5. **Regular backups** of PostgreSQL database
6. **Monitor rate limits** and adjust as needed

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
railway run npx prisma db pull

# Reset database (CAUTION: Deletes all data)
railway run npx prisma migrate reset
```

### Migration Issues
```bash
# Create new migration
npx prisma migrate dev --name your_migration_name

# Deploy migrations to production
railway run npx prisma migrate deploy
```

### View Logs
```bash
railway logs
```

## Support

For issues or questions:
1. Check Railway status: https://status.railway.app
2. Review Prisma docs: https://www.prisma.io/docs
3. Check application logs in Railway dashboard