#!/bin/bash

# AWS Deployment Script for Bybit Analyzer
# This script builds and deploys your app to AWS ECS

set -e

# Configuration
REGION="eu-north-1"
ECR_REPO="bybit-analyzer"
CLUSTER_NAME="bybit-analyzer-cluster"
SERVICE_NAME="bybit-analyzer-service"
TASK_DEFINITION="deploy/task-definition.json"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "🚀 Deploying Bybit Analyzer to AWS..."
echo "Account ID: ${ACCOUNT_ID}"
echo "ECR URI: ${ECR_URI}"

# Build Docker image
echo "📦 Building Docker image..."
docker build -t ${ECR_REPO}:latest .

# Tag image for ECR
echo "🏷️ Tagging image for ECR..."
docker tag ${ECR_REPO}:latest ${ECR_URI}/${ECR_REPO}:latest

# Push to ECR
echo "⬆️ Pushing image to ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URI}
docker push ${ECR_URI}/${ECR_REPO}:latest

# Update task definition with correct account ID
echo "📝 Updating task definition..."
sed -i.bak "s/ACCOUNT_ID/${ACCOUNT_ID}/g" ${TASK_DEFINITION}

# Register new task definition
echo "📋 Registering task definition..."
TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://${TASK_DEFINITION} \
    --region ${REGION} \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo "✅ Task definition registered: ${TASK_DEFINITION_ARN}"

# Update service (create if doesn't exist)
echo "🔄 Updating ECS service..."
if aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${REGION} --query 'services[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
    echo "📝 Updating existing service..."
    aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${SERVICE_NAME} \
        --task-definition ${TASK_DEFINITION_ARN} \
        --region ${REGION}
else
    echo "🆕 Creating new service..."
    aws ecs create-service \
        --cluster ${CLUSTER_NAME} \
        --service-name ${SERVICE_NAME} \
        --task-definition ${TASK_DEFINITION_ARN} \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[subnet-017063fe73d8c7dfa,subnet-0a4a7c7cd80b0c5d9,subnet-0e9b280512aa1366b],securityGroups=[sg-079299ba5c228ab30],assignPublicIp=ENABLED}" \
        --region ${REGION}
fi

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
    --cluster ${CLUSTER_NAME} \
    --services ${SERVICE_NAME} \image.png
    --region ${REGION}

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your app should be available at:"
echo "   http://YOUR_LOAD_BALANCER_DNS"
echo ""
echo "📊 Monitor your deployment:"
echo "   https://console.aws.amazon.com/ecs/home?region=${REGION}#/clusters/${CLUSTER_NAME}/services/${SERVICE_NAME}"

# Restore original task definition file
mv ${TASK_DEFINITION}.bak ${TASK_DEFINITION} 2>/dev/null || true 