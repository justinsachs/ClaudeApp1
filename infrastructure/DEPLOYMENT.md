# Deployment Guide - AI Course Platform

This guide covers deploying the AI Course Platform to AWS EC2 using Terraform and Ansible.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Terraform** (>= 1.0)
4. **Ansible** (>= 2.10)
5. **SSH key pair** for EC2 access
6. **Domain name** (optional, for production)

## Quick Start

### 1. Prepare AWS Credentials

```bash
# Configure AWS CLI with profile
aws configure --profile YOUR_PROFILE_NAME

# Or use default profile
aws configure

# Or export credentials
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
export AWS_PROFILE="YOUR_PROFILE_NAME"  # if using named profile
```

### 2. Generate SSH Key Pair (if needed)

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
```

### 3. Setup Terraform Backend (First Time Only)

Create S3 bucket for Terraform state:

```bash
# If using a named profile, add --profile YOUR_PROFILE_NAME to each command
aws s3 mb s3://ai-course-platform-tf-state-staging --region us-east-1

aws s3api put-bucket-versioning \
  --bucket ai-course-platform-tf-state-staging \
  --versioning-configuration Status=Enabled
```

### 4. Provision Infrastructure with Terraform

```bash
cd infrastructure/terraform

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Edit with your values

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply
```

**Important Outputs:**
- `app_server_public_ip` - EC2 public IP
- `redis_endpoint` - Redis connection endpoint
- `s3_bucket_name` - S3 bucket for uploads
- `ssh_command` - Command to SSH into server

### 5. Setup Environment Variables

Create a `.env.staging` file with your secrets:

```bash
# Export environment variables for Ansible
export APP_SERVER_IP=$(terraform output -raw app_server_public_ip)
export REDIS_HOST=$(terraform output -raw redis_endpoint)
export S3_BUCKET_NAME=$(terraform output -raw s3_bucket_name)
export S3_PUBLIC_URL="https://$(terraform output -raw s3_bucket_name).s3.amazonaws.com"
export DOMAIN_NAME="staging.yourdomain.com"

# API Keys
export NOTEBOOKLM_API_KEY="your_key"
export SORA_API_KEY="your_key"
export HEYGEN_API_KEY="your_key"
export OPENAI_API_KEY="your_key"
export ANTHROPIC_API_KEY="your_key"

# Git repository (optional)
export GIT_REPO_URL="https://github.com/yourorg/ai-course-platform.git"
```

### 6. Initial Server Setup with Ansible

```bash
cd infrastructure/ansible

# Setup server (firewall, swap, security)
ansible-playbook playbooks/setup-server.yml

# Deploy application
ansible-playbook playbooks/deploy.yml
```

### 7. Verify Deployment

```bash
# Check application health
curl http://$(terraform output -raw app_server_public_ip)/api/health

# SSH into server
ssh ubuntu@$(terraform output -raw app_server_public_ip)

# Check PM2 status
pm2 status
pm2 logs ai-course-platform
```

## CI/CD with GitHub Actions

### Setup GitHub Secrets

Go to your repository → Settings → Secrets and Variables → Actions

Add the following secrets:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
SSH_PRIVATE_KEY              # Your private SSH key content
DOMAIN_NAME
NOTEBOOKLM_API_KEY
SORA_API_KEY
HEYGEN_API_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
```

### Workflows

Three workflows are configured:

1. **CI** (`.github/workflows/ci.yml`)
   - Runs on pull requests
   - Builds and tests code
   - Runs security audit

2. **Terraform** (`.github/workflows/terraform.yml`)
   - Manages infrastructure
   - Runs on infrastructure changes
   - Auto-applies on main branch

3. **Deploy to Staging** (`.github/workflows/deploy-staging.yml`)
   - Deploys application
   - Runs on push to main/staging
   - Executes Ansible playbooks

### Triggering Deployment

```bash
# Automatic deployment on push to main
git push origin main

# Manual deployment
gh workflow run deploy-staging.yml
```

## Manual Deployment

If you prefer to deploy without GitHub Actions:

```bash
# From your local machine
cd infrastructure/ansible

# Deploy using rsync (no git repo needed)
# The playbook will sync files from your local directory
ansible-playbook playbooks/deploy.yml
```

## SSL/HTTPS Setup

After initial deployment, enable SSL:

```bash
# SSH into server
ssh ubuntu@your-server-ip

# Install SSL certificate
sudo certbot --nginx -d yourdomain.com

# Update Nginx config
sudo nano /etc/nginx/sites-available/ai-course-platform
# Uncomment the HTTPS server block

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoring and Maintenance

### View Application Logs

```bash
# SSH into server
ssh ubuntu@your-server-ip

# PM2 logs
pm2 logs ai-course-platform

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Application

```bash
# Via SSH
pm2 restart ai-course-platform

# Or via Ansible
ansible-playbook playbooks/deploy.yml --tags restart
```

### Update Application

```bash
# Push code to main branch (auto-deploys via CI/CD)
git push origin main

# Or manually
cd infrastructure/ansible
ansible-playbook playbooks/deploy.yml
```

## Scaling and Optimization

### Vertical Scaling (Increase Instance Size)

```bash
cd infrastructure/terraform

# Edit terraform.tfvars
instance_type = "t3.large"  # Change from t3.medium

terraform apply
```

### Horizontal Scaling (Multiple Instances)

For production, consider:
- Application Load Balancer
- Auto Scaling Group
- RDS for database
- ElastiCache for Redis

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs ai-course-platform --lines 100

# Check Node.js version
node --version  # Should be 20.x

# Rebuild application
cd /var/www/ai-course-platform
npm run build
pm2 restart ai-course-platform
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Restart
sudo systemctl restart nginx
```

### Database Migration Issues

```bash
cd /var/www/ai-course-platform
npm run db:migrate
```

### Redis Connection Issues

```bash
# Check Redis endpoint from Terraform output
cd infrastructure/terraform
terraform output redis_endpoint

# Verify connectivity
redis-cli -h <redis-endpoint> ping
```

## Cleanup

To destroy all infrastructure:

```bash
cd infrastructure/terraform
terraform destroy
```

## Cost Estimation

Approximate monthly costs (us-east-1):
- EC2 t3.medium: ~$30
- ElastiCache t3.micro: ~$12
- S3 Storage: ~$0.023/GB
- Data Transfer: Variable
- **Total**: ~$45-60/month

## Security Best Practices

1. **Restrict SSH access** - Update `allowed_ssh_cidr` in terraform.tfvars
2. **Enable CloudWatch** - Monitor logs and metrics
3. **Regular updates** - Unattended upgrades are configured
4. **Backup database** - Setup automated S3 backups
5. **Use secrets manager** - Consider AWS Secrets Manager for API keys

## Support

For issues or questions:
- Check application logs: `pm2 logs`
- Review Nginx logs: `/var/log/nginx/`
- Verify environment variables: `cat /var/www/ai-course-platform/.env`

