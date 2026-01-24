variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ai-course-platform"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.micro"
}

variable "ami_id" {
  description = "AMI ID for EC2 instance (Ubuntu 22.04 LTS ARM64 for t4g)"
  type        = string
  default     = "ami-0f3bb1aab2e14631f" # Ubuntu 22.04 LTS ARM64 in us-east-2
}

variable "root_volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 8
}

variable "public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa_js.pub"
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed to SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Change to your IP for security
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro"
}

