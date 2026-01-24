output "app_server_public_ip" {
  description = "Public IP of the application server"
  value       = aws_instance.app_server.public_ip
}

output "app_server_private_ip" {
  description = "Private IP of the application server"
  value       = aws_instance.app_server.private_ip
}

# Redis outputs commented out - install Redis on EC2 instead
# output "redis_endpoint" {
#   description = "Redis endpoint"
#   value       = aws_elasticache_cluster.redis.cache_nodes[0].address
# }
#
# output "redis_port" {
#   description = "Redis port"
#   value       = aws_elasticache_cluster.redis.cache_nodes[0].port
# }

output "s3_bucket_name" {
  description = "S3 bucket name for uploads"
  value       = aws_s3_bucket.uploads.id
}

output "s3_bucket_url" {
  description = "S3 bucket URL"
  value       = "https://${aws_s3_bucket.uploads.bucket_regional_domain_name}"
}

output "vpc_id" {
  description = "Default VPC ID"
  value       = data.aws_vpc.default.id
}

output "ssh_command" {
  description = "SSH command to connect to app server"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.app_server.public_ip}"
}
