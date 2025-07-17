# AWS Deployment Guide for Bybit Analyzer

This guide will help you deploy your Bybit Analyzer app to AWS instead of Vercel.

## 🚀 Quick Start

### Prerequisites

1. **AWS Account**: Create an AWS account if you don't have one
2. **AWS CLI**: Install and configure AWS CLI
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Configure AWS CLI
   aws configure
   ```
3. **Docker**: Install Docker Desktop
4. **IAM Permissions**: Ensure your AWS user has the necessary permissions

### Step 1: Set Up AWS Infrastructure

```bash
# Make scripts executable
chmod +x deploy/aws-setup.sh
chmod +x deploy/deploy.sh

# Run AWS setup
./deploy/aws-setup.sh
```

### Step 2: Configure Environment Variables

Store your secrets in AWS Systems Manager Parameter Store:

```bash
# Store your API keys securely
aws ssm put-parameter \
    --name "/bybit-analyzer/BYBIT_API_KEY" \
    --value "your_bybit_api_key" \
    --type "SecureString" \
    --region us-east-1

aws ssm put-parameter \
    --name "/bybit-analyzer/BYBIT_API_SECRET" \
    --value "your_bybit_api_secret" \
    --type "SecureString" \
    --region us-east-1

aws ssm put-parameter \
    --name "/bybit-analyzer/UPSTASH_REDIS_REST_URL" \
    --value "your_redis_url" \
    --type "SecureString" \
    --region us-east-1

aws ssm put-parameter \
    --name "/bybit-analyzer/UPSTASH_REDIS_REST_TOKEN" \
    --value "your_redis_token" \
    --type "SecureString" \
    --region us-east-1
```

### Step 3: Update Configuration

1. **Update subnet IDs**: Edit `deploy/aws-setup.sh` and `deploy/deploy.sh` with your actual VPC subnet IDs
2. **Update security groups**: Add your security group IDs in the deployment script

### Step 4: Deploy

```bash
# Deploy to AWS
./deploy/deploy.sh
```

## 🏗️ Architecture

Your app will be deployed using:

- **ECS Fargate**: Serverless container orchestration
- **ECR**: Container registry for Docker images
- **ElastiCache**: Managed Redis (optional, you can keep using Upstash)
- **Application Load Balancer**: Traffic distribution
- **CloudWatch**: Logging and monitoring

## 📊 Cost Optimization

### Estimated Monthly Costs (us-east-1)

- **ECS Fargate**: ~$15-30/month (512 CPU units, 1GB RAM)
- **ECR**: ~$1-5/month (storage and data transfer)
- **Application Load Balancer**: ~$20/month
- **CloudWatch**: ~$5-10/month
- **Data Transfer**: ~$5-15/month

**Total**: ~$46-80/month

### Cost Reduction Tips

1. **Use Spot Instances**: Can reduce costs by 60-90%
2. **Right-size containers**: Monitor usage and adjust CPU/memory
3. **Use CloudFront**: For static assets (reduces ALB costs)
4. **Schedule scaling**: Scale down during low-traffic hours

## 🔧 Configuration Options

### Environment Variables

All environment variables are stored securely in AWS Systems Manager Parameter Store:

- `BYBIT_API_KEY`: Your Bybit API key
- `BYBIT_API_SECRET`: Your Bybit API secret
- `UPSTASH_REDIS_REST_URL`: Redis connection URL
- `UPSTASH_REDIS_REST_TOKEN`: Redis authentication token

### Scaling Configuration

Edit `deploy/task-definition.json` to adjust:

- **CPU**: 256, 512, 1024, 2048, 4096 units
- **Memory**: 512MB to 30GB
- **Desired count**: Number of running instances

### Health Checks

The app includes health checks that monitor:
- Application responsiveness
- API endpoint availability
- Memory usage

## 🚨 Troubleshooting

### Common Issues

1. **Build fails**: Check Dockerfile and .dockerignore
2. **Deployment fails**: Verify AWS credentials and permissions
3. **App not accessible**: Check security groups and load balancer
4. **High costs**: Monitor CloudWatch metrics and optimize resources

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster bybit-analyzer-cluster --services bybit-analyzer-service

# View logs
aws logs tail /ecs/bybit-analyzer --follow

# Scale service
aws ecs update-service --cluster bybit-analyzer-cluster --service bybit-analyzer-service --desired-count 2

# Stop service
aws ecs update-service --cluster bybit-analyzer-cluster --service bybit-analyzer-service --desired-count 0
```

## 🔄 CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy to AWS
        run: ./deploy/deploy.sh
```

## 🔐 Security Best Practices

1. **Use IAM roles**: Don't hardcode AWS credentials
2. **Encrypt secrets**: Use AWS Systems Manager Parameter Store
3. **Network security**: Use VPC and security groups
4. **Regular updates**: Keep Docker images and dependencies updated
5. **Monitor access**: Use CloudTrail for audit logs

## 📈 Monitoring and Alerts

### CloudWatch Alarms

Set up alarms for:
- High CPU/memory usage
- Application errors
- Response time
- Cost thresholds

### Custom Metrics

Track business metrics like:
- API call volume
- User engagement
- Trading signal accuracy

## 🎯 Next Steps

After successful deployment:

1. **Set up monitoring**: Configure CloudWatch dashboards
2. **Add custom domain**: Use Route 53 and ACM
3. **Implement CI/CD**: Set up automated deployments
4. **Add AI features**: Integrate AWS AI services
5. **Optimize performance**: Use CloudFront and caching

## 💡 Alternative Deployment Options

### Google Cloud Platform (GCP)

- **Cloud Run**: Serverless containers
- **Cloud Build**: Automated builds
- **Cloud SQL**: Managed databases

### DigitalOcean

- **App Platform**: Simple container deployment
- **Managed Databases**: Redis and PostgreSQL
- **Load Balancers**: Traffic distribution

### Railway

- **Simple deployment**: Git-based deployment
- **Built-in monitoring**: Automatic health checks
- **Easy scaling**: One-click scaling 