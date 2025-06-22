# Test Documents for Document Processing

This folder contains sample tax documents for testing the document processing system.

## 📋 **Available Test Documents**

### **W-2 Forms**
- `sample-w2-2023.pdf` - Standard W-2 with typical wage information
- `sample-w2-multiple-jobs.pdf` - W-2 with multiple employer scenarios

### **1099 Forms**
- `sample-1099-int.pdf` - Interest income form
- `sample-1099-div.pdf` - Dividend income form

### **Other Tax Forms**
- `sample-1040.pdf` - Individual tax return form
- `sample-schedule-k1.pdf` - Partnership/S-Corp income form

## 🔧 **How to Use for Testing**

1. **Upload Test Documents**:
   - Navigate to `/documents/processing`
   - Select one of these sample documents
   - Choose the appropriate form type
   - Click "Process Documents"

2. **Expected Results**:
   - **Without Google Cloud**: You'll see a configuration error message
   - **With Google Cloud**: Document will be processed and fields extracted

3. **Testing Scenarios**:
   - **High Confidence**: Clean, clear documents should auto-approve
   - **Low Confidence**: Blurry or unclear documents should require review
   - **Error Handling**: Invalid files should show appropriate errors

## 📊 **Sample Data in Test Documents**

### **Sample W-2 Data**:
```
Employee: John Doe
SSN: 123-45-6789
Employer: ABC Company Inc.
EIN: 12-3456789
Wages (Box 1): $65,000.00
Federal Tax Withheld (Box 2): $9,750.00
Social Security Wages (Box 3): $65,000.00
Social Security Tax (Box 4): $4,030.00
Medicare Wages (Box 5): $65,000.00
Medicare Tax (Box 6): $942.50
```

### **Sample 1099-INT Data**:
```
Payer: First National Bank
Recipient: Jane Smith
TIN: 987-65-4321
Interest Income (Box 1): $1,250.00
Federal Tax Withheld (Box 4): $125.00
```

## 🎯 **Testing Checklist**

- [ ] Upload W-2 document
- [ ] Verify form type detection
- [ ] Check field extraction accuracy
- [ ] Test confidence scoring
- [ ] Review workflow functionality
- [ ] Auto-fill form generation
- [ ] Error handling for invalid files

## 📝 **Notes**

- These are fictional documents created for testing purposes only
- All SSNs, EINs, and personal information are fake
- Use these documents to verify system functionality before processing real tax documents
- Always test with various document qualities (clear, blurry, skewed) to verify OCR accuracy
