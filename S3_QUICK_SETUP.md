# 🚀 Quick S3 Setup for Student Document Access

## 🎯 **Goal**

Enable students to access documents uploaded by teachers to S3.

## ⚡ **Quick Setup (Choose One)**

### **Option A: AWS Access Keys (Recommended for Development)**

1. **Get AWS Credentials:**

   - Go to: https://console.aws.amazon.com/
   - Navigate: IAM → Users → Your User → Security credentials
   - Create new access key
   - Copy Access Key ID and Secret Access Key

2. **Set Environment Variables:**

   ```powershell
   $env:USE_IAM_ROLE="false"
   $env:AWS_ACCESS_KEY_ID="your_access_key_here"
   $env:AWS_SECRET_ACCESS_KEY="your_secret_key_here"
   $env:AWS_REGION="us-east-1"
   $env:S3_BUCKET_NAME="visionware-lecture-courses"
   ```

3. **Run Setup Script:**
   ```bash
   python setup_aws_access_keys.py
   ```

### **Option B: IAM Role (For Production/EC2)**

1. **Set Environment Variables:**

   ```powershell
   $env:USE_IAM_ROLE="true"
   $env:AWS_REGION="us-east-1"
   $env:S3_BUCKET_NAME="visionware-lecture-courses"
   ```

2. **Run Setup Script:**
   ```bash
   python setup_iam_role.py
   ```

## 🔧 **Required IAM Permissions**

Your AWS user/role needs these S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::visionware-lecture-courses",
        "arn:aws:s3:::visionware-lecture-courses/*"
      ]
    }
  ]
}
```

## 🧪 **Test the Setup**

1. **Run the test script:**

   ```bash
   python quick_s3_test.py
   ```

2. **Expected Success Output:**
   ```
   ✅ Backend is running
   ✅ Teacher login successful
   ✅ Document upload successful
   ✅ Student login successful
   ✅ Download URL generated
   ✅ File download successful
   🎉 SUCCESS: Students can access S3 documents!
   ```

## 🔍 **Troubleshooting**

### **Issue: "No AWS credentials found"**

- **Solution:** Set environment variables correctly
- **Check:** Run `echo $env:AWS_ACCESS_KEY_ID` to verify

### **Issue: "Bucket does not exist"**

- **Solution:** Create bucket `visionware-lecture-courses` in AWS S3
- **Region:** us-east-1

### **Issue: "Access denied"**

- **Solution:** Check IAM user has S3 permissions
- **Verify:** User can access the bucket in AWS Console

### **Issue: "Upload failed: 404"**

- **Solution:** Restart backend after setting environment variables
- **Check:** Backend logs for routing issues

## 🎉 **Success Indicators**

✅ **Teachers can upload documents to S3**
✅ **Students can download documents from S3**
✅ **Pre-signed URLs work correctly**
✅ **File downloads complete successfully**

## 📋 **Next Steps**

1. **Restart backend** to pick up new environment variables
2. **Test in frontend** by uploading and downloading documents
3. **Verify student access** to teacher documents
4. **Monitor S3 usage** in AWS Console

---

**Remember:** Never commit AWS credentials to version control!

## 🎯 **Goal**

Enable students to access documents uploaded by teachers to S3.

## ⚡ **Quick Setup (Choose One)**

### **Option A: AWS Access Keys (Recommended for Development)**

1. **Get AWS Credentials:**

   - Go to: https://console.aws.amazon.com/
   - Navigate: IAM → Users → Your User → Security credentials
   - Create new access key
   - Copy Access Key ID and Secret Access Key

2. **Set Environment Variables:**

   ```powershell
   $env:USE_IAM_ROLE="false"
   $env:AWS_ACCESS_KEY_ID="your_access_key_here"
   $env:AWS_SECRET_ACCESS_KEY="your_secret_key_here"
   $env:AWS_REGION="us-east-1"
   $env:S3_BUCKET_NAME="visionware-lecture-courses"
   ```

3. **Run Setup Script:**
   ```bash
   python setup_aws_access_keys.py
   ```

### **Option B: IAM Role (For Production/EC2)**

1. **Set Environment Variables:**

   ```powershell
   $env:USE_IAM_ROLE="true"
   $env:AWS_REGION="us-east-1"
   $env:S3_BUCKET_NAME="visionware-lecture-courses"
   ```

2. **Run Setup Script:**
   ```bash
   python setup_iam_role.py
   ```

## 🔧 **Required IAM Permissions**

Your AWS user/role needs these S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::visionware-lecture-courses",
        "arn:aws:s3:::visionware-lecture-courses/*"
      ]
    }
  ]
}
```

## 🧪 **Test the Setup**

1. **Run the test script:**

   ```bash
   python quick_s3_test.py
   ```

2. **Expected Success Output:**
   ```
   ✅ Backend is running
   ✅ Teacher login successful
   ✅ Document upload successful
   ✅ Student login successful
   ✅ Download URL generated
   ✅ File download successful
   🎉 SUCCESS: Students can access S3 documents!
   ```

## 🔍 **Troubleshooting**

### **Issue: "No AWS credentials found"**

- **Solution:** Set environment variables correctly
- **Check:** Run `echo $env:AWS_ACCESS_KEY_ID` to verify

### **Issue: "Bucket does not exist"**

- **Solution:** Create bucket `visionware-lecture-courses` in AWS S3
- **Region:** us-east-1

### **Issue: "Access denied"**

- **Solution:** Check IAM user has S3 permissions
- **Verify:** User can access the bucket in AWS Console

### **Issue: "Upload failed: 404"**

- **Solution:** Restart backend after setting environment variables
- **Check:** Backend logs for routing issues

## 🎉 **Success Indicators**

✅ **Teachers can upload documents to S3**
✅ **Students can download documents from S3**
✅ **Pre-signed URLs work correctly**
✅ **File downloads complete successfully**

## 📋 **Next Steps**

1. **Restart backend** to pick up new environment variables
2. **Test in frontend** by uploading and downloading documents
3. **Verify student access** to teacher documents
4. **Monitor S3 usage** in AWS Console

---

**Remember:** Never commit AWS credentials to version control!
