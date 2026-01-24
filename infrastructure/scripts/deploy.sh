#!/bin/bash
set -e

echo "🚀 AI Course Platform - Deployment Script"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables from .env file
if [ -f "infrastructure/ansible/.env" ]; then
    echo -e "${GREEN}Loading environment variables from infrastructure/ansible/.env${NC}"
    set -a
    source infrastructure/ansible/.env
    set +a
else
    echo -e "${YELLOW}⚠️  No .env file found at infrastructure/ansible/.env${NC}"
    echo -e "${YELLOW}Creating example .env file...${NC}"
    cat > infrastructure/ansible/.env.example << 'EOF'
# Server configuration
APP_SERVER_IP=
GIT_REPO_URL=
GIT_BRANCH=main
DOMAIN_NAME=staging.example.com

# AWS Configuration
AWS_REGION=us-east-2
S3_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_PUBLIC_URL=

# Redis
REDIS_HOST=localhost

# API Keys
NOTEBOOKLM_API_KEY=
SORA_API_KEY=
HEYGEN_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
CHATBOT_PROVIDER=openai
EOF
    echo -e "${RED}Please create infrastructure/ansible/.env from .env.example${NC}"
fi

# Check if required tools are installed
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"

    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}❌ Terraform not installed${NC}"
        exit 1
    fi

    if ! command -v ansible &> /dev/null; then
        echo -e "${RED}❌ Ansible not installed${NC}"
        exit 1
    fi

    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not installed${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Setup Terraform
setup_terraform() {
    echo -e "${YELLOW}Setting up Terraform...${NC}"
    cd infrastructure/terraform

    if [ ! -f "terraform.tfvars" ]; then
        echo -e "${YELLOW}Creating terraform.tfvars from example...${NC}"
        cp terraform.tfvars.example terraform.tfvars
        echo -e "${RED}⚠️  Please edit terraform.tfvars with your values${NC}"
        exit 1
    fi

    terraform init
    echo -e "${GREEN}✅ Terraform initialized${NC}"
    cd ../..
}

# Deploy infrastructure
deploy_infrastructure() {
    echo -e "${YELLOW}Deploying infrastructure...${NC}"
    cd infrastructure/terraform

    terraform plan -out=tfplan

    read -p "Apply this plan? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled"
        exit 0
    fi

    terraform apply tfplan

    # Export outputs
    export APP_SERVER_IP=$(terraform output -raw app_server_public_ip)
    export REDIS_HOST=$(terraform output -raw redis_endpoint)
    export S3_BUCKET_NAME=$(terraform output -raw s3_bucket_name)
    export S3_PUBLIC_URL="https://$(terraform output -raw s3_bucket_name).s3.amazonaws.com"

    echo -e "${GREEN}✅ Infrastructure deployed${NC}"
    echo "App Server IP: $APP_SERVER_IP"
    echo "Redis Host: $REDIS_HOST"
    echo "S3 Bucket: $S3_BUCKET_NAME"

    cd ../..
}

# Deploy application
deploy_application() {
    echo -e "${YELLOW}Deploying application with Ansible...${NC}"

    # Check if environment variables are set
    if [ -z "$APP_SERVER_IP" ]; then
        echo -e "${RED}❌ APP_SERVER_IP not set${NC}"
        exit 1
    fi

    if [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${RED}❌ OPENAI_API_KEY not set. Please export API keys.${NC}"
        exit 1
    fi

    cd infrastructure/ansible

    # Setup server first time
    echo -e "${YELLOW}Running initial server setup...${NC}"
    ansible-playbook playbooks/setup-server.yml

    # Deploy application
    echo -e "${YELLOW}Deploying application...${NC}"
    ansible-playbook playbooks/deploy.yml

    echo -e "${GREEN}✅ Application deployed${NC}"
    cd ../..
}

# Health check
health_check() {
    echo -e "${YELLOW}Running health check...${NC}"

    if [ -z "$APP_SERVER_IP" ]; then
        cd infrastructure/terraform
        APP_SERVER_IP=$(terraform output -raw app_server_public_ip)
        cd ../..
    fi

    sleep 5

    if curl -f "http://$APP_SERVER_IP/api/health" &> /dev/null; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
        echo "Access your app at: http://$APP_SERVER_IP"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        echo "Check logs: ssh ubuntu@$APP_SERVER_IP 'pm2 logs'"
        exit 1
    fi
}

# Main deployment flow
main() {
    case "${1:-all}" in
        check)
            check_requirements
            ;;
        infra)
            check_requirements
            setup_terraform
            deploy_infrastructure
            ;;
        app)
            check_requirements
            deploy_application
            health_check
            ;;
        all)
            check_requirements
            setup_terraform
            deploy_infrastructure
            deploy_application
            health_check
            ;;
        *)
            echo "Usage: $0 {check|infra|app|all}"
            echo "  check - Check requirements"
            echo "  infra - Deploy infrastructure only"
            echo "  app   - Deploy application only"
            echo "  all   - Full deployment (default)"
            exit 1
            ;;
    esac
}

main "$@"
