# 🚀 S3 Setup Guide for VisionWare Development

## 🎯 **Priority 1: Local Development Environment Setup**

This guide will help you set up S3 access for local development so ECHO can access course content.

## 📋 **Quick Start Options**

### **Option A: Use AWS Access Keys (Recommended for Development)**

1. **Get AWS Access Keys:**

   - Go to [AWS Console](https://console.aws.amazon.com/)
   - Navigate to IAM > Users > Your User
   - Go to "Security credentials" tab
   - Create a new access key
   - Copy the Access Key ID and Secret Access Key

2. **Run the Setup Script:**

   ```bash
   cd fastapi-backend
   python setup_local_aws.py
   ```

   - Choose option 1 (AWS Access Keys)
   - Enter your access key and secret key

3. **Test the Configuration:**
   ```bash
   python -c "from services.gemini_service import gemini_service; content = gemini_service.get_s3_course_content(2); print('CENG 415 Content Files:', len(content))"
   ```

### **Option B: Use AWS CLI Profile**

1. **Install AWS CLI** (if not already installed):

   ```bash
   # Windows
   winget install -e --id Amazon.AWSCLI

   # macOS
   brew install awscli

   # Linux
   sudo apt-get install awscli
   ```

2. **Configure AWS CLI:**

   ```bash
   aws configure --profile visionware-dev
   ```

   - Enter your AWS Access Key ID
   - Enter your AWS Secret Access Key
   - Enter region: `us-east-1`
   - Enter output format: `json`

3. **Run the Setup Script:**
   ```bash
   cd fastapi-backend
   python setup_local_aws.py
   ```
   - Choose option 2 (AWS CLI Profile)
   - Enter profile name: `visionware-dev`

### **Option C: Use Mock Storage (No AWS Required)**

1. **Run the Setup Script:**

   ```bash
   cd fastapi-backend
   python setup_local_aws.py
   ```

   - Choose option 4 (Skip S3 setup)

2. **This will:**
   - Disable S3 access
   - Use local file storage instead
   - Create a `local_course_content` directory

## 🔧 **Manual Setup (Alternative)**

If you prefer to set up manually:

1. **Edit the `.env` file:**

   ```bash
   cd fastapi-backend
   # Edit .env file
   ```

2. **Add these lines:**

   ```env
   # For AWS Access Keys
   USE_IAM_ROLE=false
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=visionware-lecture-courses

   # OR for AWS CLI Profile
   USE_IAM_ROLE=false
   AWS_PROFILE=visionware-dev
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=visionware-lecture-courses
   ```

## 🧪 **Testing Your Setup**

### **Test 1: Check ECHO Status**

```bash
cd fastapi-backend
python -c "from services.gemini_service import gemini_service; status = gemini_service.get_echo_status(); print('AWS Configured:', status.get('aws_configured'))"
```

### **Test 2: Test S3 Access**

```bash
python -c "from services.gemini_service import gemini_service; content = gemini_service.get_s3_course_content(2); print('CENG 415 Files:', len(content))"
```

### **Test 3: Test ECHO Response**

```bash
# Start your FastAPI server
python main.py

# Then test ECHO in the browser
# Go to http://localhost:5173/chatbot
# Ask: "what is CENG 415 about?"
```

## 🎯 **Expected Results**

### **✅ Success (AWS Access Keys/CLI Profile):**

```
AWS Configured: True
CENG 415 Files: 0  # (No content uploaded yet, but S3 access works)
```

### **✅ Success (Mock Storage):**

```
AWS Configured: False
ECHO will work without S3 access
```

### **❌ Failure:**

```
AWS Configured: False
Error: Unable to locate credentials
```

## 📁 **Next Steps After Setup**

### **1. Upload Sample Course Content**

Once S3 access is working, you can upload sample content:

```bash
# Create sample course content
mkdir -p sample_content/courses/2
echo "CENG 415: Advanced Software Engineering" > sample_content/courses/2/syllabus.txt
echo "This course covers advanced software engineering principles..." > sample_content/courses/2/description.txt

# Upload to S3 (if using AWS CLI)
aws s3 sync sample_content/courses/2 s3://visionware-lecture-courses/courses/2/ --profile visionware-dev
```

### **2. Test ECHO Course Content**

```bash
# Test course content access
python -c "from services.gemini_service import gemini_service; content = gemini_service.get_s3_course_content(2); print('Files found:', len(content)); [print(f'- {item[\"key\"]}') for item in content]"
```

### **3. Test ECHO Responses**

- Start the FastAPI server
- Go to the chatbot interface
- Ask about CENG 415
- Verify ECHO can access and use course content

## 🔒 **Security Notes**

- **Never commit AWS credentials** to version control
- **Use different credentials** for development and production
- **Rotate access keys** regularly
- **Use IAM roles** in production environments
- **Limit permissions** to only what's needed

## 🚨 **Troubleshooting**

### **"Unable to locate credentials"**

- Check that AWS credentials are set in `.env`
- Verify AWS CLI profile is configured correctly
- Ensure `USE_IAM_ROLE=false` for local development

### **"Access Denied"**

- Check S3 bucket permissions
- Verify IAM user has S3 read access
- Ensure bucket name is correct

### **"No such file or directory"**

- Check that `.env` file exists in `fastapi-backend/`
- Verify file paths are correct
- Ensure you're running from the right directory

## 🎉 **Success!**

Once you've completed this setup:

- ✅ ECHO can access S3 course content
- ✅ Course content badges work correctly
- ✅ Local development environment is fully functional
- ✅ Ready to upload and test course materials

**Next Priority:** Upload sample course content and test ECHO's course integration!
