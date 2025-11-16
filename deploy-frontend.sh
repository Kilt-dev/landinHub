#!/bin/bash

# Deploy Frontend to S3 + CloudFront
# Usage: ./deploy-frontend.sh

set -e

echo "========================================="
echo "🚀 Deploying LandingHub Frontend to AWS"
echo "========================================="

# Load environment variables
source .env 2>/dev/null || true

# Configuration
S3_BUCKET="${AWS_S3_BUCKET:-landinghub-iconic}"
CLOUDFRONT_DISTRIBUTION_ID="${AWS_CLOUDFRONT_DISTRIBUTION_ID:-E3E6ZTC75HGQKN}"
FRONTEND_DIR="./apps/web"
BUILD_DIR="$FRONTEND_DIR/build"

echo "📦 S3 Bucket: $S3_BUCKET"
echo "☁️  CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo ""

# Step 1: Build frontend
echo "🔨 Building React app..."
cd $FRONTEND_DIR

# Update environment variables for production
cat > .env.production << EOF
REACT_APP_API_URL=https://api.landinghub.shop
REACT_APP_AWS_REGION=$AWS_REGION
GENERATE_SOURCEMAP=false
EOF

npm install
npm run build

cd ../..

echo "✅ Build completed!"
echo ""

# Step 2: Upload to S3
echo "📤 Uploading to S3..."

# Upload all files with appropriate cache headers
aws s3 sync $BUILD_DIR s3://$S3_BUCKET \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --exclude "service-worker.js" \
  --exclude "asset-manifest.json"

# Upload index.html without cache (for fresh updates)
aws s3 cp $BUILD_DIR/index.html s3://$S3_BUCKET/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

# Upload service worker without cache
if [ -f "$BUILD_DIR/service-worker.js" ]; then
  aws s3 cp $BUILD_DIR/service-worker.js s3://$S3_BUCKET/service-worker.js \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "application/javascript"
fi

# Upload asset-manifest without cache
if [ -f "$BUILD_DIR/asset-manifest.json" ]; then
  aws s3 cp $BUILD_DIR/asset-manifest.json s3://$S3_BUCKET/asset-manifest.json \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "application/json"
fi

echo "✅ Upload to S3 completed!"
echo ""

# Step 3: Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
echo ""

echo "========================================="
echo "✨ Deployment completed successfully!"
echo "========================================="
echo ""
echo "🌐 Your app is now live at:"
echo "   - CloudFront: https://$AWS_CLOUDFRONT_DOMAIN"
echo "   - Custom Domain: https://landinghub.shop"
echo ""
echo "⏳ CloudFront invalidation in progress..."
echo "   You can check status with:"
echo "   aws cloudfront get-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --id $INVALIDATION_ID"
echo ""
