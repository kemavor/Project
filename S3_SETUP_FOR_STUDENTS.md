# 🔧 S3 Setup for Student Document Access

## 🎯 **Problem**

Students cannot access documents uploaded by teachers to S3 because AWS credentials are not configured.

## ✅ **Solution**

Configure AWS S3 credentials to enable proper document access for students.

---

## 📋 **Step-by-Step Setup**

### **Step 1: Get AWS Credentials**

1. **Go to AWS Console**: https://console.aws.amazon.com/
2. **Navigate to IAM**: Services → IAM → Users
3. **Select/Create User**: Choose your user or create a new one
4. **Security Credentials**: Click "Security credentials" tab
5. **Create Access Key**: Click "Create access key"
6. **Copy Credentials**: Save the Access Key ID and Secret Access Key

### **Step 2: Set Environment Variables**

**For Windows PowerShell:**

```powershell
$env:USE_IAM_ROLE="false"
$env:AWS_ACCESS_KEY_ID="your_actual_access_key_here"
$env:AWS_SECRET_ACCESS_KEY="your_actual_secret_key_here"
$env:AWS_REGION="us-east-1"
$env:S3_BUCKET_NAME="visionware-documents"
```

**For Windows Command Prompt:**

```cmd
set USE_IAM_ROLE=false
set AWS_ACCESS_KEY_ID=your_actual_access_key_here
set AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here
set AWS_REGION=us-east-1
set S3_BUCKET_NAME=visionware-documents
```

**For Linux/Mac:**

```bash
export USE_IAM_ROLE=false
export AWS_ACCESS_KEY_ID=your_actual_access_key_here
export AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here
export AWS_REGION=us-east-1
export S3_BUCKET_NAME=visionware-documents
```

### **Step 3: Create S3 Bucket**

1. **Go to S3 Console**: https://console.aws.amazon.com/s3/
2. **Create Bucket**: Click "Create bucket"
3. **Bucket Name**: Use `visionware-documents` (or your preferred name)
4. **Region**: Choose `us-east-1` (or your preferred region)
5. **Settings**: Keep defaults for now
6. **Create**: Click "Create bucket"

### **Step 4: Configure Bucket Permissions**

1. **Select Bucket**: Click on your bucket name
2. **Permissions Tab**: Click "Permissions"
3. **Block Public Access**: Keep "Block all public access" checked
4. **Bucket Policy**: Add this policy (replace `your-bucket-name`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowVisionWareApp",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_USERNAME"
      },
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### **Step 5: Test the Configuration**

Run the test script:

```bash
python test_s3_student_access.py
```

---

## 🔍 **Troubleshooting**

### **Issue 1: "AWS credentials not configured"**

**Solution**: Set the environment variables correctly

```powershell
$env:AWS_ACCESS_KEY_ID="your_key"
$env:AWS_SECRET_ACCESS_KEY="your_secret"
```

### **Issue 2: "S3 upload failed"**

**Solution**: Check bucket permissions and credentials

1. Verify bucket exists
2. Check IAM user has S3 permissions
3. Ensure credentials are correct

### **Issue 3: "Student cannot access documents"**

**Solution**: Check enrollment and document permissions

1. Ensure student is enrolled in course
2. Verify document is marked as public or student has access
3. Check course enrollment status

### **Issue 4: "Download URL generation failed"**

**Solution**: Check S3 bucket configuration

1. Verify bucket name matches environment variable
2. Check bucket region matches AWS_REGION
3. Ensure bucket permissions allow pre-signed URLs

---

## 🛡️ **Security Best Practices**

### **For Development:**

- ✅ Use environment variables (not hardcoded)
- ✅ Use IAM user with minimal permissions
- ✅ Keep credentials secure

### **For Production:**

- ✅ Use IAM roles (not access keys)
- ✅ Implement proper CORS policies
- ✅ Use CloudFront for CDN
- ✅ Enable bucket encryption
- ✅ Set up proper logging

---

## 📊 **Expected Test Results**

When properly configured, you should see:

```
🧪 S3 Configuration Test
============================================================
✅ Backend is running
✅ API endpoints are accessible

🧪 Teacher Workflow
============================================================
📋 Step 1: Teacher uploading document to S3
✅ Document upload successful
   Document ID: 123
   Title: S3 Test Document
   S3 URL: https://visionware-documents.s3.us-east-1.amazonaws.com/...

🧪 Student Workflow
============================================================
📋 Step 2: Student accessing uploaded document
✅ Download URL generated successfully
   URL: https://visionware-documents.s3.us-east-1.amazonaws.com/...
   Filename: test_document.pdf
   Expires in: 3600 seconds

⬇️ Testing file download...
✅ File download successful
   Content-Type: application/pdf
   Content-Length: 297

🎉 SUCCESS: Student can access teacher's S3 document!
```

---

## 🚀 **Next Steps**

1. **Set environment variables** using the commands above
2. **Create S3 bucket** if not exists
3. **Run test script** to verify configuration
4. **Restart backend** to pick up new environment variables
5. **Test in frontend** by uploading and downloading documents

---

## 📞 **Support**

If you encounter issues:

1. Check the test script output for specific errors
2. Verify AWS credentials are correct
3. Ensure S3 bucket exists and is accessible
4. Check that students are properly enrolled in courses

**Remember**: Never commit AWS credentials to version control!

## 🎯 **Problem**

Students cannot access documents uploaded by teachers to S3 because AWS credentials are not configured.

## ✅ **Solution**

Configure AWS S3 credentials to enable proper document access for students.

---

## 📋 **Step-by-Step Setup**

### **Step 1: Get AWS Credentials**

1. **Go to AWS Console**: https://console.aws.amazon.com/
2. **Navigate to IAM**: Services → IAM → Users
3. **Select/Create User**: Choose your user or create a new one
4. **Security Credentials**: Click "Security credentials" tab
5. **Create Access Key**: Click "Create access key"
6. **Copy Credentials**: Save the Access Key ID and Secret Access Key

### **Step 2: Set Environment Variables**

**For Windows PowerShell:**

```powershell
$env:USE_IAM_ROLE="false"
$env:AWS_ACCESS_KEY_ID="your_actual_access_key_here"
$env:AWS_SECRET_ACCESS_KEY="your_actual_secret_key_here"
$env:AWS_REGION="us-east-1"
$env:S3_BUCKET_NAME="visionware-documents"
```

**For Windows Command Prompt:**

```cmd
set USE_IAM_ROLE=false
set AWS_ACCESS_KEY_ID=your_actual_access_key_here
set AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here
set AWS_REGION=us-east-1
set S3_BUCKET_NAME=visionware-documents
```

**For Linux/Mac:**

```bash
export USE_IAM_ROLE=false
export AWS_ACCESS_KEY_ID=your_actual_access_key_here
export AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here
export AWS_REGION=us-east-1
export S3_BUCKET_NAME=visionware-documents
```

### **Step 3: Create S3 Bucket**

1. **Go to S3 Console**: https://console.aws.amazon.com/s3/
2. **Create Bucket**: Click "Create bucket"
3. **Bucket Name**: Use `visionware-documents` (or your preferred name)
4. **Region**: Choose `us-east-1` (or your preferred region)
5. **Settings**: Keep defaults for now
6. **Create**: Click "Create bucket"

### **Step 4: Configure Bucket Permissions**

1. **Select Bucket**: Click on your bucket name
2. **Permissions Tab**: Click "Permissions"
3. **Block Public Access**: Keep "Block all public access" checked
4. **Bucket Policy**: Add this policy (replace `your-bucket-name`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowVisionWareApp",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_USERNAME"
      },
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### **Step 5: Test the Configuration**

Run the test script:

```bash
python test_s3_student_access.py
```

---

## 🔍 **Troubleshooting**

### **Issue 1: "AWS credentials not configured"**

**Solution**: Set the environment variables correctly

```powershell
$env:AWS_ACCESS_KEY_ID="your_key"
$env:AWS_SECRET_ACCESS_KEY="your_secret"
```

### **Issue 2: "S3 upload failed"**

**Solution**: Check bucket permissions and credentials

1. Verify bucket exists
2. Check IAM user has S3 permissions
3. Ensure credentials are correct

### **Issue 3: "Student cannot access documents"**

**Solution**: Check enrollment and document permissions

1. Ensure student is enrolled in course
2. Verify document is marked as public or student has access
3. Check course enrollment status

### **Issue 4: "Download URL generation failed"**

**Solution**: Check S3 bucket configuration

1. Verify bucket name matches environment variable
2. Check bucket region matches AWS_REGION
3. Ensure bucket permissions allow pre-signed URLs

---

## 🛡️ **Security Best Practices**

### **For Development:**

- ✅ Use environment variables (not hardcoded)
- ✅ Use IAM user with minimal permissions
- ✅ Keep credentials secure

### **For Production:**

- ✅ Use IAM roles (not access keys)
- ✅ Implement proper CORS policies
- ✅ Use CloudFront for CDN
- ✅ Enable bucket encryption
- ✅ Set up proper logging

---

## 📊 **Expected Test Results**

When properly configured, you should see:

```
🧪 S3 Configuration Test
============================================================
✅ Backend is running
✅ API endpoints are accessible

🧪 Teacher Workflow
============================================================
📋 Step 1: Teacher uploading document to S3
✅ Document upload successful
   Document ID: 123
   Title: S3 Test Document
   S3 URL: https://visionware-documents.s3.us-east-1.amazonaws.com/...

🧪 Student Workflow
============================================================
📋 Step 2: Student accessing uploaded document
✅ Download URL generated successfully
   URL: https://visionware-documents.s3.us-east-1.amazonaws.com/...
   Filename: test_document.pdf
   Expires in: 3600 seconds

⬇️ Testing file download...
✅ File download successful
   Content-Type: application/pdf
   Content-Length: 297

🎉 SUCCESS: Student can access teacher's S3 document!
```

---

## 🚀 **Next Steps**

1. **Set environment variables** using the commands above
2. **Create S3 bucket** if not exists
3. **Run test script** to verify configuration
4. **Restart backend** to pick up new environment variables
5. **Test in frontend** by uploading and downloading documents

---

## 📞 **Support**

If you encounter issues:

1. Check the test script output for specific errors
2. Verify AWS credentials are correct
3. Ensure S3 bucket exists and is accessible
4. Check that students are properly enrolled in courses

**Remember**: Never commit AWS credentials to version control!
