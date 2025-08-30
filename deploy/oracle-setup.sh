#!/bin/bash

# Oracle Cloud Infrastructure (OCI) Setup Script for Bybit Analyzer
# This script helps set up OCI infrastructure for your app

set -e

echo "🚀 Setting up Oracle Cloud Infrastructure for Bybit Analyzer..."

# Check if OCI CLI is installed
if ! command -v oci &> /dev/null; then
    echo "❌ OCI CLI is not installed. Installing now..."
    echo "📥 Downloading OCI CLI installer..."
    
    # Download and install OCI CLI
    bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
    
    echo "✅ OCI CLI installed successfully!"
    echo "🔧 Please run 'oci setup config' to configure your credentials"
    echo "   You'll need:"
    echo "   - Tenancy OCID"
    echo "   - User OCID" 
    echo "   - Region"
    echo "   - API Key (will be generated)"
    exit 0
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Set default values (you can modify these)
REGION="us-ashburn-1"
COMPARTMENT_ID=$(oci iam compartment list --query 'data[0].id' --raw-output 2>/dev/null || echo "")
AVAILABILITY_DOMAIN=$(oci iam availability-domain list --query 'data[0].name' --raw-output 2>/dev/null || echo "")

if [ -z "$COMPARTMENT_ID" ]; then
    echo "❌ Unable to get compartment ID. Please run 'oci setup config' first"
    exit 1
fi

echo "🏗️ Using compartment: $COMPARTMENT_ID"
echo "🌍 Using region: $REGION"
echo "🏢 Using availability domain: $AVAILABILITY_DOMAIN"

# Create VCN (Virtual Cloud Network)
echo "🌐 Creating Virtual Cloud Network..."
VCN_ID=$(oci network vcn create \
    --compartment-id $COMPARTMENT_ID \
    --cidr-block "10.0.0.0/16" \
    --display-name "bybit-analyzer-vcn" \
    --dns-label "bybitvcn" \
    --query 'data.id' \
    --raw-output 2>/dev/null || \
    oci network vcn list \
    --compartment-id $COMPARTMENT_ID \
    --display-name "bybit-analyzer-vcn" \
    --query 'data[0].id' \
    --raw-output)

echo "✅ VCN created/found: $VCN_ID"

# Create Internet Gateway
echo "🌍 Creating Internet Gateway..."
IGW_ID=$(oci network internet-gateway create \
    --compartment-id $COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "bybit-analyzer-igw" \
    --is-enabled true \
    --query 'data.id' \
    --raw-output 2>/dev/null || \
    oci network internet-gateway list \
    --compartment-id $COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --query 'data[0].id' \
    --raw-output)

echo "✅ Internet Gateway created/found: $IGW_ID"

# Create Route Table
echo "🗺️ Creating Route Table..."
RT_ID=$(oci network route-table create \
    --compartment-id $COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "bybit-analyzer-rt" \
    --route-rules '[{"destination": "0.0.0.0/0", "destinationType": "CIDR_BLOCK", "networkEntityId": "'$IGW_ID'"}]' \
    --query 'data.id' \
    --raw-output 2>/dev/null || \
    oci network route-table list \
    --compartment-id $COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "bybit-analyzer-rt" \
    --query 'data[0].id' \
    --raw-output)

echo "✅ Route Table created/found: $RT_ID"

# Create Security List
echo "🔒 Creating Security List..."
SL_ID=$(oci network security-list create \
    --compartment-id $COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "bybit-analyzer-sl" \
    --ingress-security-rules '[
        {
            "protocol": "6",
            "source": "0.0.0.0/0",
            "tcpOptions": {
                "destinationPortRange": {
                    "min": 3000,
                    "max": 3000
                }
            }
        },
        {
            "protocol": "6", 
            "source": "0.0.0.0/0",
            "tcpOptions": {
                "destinationPortRange": {
                    "min": 22,
                    "max": 22
                }
            }
        },
        {
            "protocol": "6",
            "source": "0.0.0.0/0", 
            "tcpOptions": {
                "destinationPortRange": {
                    "min": 80,
                    "max": 80
                }
            }
        },
        {
            "protocol": "6",
            "source": "0.0.0.0/0",
            "tcpOptions": {
                "destinationPortRange": {
                    "min": 443,
                    "max": 443
                }
            }
        }
    ]' \
    --egress-security-rules '[
        {
            "protocol": "all",
            "destination": "0.0.0.0/0"
        }
    ]' \
    --query 'data.id' \
    --raw-output 2>/dev/null || \
    oci network security-list list \
    --compartment-id $COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "bybit-analyzer-sl" \
    --query 'data[0].id' \
    --raw-output)

echo "✅ Security List created/found: $SL_ID"

# Create Subnet
echo "🏠 Creating Subnet..."
SUBNET_ID=$(oci network subnet create \
    --compartment-id $COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --cidr-block "10.0.1.0/24" \
    --display-name "bybit-analyzer-subnet" \
    --dns-label "bybitsubnet" \
    --route-table-id $RT_ID \
    --security-list-ids '["'$SL_ID'"]' \
    --availability-domain $AVAILABILITY_DOMAIN \
    --query 'data.id' \
    --raw-output 2>/dev/null || \
    oci network subnet list \
    --compartment-id $COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "bybit-analyzer-subnet" \
    --query 'data[0].id' \
    --raw-output)

echo "✅ Subnet created/found: $SUBNET_ID"

# Create Container Registry Repository
echo "📦 Creating Container Registry Repository..."
oci artifacts container repository create \
    --compartment-id $COMPARTMENT_ID \
    --display-name "bybit-analyzer" \
    --is-public false 2>/dev/null || echo "Repository already exists"

echo "✅ Container Registry Repository created/found"

echo ""
echo "🎉 Oracle Cloud Infrastructure setup complete!"
echo ""
echo "📋 Infrastructure Details:"
echo "   VCN ID: $VCN_ID"
echo "   Subnet ID: $SUBNET_ID"
echo "   Security List ID: $SL_ID"
echo "   Region: $REGION"
echo "   Compartment ID: $COMPARTMENT_ID"
echo ""
echo "📋 Next steps:"
echo "1. Create a compute instance: ./deploy/oracle-deploy.sh"
echo "2. Set up environment variables on the instance"
echo "3. Deploy your application using Docker"
echo ""
echo "💡 Tip: Save these IDs for the deployment script!"