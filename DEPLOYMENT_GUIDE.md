# Deployment Guide

This guide covers deploying the AI Course Platform to production environments including Cloudflare Workers, Vercel, AWS, and traditional servers.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Storage Configuration](#storage-configuration)
5. [Deployment Targets](#deployment-targets)
6. [Environment Variables](#environment-variables)
7. [Migration Guide](#migration-guide)

---

## Architecture Overview

The platform is now production-ready with:

- **Database**: Drizzle ORM with PostgreSQL (scalable, production-grade)
- **File Storage**: Abstract storage adapters (Local/S3/R2)
- **ORM**: Drizzle ORM for type-safe database queries
- **Migrations**: Version-controlled database migrations

### Key Improvements

✅ **Database**: Migrated from SQLite to PostgreSQL with Drizzle ORM
✅ **Storage**: Abstract storage layer supporting local, S3, and Cloudflare R2
✅ **Scalability**: Serverless-ready architecture
✅ **Type Safety**: Full TypeScript support with Drizzle

---

## Prerequisites

### Required
- Node.js 18+
- PostgreSQL database (or managed service like Neon, Supabase, Railway)
- npm or yarn

### Optional (for cloud storage)
- AWS S3 credentials (for S3 storage)
- Cloudflare R2 credentials (for R2 storage)

---

## Database Setup

### Option 1: Managed PostgreSQL (Recommended)

**Neon** (Serverless PostgreSQL):
```bash
# Create free account at neon.tech
# Copy connection string to .env as DATABASE_URL
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/ai_course_platform
```

**Supabase** (PostgreSQL + Auth + Storage):
```bash
# Create project at supabase.com
# Copy PostgreSQL connection string (not pooler)
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
```

**Railway** (PostgreSQL):
```bash
# Deploy PostgreSQL on railway.app
# Copy DATABASE_URL from Railway dashboard
```

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE ai_course_platform;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_course_platform TO your_user;

# Update .env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/ai_course_platform
```

### Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Or push schema directly (development only)
npm run db:push
```

---

## Storage Configuration

### Local Storage (Development/EC2)

```env
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./data/uploads
STORAGE_LOCAL_URL=http://localhost:3000/uploads
```

**Best for**: Local development, EC2, VPS

### AWS S3 (Production)

```env
STORAGE_TYPE=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_PUBLIC_URL=https://your-cdn-url.com
```

**Setup**:
```bash
# Install S3 SDK
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Create S3 bucket in AWS Console
# Set appropriate CORS and public access policies
```

**Best for**: AWS deployments, high availability

### Cloudflare R2 (Production)

```env
STORAGE_TYPE=r2
R2_ACCOUNT_ID=your-account-id
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_PUBLIC_URL=https://your-r2-public-url.com
```

**Setup**:
```bash
# Create R2 bucket in Cloudflare dashboard
# Generate R2 API tokens
# Configure R2 public URL (or use Cloudflare CDN)
```

**Best for**: Cloudflare deployments, cost-effective storage

---

## Deployment Targets

### 1. Vercel (Serverless)

**Prerequisites**:
- PostgreSQL database (Neon/Supabase recommended)
- S3 or R2 for file storage

```bash
# Install Vercel CLI
npm i -g vercel

# Configure environment variables in Vercel dashboard
# Deploy
vercel --prod
```

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null
}
```

**Environment Variables** (add in Vercel dashboard):
- DATABASE_URL
- STORAGE_TYPE=r2
- R2_* credentials
- All AI API keys

### 2. Cloudflare Workers/Pages

**Prerequisites**:
- Neon or Cloudflare D1 for database
- Cloudflare R2 for file storage

```bash
# Install Wrangler CLI
npm install -g wrangler

# Configure wrangler.toml
# Deploy
wrangler deploy
```

**Best with**: Cloudflare R2, Neon database

### 3. AWS (EC2/ECS/Lambda)

**EC2/ECS**:
```bash
# Use local or S3 storage
STORAGE_TYPE=local  # or s3
DATABASE_URL=postgresql://...

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name ai-course-platform
```

**Lambda**:
- Use API Gateway + Lambda
- PostgreSQL via RDS or Neon
- S3 for file storage

### 4. Traditional Server (VPS/Dedicated)

```bash
# Install Node.js, PostgreSQL, Nginx
sudo apt-get update
sudo apt-get install nodejs npm postgresql nginx

# Clone repository
git clone <your-repo>
cd ai-course-platform

# Install dependencies
npm install

# Setup .env
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run db:migrate

# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/server.js --name ai-course-platform
pm2 save
pm2 startup

# Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/ai-course-platform
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files
    location /uploads {
        alias /path/to/ai-course-platform/data/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Environment Variables

### Required

```env
# Server
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/database

# Storage
STORAGE_TYPE=local|s3|r2

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NOTEBOOKLM_API_KEY=...
SORA_API_KEY=...
HEYGEN_API_KEY=...

# Chatbot Provider
CHATBOT_PROVIDER=openai|anthropic
```

### Storage-Specific

**Local**:
```env
STORAGE_LOCAL_PATH=./data/uploads
STORAGE_LOCAL_URL=https://yourdomain.com/uploads
```

**S3**:
```env
S3_BUCKET=your-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_URL=https://cdn.yourdomain.com
```

**R2**:
```env
R2_ACCOUNT_ID=...
R2_BUCKET=your-bucket
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_URL=https://r2.yourdomain.com
```

---

## Migration Guide

### From SQLite to PostgreSQL

1. **Set up PostgreSQL database**
2. **Update .env**:
   ```env
   DATABASE_URL=postgresql://...
   ```
3. **Run migrations**:
   ```bash
   npm run db:migrate
   ```
4. **Migrate data** (if needed):
   ```bash
   # Export from SQLite
   sqlite3 data/courses.db .dump > backup.sql

   # Transform and import to PostgreSQL
   # (manual process, depends on data volume)
   ```

### Storage Migration

**From local to S3/R2**:
```bash
# Option 1: Manual upload
aws s3 sync ./data/uploads s3://your-bucket/

# Option 2: Use migration script (create custom script)
```

---

## Performance Optimization

### Database
- Enable connection pooling
- Use read replicas for high-traffic deployments
- Configure PostgreSQL for production workloads

### Storage
- Use CDN for file delivery (CloudFlare, CloudFront)
- Enable compression for uploads
- Implement lazy loading for media

### Application
- Enable Redis for session storage and caching
- Use PM2 cluster mode for multi-core utilization
- Implement response compression (gzip)

---

## Monitoring & Logging

### Recommended Tools
- **Database**: pganalyze, Datadog
- **Application**: New Relic, Sentry
- **Logs**: CloudWatch, Logtail, Better Stack

### Health Checks

Add to your deployment:
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'connected',
    storage: process.env.STORAGE_TYPE,
    timestamp: new Date().toISOString()
  });
});
```

---

## Security Checklist

- [ ] Environment variables secured (never commit .env)
- [ ] Database SSL enabled in production
- [ ] File upload size limits configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] API keys rotated regularly
- [ ] HTTPS enforced
- [ ] Database backups automated
- [ ] Storage bucket access controls configured

---

## Support & Troubleshooting

### Common Issues

**Database Connection Failed**:
```bash
# Check DATABASE_URL format
# Verify network access (firewall, security groups)
# Test connection: psql $DATABASE_URL
```

**File Upload Issues**:
```bash
# Check STORAGE_TYPE is set correctly
# Verify storage credentials
# Check file size limits (MAX_FILE_SIZE)
```

**Migration Errors**:
```bash
# Reset migrations (development only):
npm run db:push --force

# Check migration status:
npm run db:studio
```

---

## Next Steps

1. Choose your deployment target
2. Set up PostgreSQL database
3. Configure storage (S3/R2)
4. Set environment variables
5. Run database migrations
6. Deploy and test
7. Set up monitoring
8. Configure backups

For questions or issues, please open a GitHub issue.
