# S3 Bucket Configuration - VisionWare

## Bucket Usage Summary ✅

### 1. Course Documents Bucket
- **Bucket Name**: `visionware-lecture-courses` 
- **Purpose**: Store course documents uploaded by teachers (PDFs, DOCs, presentations, etc.)
- **Configuration**: `settings.s3_bucket_name` in config.py
- **Used By**:
  - `fastapi-backend/routers/documents.py` - Document upload and management
  - `fastapi-backend/routers/questions.py` - Quiz generation from documents  
  - Frontend course document access and quiz functionality

### 2. Video/Livestream Bucket  
- **Bucket Name**: `visionware-lecture-videos`
- **Purpose**: Store recorded livestream videos when "Record Stream" is selected
- **Configuration**: `settings.s3_video_bucket_name` in config.py
- **Used By**:
  - `fastapi-backend/routers/livestream.py` - Video recording storage
  - Video service for livestream recording functionality

## Environment Variables

```bash
# Course documents bucket (PDFs, docs, presentations)
S3_BUCKET_NAME=visionware-lecture-courses

# Video/livestream recordings bucket
S3_VIDEO_BUCKET_NAME=visionware-lecture-videos

# Other S3 settings
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
USE_IAM_ROLE=true  # Recommended for production EC2
```

## Code References Verified ✅

### Backend (Python)
- ✅ `config.py` - Correct bucket configuration
- ✅ `routers/documents.py` - Uses `settings.s3_bucket_name` (courses)
- ✅ `routers/livestream.py` - Uses `settings.s3_video_bucket_name` (videos)  
- ✅ `routers/questions.py` - Uses course documents for quiz generation

### Frontend (TypeScript/React)
- ✅ `lib/api.ts` - References `visionware-lecture-courses` for course data
- ✅ `pages/QuizDashboard.tsx` - Uses `visionware-lecture-courses` for lectures
- ✅ `components/SecureDocumentViewer.tsx` - Uses `visionware-lecture-courses` for documents

## Quiz System Integration ✅

The quiz system has been updated to use course documents instead of livestream transcriptions:

1. **Document-Based Questions**: Questions are now generated from uploaded course documents in `visionware-lecture-courses`
2. **Database Schema**: Updated `GeneratedQuestion` and `QuizSession` models to support document-based quizzes
3. **API Endpoints**: New endpoints work with `document_id` and `course_id` instead of `stream_id`

## File Cleanup Completed ✅

Removed irrelevant test files to reduce workspace clutter:
- HTML test files (auth, debug, websocket tests)
- Python test scripts and migration files
- Redundant documentation files
- Temporary files and build artifacts

## Configuration Validation

All S3 bucket references throughout the codebase are now correctly configured:
- **Course Documents** → `visionware-lecture-courses` ✅
- **Livestream Videos** → `visionware-lecture-videos` ✅
- **No logic errors or bucket confusion** ✅