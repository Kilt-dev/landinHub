#!/bin/bash

# Deploy Backend to AWS Lambda
# Usage: ./deploy-backend.sh

set -e

echo "========================================="
echo "🚀 Deploying LandingHub Backend to AWS Lambda"
echo "========================================="

# Load environment variables
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "   Please create .env file with all required variables"
  exit 1
fi

export $(cat .env | grep -v '^#' | xargs)

echo "🔧 Configuration:"
echo "   Region: $AWS_REGION"
echo "   Stage: prod"
echo ""

# Step 1: Install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production=false

echo "✅ Dependencies installed!"
echo ""

# Step 2: Deploy with Serverless Framework
echo "🚀 Deploying to AWS Lambda..."
npx serverless deploy --stage prod --verbose

echo "✅ Backend deployment completed!"
echo ""

# Get API Gateway URL
API_URL=$(npx serverless info --stage prod | grep "ANY" | head -1 | awk '{print $3}' | sed 's/\/ANY//')

echo "========================================="
echo "✨ Deployment completed successfully!"
echo "========================================="
echo ""
echo "📡 API Gateway URL:"
echo "   $API_URL"
echo ""
echo "🔗 Next Steps:"
echo "   1. Setup custom domain for API (api.landinghub.shop)"
echo "   2. Update frontend REACT_APP_API_URL to point to custom domain"
echo "   3. Test API endpoints"
echo ""
