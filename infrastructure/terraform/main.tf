terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "ai-course-platform-tf-state-staging"
    key    = "staging/terraform.tfstate"
    region = "us-east-2"
    # Uncomment after creating the bucket
    # dynamodb_table = "ai-course-platform-terraform-locks"
    # encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# Security Group for Application Server (uses default VPC)
resource "aws_security_group" "app_server" {
  name        = "${var.project_name}-${var.environment}-app-sg"
  description = "Security group for application server"

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Application Port
  ingress {
    description = "Application"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress - Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-sg"
    Environment = var.environment
  }
}

# Security Group for Redis (uses default VPC) - COMMENTED OUT DUE TO IAM PERMISSIONS
# resource "aws_security_group" "redis" {
#   name        = "${var.project_name}-${var.environment}-redis-sg"
#   description = "Security group for Redis"
#
#   ingress {
#     description     = "Redis from app server"
#     from_port       = 6379
#     to_port         = 6379
#     protocol        = "tcp"
#     security_groups = [aws_security_group.app_server.id]
#   }
#
#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }
#
#   tags = {
#     Name        = "${var.project_name}-${var.environment}-redis-sg"
#     Environment = var.environment
#   }
# }

# Key Pair
resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-${var.environment}-key"
  public_key = file(var.public_key_path)

  tags = {
    Name        = "${var.project_name}-${var.environment}-key"
    Environment = var.environment
  }
}

# EC2 Instance for Application
resource "aws_instance" "app_server" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.deployer.key_name
  associate_public_ip_address = true

  vpc_security_group_ids = [aws_security_group.app_server.id]

  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y python3 python3-pip
              EOF

  tags = {
    Name        = "${var.project_name}-${var.environment}-app"
    Environment = var.environment
    Role        = "application"
  }
}

data "aws_vpc" "default" {
  default = true
}

# ElastiCache Redis - COMMENTED OUT DUE TO IAM PERMISSIONS
# Uncomment when you have ElastiCache permissions or install Redis on EC2
# data "aws_subnets" "default" {
#   filter {
#     name   = "vpc-id"
#     values = [data.aws_vpc.default.id]
#   }
# }
#
# resource "aws_elasticache_subnet_group" "redis" {
#   name       = "${var.project_name}-${var.environment}-redis-subnet"
#   subnet_ids = data.aws_subnets.default.ids
#
#   tags = {
#     Name        = "${var.project_name}-${var.environment}-redis-subnet"
#     Environment = var.environment
#   }
# }
#
# resource "aws_elasticache_cluster" "redis" {
#   cluster_id           = "${var.project_name}-${var.environment}-redis"
#   engine               = "redis"
#   node_type            = var.redis_node_type
#   num_cache_nodes      = 1
#   parameter_group_name = "default.redis7"
#   engine_version       = "7.1"
#   port                 = 6379
#   security_group_ids   = [aws_security_group.redis.id]
#   subnet_group_name    = aws_elasticache_subnet_group.redis.name
#
#   tags = {
#     Name        = "${var.project_name}-${var.environment}-redis"
#     Environment = var.environment
#   }
# }


# S3 Bucket for uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project_name}-${var.environment}-uploads"

  tags = {
    Name        = "${var.project_name}-${var.environment}-uploads"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# IAM Role for EC2 to access S3 - COMMENTED OUT DUE TO IAM PERMISSIONS
# Uncomment when you need S3 access from EC2 or use AWS credentials in .env instead
# resource "aws_iam_role" "app_server" {
#   name = "${var.project_name}-${var.environment}-app-role"
#
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = "ec2.amazonaws.com"
#         }
#       }
#     ]
#   })
#
#   tags = {
#     Name        = "${var.project_name}-${var.environment}-app-role"
#     Environment = var.environment
#   }
# }
#
# resource "aws_iam_role_policy" "s3_access" {
#   name = "${var.project_name}-${var.environment}-s3-policy"
#   role = aws_iam_role.app_server.id
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "s3:PutObject",
#           "s3:GetObject",
#           "s3:DeleteObject",
#           "s3:ListBucket"
#         ]
#         Resource = [
#           aws_s3_bucket.uploads.arn,
#           "${aws_s3_bucket.uploads.arn}/*"
#         ]
#       }
#     ]
#   })
# }
#
# resource "aws_iam_instance_profile" "app_server" {
#   name = "${var.project_name}-${var.environment}-app-profile"
#   role = aws_iam_role.app_server.name
# }

