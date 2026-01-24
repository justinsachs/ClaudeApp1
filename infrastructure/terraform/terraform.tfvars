# Copy this file to terraform.tfvars and fill in your values

aws_region       = "us-east-2"
environment      = "staging"
project_name     = "ai-course-platform"
instance_type    = "t4g.micro"         # AWS Free Tier eligible
allowed_ssh_cidr = ["3.221.151.60/32"] # Change to your IP address
redis_node_type  = "cache.t4g.micro"   # AWS Free Tier eligible

