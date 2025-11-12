# Backend API Implementation Guide

Hướng dẫn implement các API endpoints cho deployment system.

## 📋 Overview

Backend chịu trách nhiệm hoàn toàn cho deployment process. Frontend chỉ gọi **1 endpoint duy nhất**: `POST /api/deployment/:pageId/deploy`

Backend sẽ xử lý tất cả:
- Build HTML từ landing page JSON
- Upload lên S3
- Tạo CloudFront distribution
- Cấu hình Route 53 (nếu custom domain)
- Request SSL certificate qua ACM
- Invalidate cache

---

## 🔐 Environment Variables (.env)

```bash
# AWS Credentials (Server-side only!)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-southeast-1

# S3 Configuration
AWS_S3_BUCKET=landing-hub-pages
AWS_S3_REGION=ap-southeast-1

# CloudFront
AWS_CLOUDFRONT_PRICE_CLASS=PriceClass_100  # US, Europe
# AWS_CLOUDFRONT_PRICE_CLASS=PriceClass_All  # All edge locations

# Route 53
AWS_ROUTE53_HOSTED_ZONE_ID=Z1234567890ABC
AWS_ROUTE53_BASE_DOMAIN=landinghub.app  # For auto-generated subdomains

# ACM Certificate (for *.landinghub.app wildcard)
AWS_ACM_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012

# Database
MONGODB_URI=mongodb://localhost:27017/landing-hub

# JWT
JWT_SECRET=your-secret-key
```

---

## 🚀 API Endpoints

### 1. Deploy Landing Page

**Endpoint:** `POST /api/deployment/:pageId/deploy`

**Description:** Main deployment endpoint. Xử lý toàn bộ deployment process.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "customDomain": "landing.mydomain.com",  // optional
  "subdomain": "my-landing"                // optional, default: page slug
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://my-landing.landinghub.app",
  "cloudFrontDomain": "d1234abcdef.cloudfront.net",
  "distributionId": "E1234ABCD5678",
  "status": "deployed",
  "deployedAt": "2025-01-15T10:30:00Z"
}
```

**Implementation:**

```javascript
// routes/deployment.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const AWS = require('aws-sdk');
const Page = require('../models/Page');
const Deployment = require('../models/Deployment');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const cloudfront = new AWS.CloudFront({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const route53 = new AWS.Route53({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const acm = new AWS.ACM({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1' // ACM for CloudFront must be in us-east-1
});

router.post('/:pageId/deploy', auth, async (req, res) => {
  try {
    const { pageId } = req.params;
    const { customDomain, subdomain } = req.body;
    const userId = req.user._id;

    // 1. Get page data
    const page = await Page.findOne({ _id: pageId, owner: userId });
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // 2. Build HTML
    const html = await buildHTML(page);

    // 3. Generate domain
    const domain = customDomain || `${subdomain || page.slug}.${process.env.AWS_ROUTE53_BASE_DOMAIN}`;

    // 4. Upload to S3
    const s3Key = `pages/${pageId}/index.html`;
    await s3.putObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: html,
      ContentType: 'text/html',
      CacheControl: 'max-age=300' // 5 minutes
    }).promise();

    // 5. Create or update CloudFront distribution
    let distribution = await findOrCreateDistribution(pageId, domain);

    // 6. Configure custom domain in Route 53 (if needed)
    if (customDomain || !subdomain) {
      await configureDNS(domain, distribution.DomainName);
    }

    // 7. Invalidate CloudFront cache
    await cloudfront.createInvalidation({
      DistributionId: distribution.Id,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: 1,
          Items: ['/*']
        }
      }
    }).promise();

    // 8. Save deployment info
    const deployment = await Deployment.findOneAndUpdate(
      { pageId },
      {
        pageId,
        userId,
        url: `https://${domain}`,
        cloudFrontDomain: distribution.DomainName,
        distributionId: distribution.Id,
        customDomain: customDomain || null,
        subdomain: subdomain || page.slug,
        status: 'deployed',
        deployedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      url: `https://${domain}`,
      cloudFrontDomain: distribution.DomainName,
      distributionId: distribution.Id,
      status: 'deployed',
      deployedAt: deployment.deployedAt
    });

  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({
      message: 'Deployment failed',
      error: error.message
    });
  }
});

module.exports = router;
```

---

### 2. Get Deployment Info

**Endpoint:** `GET /api/deployment/:pageId`

**Description:** Lấy thông tin deployment hiện tại

**Response:**
```json
{
  "status": "deployed",
  "url": "https://my-landing.landinghub.app",
  "cloudFrontDomain": "d1234abcdef.cloudfront.net",
  "distributionId": "E1234ABCD5678",
  "customDomain": null,
  "subdomain": "my-landing",
  "deployedAt": "2025-01-15T10:30:00Z"
}
```

**Implementation:**

```javascript
router.get('/:pageId', auth, async (req, res) => {
  try {
    const { pageId } = req.params;
    const userId = req.user._id;

    const deployment = await Deployment.findOne({ pageId, userId });

    if (!deployment) {
      return res.status(404).json({ message: 'No deployment found' });
    }

    res.json(deployment);

  } catch (error) {
    console.error('Error fetching deployment:', error);
    res.status(500).json({ message: 'Failed to fetch deployment' });
  }
});
```

---

## 🛠️ Helper Functions

### Build HTML from Page JSON

```javascript
// utils/buildHTML.js
const buildHTML = async (page) => {
  const { elements, styles, settings } = page;

  // Convert elements JSON to HTML
  const bodyHTML = renderElements(elements);

  // Generate CSS
  const css = generateCSS(styles);

  // Build complete HTML
  const html = `
<!DOCTYPE html>
<html lang="${settings?.language || 'vi'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${settings?.description || ''}">
  <title>${settings?.title || page.name}</title>
  <style>${css}</style>
  ${settings?.customCSS ? `<style>${settings.customCSS}</style>` : ''}
</head>
<body>
  ${bodyHTML}
  ${settings?.customJS ? `<script>${settings.customJS}</script>` : ''}

  <!-- Form Submission Handler -->
  <script>
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
          await fetch('${process.env.API_URL}/api/forms/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              page_id: '${page._id}',
              form_data: data,
              metadata: {
                device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
                user_agent: navigator.userAgent,
                referrer: document.referrer
              }
            })
          });

          alert('${page.settings?.successMessage || 'Cảm ơn bạn!'}');
          e.target.reset();
        } catch (error) {
          alert('${page.settings?.errorMessage || 'Có lỗi xảy ra'}');
        }
      });
    });
  </script>
</body>
</html>
  `.trim();

  return html;
};

const renderElements = (elements) => {
  return elements.map(el => {
    // Convert JSON to HTML based on element type
    switch (el.type) {
      case 'text':
        return `<p>${el.componentData.content}</p>`;
      case 'heading':
        return `<h${el.componentData.level || 1}>${el.componentData.content}</h${el.componentData.level || 1}>`;
      case 'button':
        return `<button>${el.componentData.content}</button>`;
      case 'form':
        return renderForm(el);
      // ... more element types
      default:
        return '';
    }
  }).join('');
};

const renderForm = (formElement) => {
  const fields = formElement.componentData.fields || [];

  return `
    <form>
      ${fields.map(field => {
        switch (field.type) {
          case 'text':
          case 'email':
          case 'tel':
            return `<input type="${field.type}" name="${field.label}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>`;
          case 'textarea':
            return `<textarea name="${field.label}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}></textarea>`;
          case 'select':
            return `
              <select name="${field.label}" ${field.required ? 'required' : ''}>
                ${field.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
              </select>
            `;
          default:
            return '';
        }
      }).join('')}
      <button type="submit">${formElement.componentData.buttonText || 'Submit'}</button>
    </form>
  `;
};

module.exports = { buildHTML };
```

### Find or Create CloudFront Distribution

```javascript
// utils/cloudfront.js
const findOrCreateDistribution = async (pageId, domain) => {
  // Check if distribution exists
  const existingDeployment = await Deployment.findOne({ pageId });

  if (existingDeployment && existingDeployment.distributionId) {
    // Get existing distribution
    const distribution = await cloudfront.getDistribution({
      Id: existingDeployment.distributionId
    }).promise();

    return distribution.Distribution;
  }

  // Create new distribution
  const params = {
    DistributionConfig: {
      CallerReference: `${pageId}-${Date.now()}`,
      Comment: `Landing page: ${pageId}`,
      Enabled: true,
      Origins: {
        Quantity: 1,
        Items: [{
          Id: 'S3-landing-hub',
          DomainName: `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com`,
          S3OriginConfig: {
            OriginAccessIdentity: ''
          }
        }]
      },
      DefaultCacheBehavior: {
        TargetOriginId: 'S3-landing-hub',
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 2,
          Items: ['GET', 'HEAD']
        },
        ForwardedValues: {
          QueryString: false,
          Cookies: { Forward: 'none' }
        },
        MinTTL: 0,
        DefaultTTL: 300,
        MaxTTL: 86400
      },
      Aliases: {
        Quantity: 1,
        Items: [domain]
      },
      ViewerCertificate: {
        ACMCertificateArn: process.env.AWS_ACM_CERTIFICATE_ARN,
        SSLSupportMethod: 'sni-only',
        MinimumProtocolVersion: 'TLSv1.2_2021'
      },
      PriceClass: process.env.AWS_CLOUDFRONT_PRICE_CLASS || 'PriceClass_100'
    }
  };

  const result = await cloudfront.createDistribution(params).promise();
  return result.Distribution;
};
```

### Configure DNS in Route 53

```javascript
// utils/route53.js
const configureDNS = async (domain, cloudfrontDomain) => {
  const params = {
    HostedZoneId: process.env.AWS_ROUTE53_HOSTED_ZONE_ID,
    ChangeBatch: {
      Changes: [{
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: domain,
          Type: 'A',
          AliasTarget: {
            HostedZoneId: 'Z2FDTNDATAQYW2', // CloudFront hosted zone ID
            DNSName: cloudfrontDomain,
            EvaluateTargetHealth: false
          }
        }
      }]
    }
  };

  await route53.changeResourceRecordSets(params).promise();
};
```

---

## 📊 Database Models

### Deployment Model

```javascript
// models/Deployment.js
const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  pageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  cloudFrontDomain: {
    type: String,
    required: true
  },
  distributionId: {
    type: String,
    required: true
  },
  customDomain: {
    type: String,
    default: null
  },
  subdomain: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['deploying', 'deployed', 'failed'],
    default: 'deploying'
  },
  deployedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Deployment', deploymentSchema);
```

---

## 🔒 Security Best Practices

1. **Never expose AWS credentials to frontend**
   - Store in .env file
   - Use environment variables
   - Add .env to .gitignore

2. **Validate user ownership**
   - Check user owns the page before deployment
   - Use JWT authentication

3. **Rate limiting**
   - Limit deployments per user (e.g., 10/hour)
   - Prevent abuse

4. **Input validation**
   - Validate domain format
   - Sanitize subdomain (only alphanumeric + hyphen)

5. **Error handling**
   - Don't expose AWS errors to frontend
   - Log errors server-side

---

## 🚦 Error Handling

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // AWS specific errors
  if (err.code === 'NoSuchBucket') {
    return res.status(500).json({ message: 'Storage configuration error' });
  }

  if (err.code === 'InvalidClientTokenId') {
    return res.status(500).json({ message: 'Authentication error' });
  }

  // Generic error
  res.status(500).json({
    message: 'Deployment failed',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
};

module.exports = errorHandler;
```

---

## 📝 Testing

```javascript
// test/deployment.test.js
const request = require('supertest');
const app = require('../app');

describe('Deployment API', () => {
  let token;
  let pageId;

  beforeAll(async () => {
    // Login and get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    token = res.body.token;
  });

  test('Deploy with auto subdomain', async () => {
    const res = await request(app)
      .post(`/api/deployment/${pageId}/deploy`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/\.landinghub\.app$/);
    expect(res.body.status).toBe('deployed');
  });

  test('Deploy with custom subdomain', async () => {
    const res = await request(app)
      .post(`/api/deployment/${pageId}/deploy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ subdomain: 'my-test-landing' });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://my-test-landing.landinghub.app');
  });

  test('Deploy with custom domain', async () => {
    const res = await request(app)
      .post(`/api/deployment/${pageId}/deploy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ customDomain: 'landing.mydomain.com' });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://landing.mydomain.com');
  });
});
```

---

## 🎯 Next Steps

1. Implement các helper functions
2. Setup AWS credentials trong .env
3. Tạo Deployment model trong MongoDB
4. Test API endpoints
5. Setup monitoring & logging
6. Configure CloudWatch alarms

---

Made with ❤️ by Landing Hub Team
