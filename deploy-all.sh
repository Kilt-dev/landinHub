#!/bin/bash

# Deploy All - Backend + Frontend
# Usage: ./deploy-all.sh

set -e

echo "========================================="
echo "🚀 Deploying LandingHub to AWS"
echo "========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "   Please create .env file with all required variables"
  echo "   See .env.example for reference"
  exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📋 Deployment Plan:"
echo "   1. Deploy Backend to AWS Lambda"
echo "   2. Setup API Custom Domain"
echo "   3. Deploy Frontend to S3 + CloudFront"
echo "   4. Configure DNS"
echo ""

read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

echo ""
echo "========================================="
echo "STEP 1: Deploying Backend"
echo "========================================="
./deploy-backend.sh

echo ""
echo "========================================="
echo "STEP 2: Deploying Frontend"
echo "========================================="
./deploy-frontend.sh

echo ""
echo "========================================="
echo "✨ Full Deployment Completed!"
echo "========================================="
echo ""
echo "🌐 Your Application URLs:"
echo "   Frontend: https://landinghub.shop"
echo "   API: https://api.landinghub.shop"
echo ""
echo "📝 Next Steps:"
echo "   1. Test frontend: curl -I https://landinghub.shop"
echo "   2. Test API: curl https://api.landinghub.shop/api/health"
echo "   3. Monitor logs: cd backend && npm run logs"
echo "   4. Setup monitoring alerts in CloudWatch"
echo ""
echo "💡 Useful Commands:"
echo "   - View Lambda logs: cd backend && npm run logs"
echo "   - Redeploy backend: ./deploy-backend.sh"
echo "   - Redeploy frontend: ./deploy-frontend.sh"
echo "   - Rollback: cd backend && serverless rollback -t [timestamp]"
echo ""
