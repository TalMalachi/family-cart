# FamilyCart — AWS Deployment Guide

## Prerequisites

- AWS account
- Domain name (optional but recommended)
- Your project repo accessible from the server (GitHub, etc.)
- `familycart-server.pem` key file for SSH access

---

## Phase 1: AWS Account & CLI Setup

### 1.1 Install AWS CLI (on your Mac)

```bash
brew install awscli
```

### 1.2 Configure credentials

```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region (e.g. us-east-1), Output format (json)
```

---

## Phase 2: EC2 Instance Setup

### 2.1 Launch an EC2 instance

- **AMI**: Amazon Linux 2023 or Ubuntu 24.04
- **Instance type**: `t3.small` (2 vCPU, 2 GB RAM — good starting point)
- **Storage**: 20 GB+ gp3
- **Security group** — open these ports:
  - `22` — SSH
  - `80` — HTTP
  - `443` — HTTPS
  - `3000` — API (can be removed after Nginx is set up)

### 2.2 SSH into the server

```bash
chmod 400 familycart-server.pem
ssh -i familycart-server.pem ec2-user@<your-ec2-public-ip>
```

### 2.3 Install Docker

```bash
sudo yum update -y
sudo yum install -y docker git
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

Log out and back in for the docker group to take effect:

```bash
exit
ssh -i familycart-server.pem ec2-user@<your-ec2-public-ip>
```

### 2.4 Clone the repo

```bash
git clone <your-repo-url> familycart
cd familycart
```

---

## Phase 3: Production Environment Configuration

### 3.1 Create the `.env` file on the server

```bash
cat > .env << 'EOF'
# ── Core ─────────────────────────────────────────────
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# ── Database ─────────────────────────────────────────
POSTGRES_USER=familycart
POSTGRES_PASSWORD=<strong-db-password>
POSTGRES_DB=familycart

# ── Redis ────────────────────────────────────────────
REDIS_PASSWORD=<strong-redis-password>

# ── Auth ─────────────────────────────────────────────
JWT_SECRET=<generate-a-strong-64-char-secret>

# ── Public URL ───────────────────────────────────────
APP_URL=https://your-domain.com
CORS_ORIGIN=*

# ── Default Admin (first boot only) ─────────────────
SEED_DEFAULT_ADMIN=true
DEFAULT_ADMIN_FULL_NAME=FamilyCart Admin
DEFAULT_ADMIN_PHONE=+10000000001
DEFAULT_ADMIN_EMAIL=admin@familycart.local
DEFAULT_ADMIN_PASSWORD=<strong-admin-password>
DEFAULT_ADMIN_FAMILY_NAME=FamilyCart Home

# ── Twilio SMS (leave blank to disable) ──────────────
TWILIO_SID=
TWILIO_TOKEN=
TWILIO_FROM=

# ── S3 / Cloudflare R2 ──────────────────────────────
S3_ENDPOINT=
S3_BUCKET=familycart-media
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_PUBLIC_URL=

# ── OpenAI (leave blank to disable AI features) ─────
OPENAI_API_KEY=

# ── Sentry (leave blank to disable error tracking) ──
SENTRY_DSN=
EOF
```

### 3.2 Generate secure secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 48

# Generate database password
openssl rand -base64 24

# Generate Redis password
openssl rand -base64 24
```

Replace the placeholder values in `.env` with the generated secrets.

---

## Phase 4: Deploy with Docker Compose

### 4.1 Build and start

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 4.2 Verify services are running

```bash
# Check all containers are healthy
docker compose ps

# Test the health endpoint
curl http://localhost:3000/health
```

### 4.3 View logs

```bash
# All services
docker compose logs -f

# API only
docker compose logs -f api
```

### 4.4 Stop services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

---

## Phase 5: Domain & HTTPS

### 5.1 Point your domain to the EC2 instance

- In your DNS provider (Route 53, Cloudflare, etc.), create an **A record** pointing to your EC2 public IP.

### 5.2 Install Nginx as a reverse proxy

```bash
sudo yum install -y nginx
sudo systemctl enable nginx
```

### 5.3 Configure Nginx

```bash
sudo tee /etc/nginx/conf.d/familycart.conf > /dev/null << 'NGINX'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
```

Replace `your-domain.com` with your actual domain.

```bash
sudo nginx -t
sudo systemctl start nginx
```

### 5.4 Install SSL with Certbot

```bash
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Follow the prompts. Certbot will auto-configure HTTPS and set up auto-renewal.

### 5.5 Remove port 3000 from Security Group

Once Nginx is working, remove port `3000` from your EC2 security group — all traffic should go through ports 80/443.

---

## Phase 6: Database Backups

### 6.1 Create a backup directory

```bash
sudo mkdir -p /backups
sudo chown $USER:$USER /backups
```

### 6.2 Manual backup

```bash
docker exec familycart-postgres pg_dump -U familycart familycart | gzip > /backups/db_$(date +%F).sql.gz
```

### 6.3 Automated daily backups via cron

```bash
crontab -e
```

Add this line (runs daily at 3 AM):

```
0 3 * * * docker exec familycart-postgres pg_dump -U familycart familycart | gzip > /backups/db_$(date +\%F).sql.gz
```

### 6.4 Restore from backup

```bash
gunzip -c /backups/db_2026-03-25.sql.gz | docker exec -i familycart-postgres psql -U familycart familycart
```

### 6.5 (Recommended) Migrate to AWS RDS

For production workloads, consider using **AWS RDS for PostgreSQL** instead of running Postgres in Docker. Benefits:
- Automated backups and point-in-time recovery
- Multi-AZ failover
- Managed patches and updates

Update `DATABASE_URL` in `.env` to point to your RDS endpoint.

---

## Phase 7: Mobile App Configuration

1. Update the API base URL in your mobile app to `https://your-domain.com`
2. Rebuild the mobile app with the production endpoint
3. Test all features against the production API
4. Submit to App Store / Google Play when ready

---

## Phase 8: Monitoring & Observability

### 8.1 Sentry (error tracking)

1. Create a project at https://sentry.io
2. Set `SENTRY_DSN` in your `.env` file
3. Restart the API: `docker compose restart api`

### 8.2 CloudWatch (AWS metrics)

1. Install the CloudWatch agent on EC2 for CPU, memory, and disk monitoring
2. Set up alarms for high CPU (> 80%) and low disk space (< 20%)

### 8.3 Uptime monitoring

Use a free service like UptimeRobot to monitor `https://your-domain.com/health` and get alerted on downtime.

---

## Deploying Updates

When you push new code:

```bash
ssh -i familycart-server.pem ec2-user@<your-ec2-public-ip>
cd familycart
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Zero-downtime deploy (optional)

```bash
# Rebuild without stopping the running containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml build api
# Replace the API container (Postgres and Redis stay up)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps api
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` | Start all services |
| `docker compose ps` | Check service status |
| `docker compose logs -f api` | Tail API logs |
| `docker compose restart api` | Restart API only |
| `docker compose -f docker-compose.yml -f docker-compose.prod.yml down` | Stop all services |
| `curl http://localhost:3000/health` | Health check |

## Checklist

- [ ] AWS account + CLI configured
- [ ] EC2 instance launched
- [ ] Docker installed on server
- [ ] Code cloned on server
- [ ] `.env` file configured with real secrets
- [ ] `docker compose up` running and healthy
- [ ] Domain DNS pointing to EC2
- [ ] Nginx reverse proxy configured
- [ ] HTTPS via Certbot
- [ ] Database backups configured
- [ ] Mobile app pointing to production URL
- [ ] Sentry error tracking enabled
- [ ] Uptime monitoring active