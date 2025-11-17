#!/bin/bash

# ==============================================================================
# Deploy WebSocket API to AWS Lambda
# ==============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGE="${1:-prod}"
REGION="${AWS_REGION:-ap-southeast-1}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  WebSocket Serverless Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Stage: ${STAGE}"
echo "Region: ${REGION}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI${NC}"
    exit 1
fi

if ! command -v serverless &> /dev/null; then
    echo -e "${RED}❌ Serverless Framework not found${NC}"
    echo "Installing Serverless Framework..."
    npm install -g serverless@3
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Check AWS credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account: ${AWS_ACCOUNT}${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --production=false
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Validate serverless.yml
echo -e "${YELLOW}Validating serverless.yml...${NC}"
if ! serverless print --stage ${STAGE} > /dev/null 2>&1; then
    echo -e "${RED}❌ Invalid serverless.yml configuration${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Configuration valid${NC}"
echo ""

# Package first (dry run)
echo -e "${YELLOW}Packaging application...${NC}"
if ! serverless package --stage ${STAGE}; then
    echo -e "${RED}❌ Packaging failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Package created${NC}"
echo ""

# Deploy
echo -e "${YELLOW}Deploying to AWS...${NC}"
echo "This may take 3-5 minutes..."
echo ""

if serverless deploy --stage ${STAGE} --verbose; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ Deployment Successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    # Get deployment info
    echo -e "${YELLOW}Fetching deployment information...${NC}"
    INFO=$(serverless info --stage ${STAGE})

    # Extract WebSocket URL
    WEBSOCKET_URL=$(echo "$INFO" | grep "websocket:" | awk '{print $2}')

    if [ -n "$WEBSOCKET_URL" ]; then
        echo ""
        echo -e "${GREEN}📡 WebSocket URL:${NC}"
        echo "$WEBSOCKET_URL"
        echo ""

        # Update .env file
        ENV_FILE="../.env"
        if [ -f "$ENV_FILE" ]; then
            echo -e "${YELLOW}Updating .env file...${NC}"

            # Backup original
            cp "$ENV_FILE" "${ENV_FILE}.backup"

            # Remove old WEBSOCKET_API_ENDPOINT if exists
            sed -i '/WEBSOCKET_API_ENDPOINT=/d' "$ENV_FILE"

            # Add new one
            echo "WEBSOCKET_API_ENDPOINT=${WEBSOCKET_URL}" >> "$ENV_FILE"

            echo -e "${GREEN}✅ .env updated${NC}"
            echo -e "${YELLOW}Backup saved to: ${ENV_FILE}.backup${NC}"
        fi
    fi

    # Show table info
    TABLE_NAME="landinghub-websocket-connections-${STAGE}"
    echo ""
    echo -e "${GREEN}📊 DynamoDB Table:${NC}"
    echo "$TABLE_NAME"

    # Verify table exists
    if aws dynamodb describe-table --table-name "$TABLE_NAME" --region ${REGION} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Table exists and ready${NC}"
    else
        echo -e "${RED}❌ Table not found${NC}"
    fi

    echo ""
    echo -e "${GREEN}Next Steps:${NC}"
    echo "1. Copy WebSocket URL to frontend .env:"
    echo "   REACT_APP_WEBSOCKET_URL=${WEBSOCKET_URL}"
    echo ""
    echo "2. Restart backend server to apply changes"
    echo ""
    echo "3. Test connection:"
    echo "   node scripts/test-websocket.js"
    echo ""

else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ❌ Deployment Failed${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo "Check the error messages above for details"
    echo ""
    echo "Common issues:"
    echo "- AWS credentials not configured"
    echo "- Insufficient IAM permissions"
    echo "- CloudFormation stack limit reached"
    echo "- Invalid serverless.yml configuration"
    echo ""
    exit 1
fi

# Show logs command
echo -e "${YELLOW}View logs:${NC}"
echo "serverless logs -f websocketConnect --tail --stage ${STAGE}"
echo "serverless logs -f websocketDefault --tail --stage ${STAGE}"
echo ""

# Show rollback command
echo -e "${YELLOW}Rollback (if needed):${NC}"
echo "serverless deploy list --stage ${STAGE}"
echo "serverless rollback --timestamp TIMESTAMP --stage ${STAGE}"
echo ""

exit 0
