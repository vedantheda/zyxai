# Google Document AI Setup Guide

This guide walks you through setting up Google Document AI for tax document processing in Neuronize.

## Prerequisites

1. Google Cloud Platform account
2. Billing enabled on your GCP project
3. Document AI API enabled

## Step 1: Enable Document AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services > Library**
4. Search for "Document AI API"
5. Click **Enable**

## Step 2: Create Service Account

1. Go to **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Name: `ep-document-ai`
4. Description: `Service account for E.P document processing`
5. Click **Create and Continue**
6. Add role: **Document AI API User**
7. Click **Continue** and **Done**

## Step 3: Generate Service Account Key

1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key > Create new key**
4. Select **JSON** format
5. Download the key file
6. Store it securely in your project (e.g., `config/google-service-account.json`)
7. Add the path to your `.env` file:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./config/google-service-account.json
   ```

## Step 4: Create Document Processors

### W-2 Processor (Specialized)
1. Go to **Document AI > Processors**
2. Click **Create Processor**
3. Select **W-2 Parser** from the list
4. Name: `ep-w2-processor`
5. Region: `us` (or your preferred region)
6. Click **Create**
7. Copy the **Processor ID** and add to `.env`:
   ```
   GOOGLE_DOCUMENTAI_W2_PROCESSOR_ID=your-w2-processor-id
   ```

### Form Parser (General)
1. Click **Create Processor** again
2. Select **Form Parser** from the list
3. Name: `ep-form-processor`
4. Region: `us` (same as W-2 processor)
5. Click **Create**
6. Copy the **Processor ID** and add to `.env`:
   ```
   GOOGLE_DOCUMENTAI_FORM_PROCESSOR_ID=your-form-processor-id
   ```

## Step 5: Configure Environment Variables

Update your `.env` file with the following:

```env
# Google Document AI Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us
GOOGLE_APPLICATION_CREDENTIALS=./config/google-service-account.json

# Processor IDs
GOOGLE_DOCUMENTAI_W2_PROCESSOR_ID=your-w2-processor-id
GOOGLE_DOCUMENTAI_FORM_PROCESSOR_ID=your-form-processor-id
```

## Step 6: Install Dependencies

```bash
npm install @google-cloud/documentai
```

## Step 7: Test the Setup

1. Navigate to `/documents/processing` in your application
2. Upload a sample W-2 or 1099 form
3. Select the appropriate form type
4. Click "Process Documents"
5. Verify that the document is processed and fields are extracted

## Pricing Information

### Document AI Pricing (as of 2024)
- **W-2 Parser**: $0.30 per document
- **Form Parser**: $30 per 1,000 pages (first 1M pages), $20 per 1,000 pages (1M+ pages)
- **Invoice Parser**: $0.10 per 10 pages
- **Bank Statement Parser**: $0.10 per document

### Monthly Cost Estimates
- **Small Practice** (500 docs/month): ~$66/month
- **Medium Practice** (2,500 docs/month): ~$330/month
- **Large Practice** (5,000+ docs/month): ~$660/month

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Verify service account key path is correct
   - Ensure service account has Document AI API User role
   - Check that GOOGLE_APPLICATION_CREDENTIALS points to valid JSON file

2. **Processor Not Found**
   - Verify processor IDs are correct
   - Ensure processors are in the same region as specified in GOOGLE_CLOUD_LOCATION
   - Check that processors are enabled and active

3. **API Not Enabled**
   - Go to APIs & Services > Library
   - Search for "Document AI API"
   - Ensure it's enabled for your project

4. **Billing Issues**
   - Verify billing is enabled on your GCP project
   - Check billing account has valid payment method
   - Review quotas and limits in GCP Console

### Testing with Sample Documents

You can test with these sample tax forms:
- [IRS Sample W-2](https://www.irs.gov/pub/irs-pdf/fw2.pdf)
- [IRS Sample 1099-INT](https://www.irs.gov/pub/irs-pdf/f1099int.pdf)

### Support

For Google Document AI specific issues:
- [Google Cloud Support](https://cloud.google.com/support)
- [Document AI Documentation](https://cloud.google.com/document-ai/docs)
- [Pricing Calculator](https://cloud.google.com/products/calculator)

## Security Best Practices

1. **Never commit service account keys to version control**
2. **Use environment variables for all sensitive configuration**
3. **Regularly rotate service account keys**
4. **Monitor API usage and set up billing alerts**
5. **Use least privilege principle for service account roles**

## Next Steps

After setup is complete:
1. Test with various document types and qualities
2. Monitor processing accuracy and adjust confidence thresholds
3. Set up automated testing with sample documents
4. Configure monitoring and alerting for API usage
5. Implement batch processing for high-volume scenarios
