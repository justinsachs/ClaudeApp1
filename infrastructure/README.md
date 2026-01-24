# Infrastructure

This directory contains infrastructure as code (IaC) for deploying the AI Course Platform.

## Structure

```
infrastructure/
├── terraform/           # AWS infrastructure provisioning
│   ├── main.tf         # Main Terraform configuration
│   ├── variables.tf    # Input variables
│   ├── outputs.tf      # Output values
│   └── terraform.tfvars.example
├── ansible/            # Configuration management & deployment
│   ├── playbooks/      # Ansible playbooks
│   │   ├── deploy.yml
│   │   └── setup-server.yml
│   ├── templates/      # Jinja2 templates
│   │   ├── env.j2
│   │   └── nginx.j2
│   ├── inventory/      # Host inventories
│   │   └── staging.yml
│   └── ansible.cfg
├── scripts/            # Helper scripts
│   └── deploy.sh       # One-click deployment
└── DEPLOYMENT.md       # Detailed deployment guide
```

## Quick Deploy

```bash
# One-line deployment
./infrastructure/scripts/deploy.sh all

# Or step by step
./infrastructure/scripts/deploy.sh check  # Check requirements
./infrastructure/scripts/deploy.sh infra  # Deploy infrastructure
./infrastructure/scripts/deploy.sh app    # Deploy application
```

## What Gets Deployed

### Terraform Provisions:
- VPC with public subnet
- EC2 instance (t3.medium)
- ElastiCache Redis
- S3 bucket for uploads
- Security groups
- Elastic IP
- IAM roles

### Ansible Configures:
- Node.js 20
- PM2 process manager
- Nginx reverse proxy
- Firewall (UFW)
- SSL/TLS (optional)
- Application deployment

## Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

## CI/CD

GitHub Actions workflows:
- `.github/workflows/ci.yml` - Build & test
- `.github/workflows/terraform.yml` - Infrastructure changes
- `.github/workflows/deploy-staging.yml` - Application deployment
