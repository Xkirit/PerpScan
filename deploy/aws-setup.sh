#!/bin/bash

# AWS Deployment Setup Script for Bybit Analyzer
# This script helps set up AWS infrastructure for your app

set -e

echo "🚀 Setting up AWS infrastructure for Bybit Analyzer..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create ECR repository
echo "📦 Creating ECR repository..."
aws ecr create-repository --repository-name bybit-analyzer --region eu-north-1 || echo "Repository already exists"

# Get ECR login token
echo "🔐 Getting ECR login token..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.eu-nor.amazonaws.com

# Create ECS cluster
echo "🏗️ Creating ECS cluster..."               
aws ecs create-cluster --cluster-name bybit-analyzer-cluster --region eu-north-1 || echo "Cluster already exists"

# Create ElastiCache subnet group
echo "🗄️ Creating ElastiCache subnet group..."
aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name bybit-analyzer-cache-subnet \
    --cache-subnet-group-description "Subnet group for Bybit Analyzer Redis" \
    --subnet-ids subnet-12345678 subnet-87654321 \
    --region eu-north-1 || echo "Subnet group already exists"

echo "✅ AWS infrastructure setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update the subnet IDs in this script with your actual VPC subnets"
echo "2. Create a task definition file (deploy/task-definition.json)"
echo "3. Set up environment variables in AWS Systems Manager"
echo "4. Deploy using: ./deploy/deploy.sh" 