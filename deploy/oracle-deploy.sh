#!/bin/bash

# Oracle Cloud Deployment Script for Bybit Analyzer
# This script creates a compute instance and deploys your app

set -e

echo "🚀 Deploying Bybit Analyzer to Oracle Cloud..."

# Configuration (update these with your actual values)
REGION="us-ashburn-1"
COMPARTMENT_ID=$(oci iam compartment list --query 'data[0].id' --raw-output 2>/dev/null)
AVAILABILITY_DOMAIN=$(oci iam availability-domain list --query 'data[0].name' --raw-output 2>/dev/null)

# Get subnet ID from previous setup
SUBNET_ID=$(oci network subnet list \
    --compartment-id $COMPARTMENT_ID \
    --display-name "bybit-analyzer-subnet" \
    --query 'data[0].id' \
    --raw-output 2>/dev/null)

if [ -z "$SUBNET_ID" ]; then
    echo "❌ Subnet not found. Please run ./deploy/oracle-setup.sh first"
    exit 1
fi

echo "✅ Using subnet: $SUBNET_ID"

# Generate SSH key pair if not exists
if [ ! -f ~/.ssh/oci_key ]; then
    echo "🔑 Generating SSH key pair..."
    ssh-keygen -t rsa -b 2048 -f ~/.ssh/oci_key -N ""
    chmod 600 ~/.ssh/oci_key
    chmod 644 ~/.ssh/oci_key.pub
fi

# Get the public key content
SSH_PUBLIC_KEY=$(cat ~/.ssh/oci_key.pub)

# Create user data script for automatic Docker installation and app deployment
USER_DATA=$(cat << 'EOF'
#!/bin/bash
yum update -y
yum install -y docker git

# Start Docker service
systemctl start docker
systemctl enable docker
usermod -a -G docker opc

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js (for potential debugging)
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Create app directory
mkdir -p /opt/bybit-analyzer
cd /opt/bybit-analyzer

# Create docker-compose.yml for production
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  app:
    image: bybit-analyzer:latest
    ports:
      - "3000:3000"
      - "80:3000"
    environment:
      - NODE_ENV=production
      - BYBIT_API_KEY=${BYBIT_API_KEY}
      - BYBIT_API_SECRET=${BYBIT_API_SECRET}
      - KV_REST_API_URL=${KV_REST_API_URL}
      - KV_REST_API_TOKEN=${KV_REST_API_TOKEN}
      - CANDLESTICK_CRON_SECRET=${CANDLESTICK_CRON_SECRET}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

volumes:
  redis_data:
COMPOSE_EOF

# Create environment file template
cat > .env.template << 'ENV_EOF'
# Copy this to .env and fill in your actual values
BYBIT_API_KEY=your_bybit_api_key_here
BYBIT_API_SECRET=your_bybit_api_secret_here
KV_REST_API_URL=your_upstash_redis_url_here
KV_REST_API_TOKEN=your_upstash_redis_token_here
CANDLESTICK_CRON_SECRET=your_secure_random_string_here
ENV_EOF

# Create deployment script
cat > deploy-app.sh << 'DEPLOY_EOF'
#!/bin/bash
echo "🚀 Deploying Bybit Analyzer..."

# Pull the latest image (you'll need to build and push this first)
# docker pull your-registry/bybit-analyzer:latest

# For now, we'll build locally
echo "📦 Building application..."
git clone https://github.com/yourusername/bybit-analyzer.git . 2>/dev/null || git pull
docker build -t bybit-analyzer:latest .

# Start the application
echo "▶️ Starting application..."
docker-compose up -d

echo "✅ Application deployed!"
echo "🌐 Your app should be available at: http://$(curl -s http://169.254.169.254/opc/v1/instance/networkInterfaces/0/publicIp)/"
echo "📊 Check status: docker-compose ps"
echo "📋 View logs: docker-compose logs -f"
DEPLOY_EOF

chmod +x deploy-app.sh

echo "✅ Setup complete! Next steps:"
echo "1. Copy your source code to this directory"
echo "2. Copy .env.template to .env and fill in your values" 
echo "3. Run ./deploy-app.sh to start the application"
EOF
)

# Base64 encode the user data
USER_DATA_B64=$(echo "$USER_DATA" | base64 -w 0)

# Get the latest Oracle Linux 8 image
IMAGE_ID=$(oci compute image list \
    --compartment-id $COMPARTMENT_ID \
    --operating-system "Oracle Linux" \
    --operating-system-version "8" \
    --shape "VM.Standard.E2.1.Micro" \
    --query 'data[0].id' \
    --raw-output)

echo "📷 Using image: $IMAGE_ID"

# Create compute instance
echo "💻 Creating compute instance..."
INSTANCE_ID=$(oci compute instance launch \
    --compartment-id $COMPARTMENT_ID \
    --availability-domain $AVAILABILITY_DOMAIN \
    --shape "VM.Standard.E2.1.Micro" \
    --image-id $IMAGE_ID \
    --subnet-id $SUBNET_ID \
    --display-name "bybit-analyzer-instance" \
    --user-data "$USER_DATA_B64" \
    --ssh-authorized-keys-file ~/.ssh/oci_key.pub \
    --wait-for-state RUNNING \
    --query 'data.id' \
    --raw-output)

echo "✅ Instance created: $INSTANCE_ID"

# Get the public IP
echo "🌐 Getting public IP address..."
sleep 30  # Wait for networking to be ready

PUBLIC_IP=$(oci compute instance list-vnics \
    --instance-id $INSTANCE_ID \
    --query 'data[0]."public-ip"' \
    --raw-output)

echo "✅ Instance deployed successfully!"
echo ""
echo "📊 Deployment Details:"
echo "   Instance ID: $INSTANCE_ID"
echo "   Public IP: $PUBLIC_IP"
echo "   SSH Command: ssh -i ~/.ssh/oci_key opc@$PUBLIC_IP"
echo ""
echo "🚀 Next Steps:"
echo "1. Wait 2-3 minutes for the instance to fully initialize"
echo "2. SSH into the instance: ssh -i ~/.ssh/oci_key opc@$PUBLIC_IP"
echo "3. Navigate to: cd /opt/bybit-analyzer"
echo "4. Copy .env.template to .env and fill in your environment variables"
echo "5. Run: ./deploy-app.sh"
echo ""
echo "🌐 Your app will be available at: http://$PUBLIC_IP"
echo "📋 Monitor your instance: https://cloud.oracle.com/compute/instances"
echo ""
echo "💡 Free Tier Limits:"
echo "   - 2 AMD instances (1/8 OCPU, 1GB RAM each)"
echo "   - 4 ARM instances (total 4 OCPUs, 24GB RAM)"
echo "   - 200GB Block Storage"
echo "   - Always Free as long as you stay within limits!"