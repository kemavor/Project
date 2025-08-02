# ECHO File Upload Feature

## 🚀 Overview

ECHO now supports file uploads, allowing users to send images, documents, and other files directly to the AI assistant for analysis and discussion. This feature enhances ECHO's capabilities by enabling it to process and understand various file types in real-time conversations.

## ✨ Features

### **📁 Supported File Types**

**Images:**

- JPEG, PNG, GIF, WebP, BMP, TIFF
- ECHO can analyze and describe image content

**Documents:**

- PDF files (text extraction)
- Word documents (.doc, .docx)
- Text files (.txt, .md)
- Code files (.py, .js, .html, .css, .json)

**Data Files:**

- Excel spreadsheets (.xlsx, .xls)
- CSV files
- JSON data files

### **🎯 Key Capabilities**

1. **Multi-File Upload** - Upload multiple files simultaneously
2. **File Preview** - See selected files before sending
3. **File Management** - Remove individual files or clear all
4. **Context-Aware Analysis** - ECHO considers course context when analyzing files
5. **Real-Time Processing** - Instant analysis and responses
6. **File Size Display** - Shows file sizes for better management

## 🛠️ Technical Implementation

### **Backend Components**

#### **1. New API Endpoint**

```python
POST /api/chatbot/chat-with-files
```

- Accepts multipart form data
- Handles file uploads and processing
- Integrates with existing chat session management

#### **2. Enhanced Gemini Service**

```python
def chat_with_files(self, message: str, files: List[Dict], course_id: Optional[int] = None, conversation_history: List[Dict] = None, course_info: Optional[Dict] = None) -> Dict[str, Any]:
```

- Processes different file types appropriately
- Handles images for visual analysis
- Extracts text from documents
- Maintains conversation context

#### **3. File Processing Pipeline**

- **Image Processing**: Direct binary data for Gemini vision
- **Document Processing**: Text extraction using enhanced document processor
- **File Storage**: Temporary local storage with unique naming
- **Error Handling**: Graceful fallbacks for unsupported formats

### **Frontend Components**

#### **1. File Upload Interface**

- Drag-and-drop or click-to-upload
- File type validation
- Multiple file selection
- Real-time file preview

#### **2. Enhanced Chat Interface**

- File upload area above input
- File count and size display
- Individual file removal
- Upload progress indicators

#### **3. Message Display**

- File upload badges
- Processing status indicators
- Enhanced message metadata

## 📋 Usage Guide

### **For Users**

#### **1. Uploading Files**

1. Click the **Image** icon or **Upload Files** button
2. Select one or more files from your device
3. Review selected files in the upload area
4. Optionally add a message describing what you want ECHO to analyze
5. Click **Send** to process files with ECHO

#### **2. File Management**

- **Remove Individual Files**: Click the X button next to any file
- **Clear All Files**: Click "Clear All" to remove all selected files
- **File Information**: See file names, sizes, and types

#### **3. Example Use Cases**

**📸 Image Analysis:**

```
Upload: Screenshot of code error
Message: "What's wrong with this code and how can I fix it?"
```

**📄 Document Review:**

```
Upload: Assignment PDF
Message: "Can you help me understand the requirements for this assignment?"
```

**💻 Code Review:**

```
Upload: Python script
Message: "Review this code and suggest improvements"
```

**📊 Data Analysis:**

```
Upload: CSV file with student grades
Message: "Analyze this data and provide insights about student performance"
```

### **For Developers**

#### **1. API Integration**

```javascript
// Send message with files
const response = await apiClient.sendChatMessageWithFiles({
  session_id: 1,
  message: "Analyze these files",
  course_id: 2,
  files: [file1, file2, file3],
});
```

#### **2. File Validation**

```javascript
// Supported file types
const supportedTypes = [
  "image/*",
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".py",
  ".js",
  ".html",
  ".css",
  ".json",
  ".csv",
  ".xlsx",
  ".xls",
];
```

## 🔧 Configuration

### **Environment Variables**

```bash
# File upload settings
ECHO_MAX_FILE_SIZE=10485760  # 10MB max file size
ECHO_UPLOAD_DIR=uploads      # Upload directory
ECHO_ALLOWED_TYPES=image/*,.pdf,.doc,.docx,.txt,.md,.py,.js,.html,.css,.json,.csv,.xlsx,.xls
```

### **File Size Limits**

- **Default**: 10MB per file
- **Total**: 50MB per upload session
- **Configurable**: Via environment variables

## 🧪 Testing

### **Test Script**

Run the comprehensive test suite:

```bash
python test_file_upload.py
```

### **Test Coverage**

- ✅ Single file upload (image)
- ✅ Single file upload (document)
- ✅ Single file upload (code)
- ✅ Multiple files upload
- ✅ File type validation
- ✅ Error handling
- ✅ Response processing

## 🔒 Security Considerations

### **File Validation**

- File type verification
- File size limits
- Malicious file detection
- Temporary file cleanup

### **Data Privacy**

- Files stored temporarily
- Automatic cleanup after processing
- No persistent file storage
- Secure file handling

## 🚀 Performance

### **Optimizations**

- **Async Processing**: Non-blocking file uploads
- **Streaming**: Large file handling
- **Caching**: Temporary file storage
- **Cleanup**: Automatic file removal

### **Limitations**

- File size restrictions
- Processing time for large files
- Memory usage for multiple files
- Network bandwidth considerations

## 🔮 Future Enhancements

### **Planned Features**

- **Drag & Drop**: Enhanced file upload interface
- **File Preview**: Thumbnail generation for images
- **Batch Processing**: Queue-based file processing
- **Cloud Storage**: Integration with S3 for file storage
- **OCR Support**: Enhanced text extraction from images
- **Video Support**: Video file analysis capabilities

### **Advanced Capabilities**

- **File Comparison**: Compare multiple versions
- **Code Execution**: Safe code analysis environment
- **Data Visualization**: Chart and graph generation
- **Collaborative Analysis**: Multi-user file sharing

## 📊 Analytics

### **Usage Metrics**

- File upload frequency
- File type distribution
- Processing success rates
- User engagement patterns

### **Performance Monitoring**

- Upload times
- Processing durations
- Error rates
- Resource utilization

## 🎯 Benefits

### **For Students**

- **Assignment Help**: Upload and discuss assignments
- **Code Review**: Get feedback on programming work
- **Document Analysis**: Understand complex materials
- **Visual Learning**: Analyze diagrams and charts

### **For Teachers**

- **Assignment Review**: Analyze student submissions
- **Content Creation**: Process educational materials
- **Assessment**: Review and grade digital work
- **Feedback**: Provide detailed student feedback

### **For Researchers**

- **Data Analysis**: Process research datasets
- **Document Review**: Analyze academic papers
- **Code Review**: Examine research code
- **Visual Analysis**: Process research images

## 🔧 Troubleshooting

### **Common Issues**

**File Upload Fails:**

- Check file size limits
- Verify file type support
- Ensure stable internet connection
- Try smaller files first

**Processing Errors:**

- Check file format compatibility
- Verify file isn't corrupted
- Try different file format
- Contact support if persistent

**Slow Processing:**

- Large files take longer
- Multiple files process sequentially
- Check server performance
- Consider file size optimization

## 📞 Support

For technical support or feature requests:

- **Documentation**: Check this guide first
- **Testing**: Run test scripts to verify functionality
- **Logs**: Check server logs for error details
- **Community**: Reach out to development team

---

**ECHO File Upload Feature** - Enhancing AI-powered learning through intelligent file analysis and discussion.
