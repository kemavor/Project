# TeacherCourses Document Upload Test Guide

## 🎯 **Test Objective**

Verify that teachers can upload documents to their courses through the TeacherCourses page.

## ✅ **Prerequisites**

1. ✅ FastAPI backend running on `http://localhost:8000`
2. ✅ Frontend running on `http://localhost:5173`
3. ✅ S3 bucket `visionware-lecture-courses` configured
4. ✅ Database table `course_documents` created
5. ✅ Test teacher account available

## 🧪 **Test Steps**

### **Step 1: Login as Teacher**

1. Navigate to `http://localhost:5173/login`
2. Login with teacher credentials:
   - Username: `test_teacher`
   - Password: `password123`
   - Role: `teacher`

### **Step 2: Access TeacherCourses Page**

1. Navigate to `http://localhost:5173/teacher/courses`
2. Verify you can see the "My Courses" page
3. Check that you have at least one course listed

### **Step 3: Test Document Upload**

1. **Find a Course**: Look for a course in the list
2. **Click "Upload Doc"**: Click the "Upload Doc" button on any course card
3. **Upload Dialog**: Verify the upload dialog opens with:
   - Document Title field (optional)
   - Document Description field (optional)
   - "Make document public" toggle
   - File selection input
   - Upload and Cancel buttons

### **Step 4: Upload a Test Document**

1. **Select File**: Choose a test file (PDF, DOC, TXT, etc.)
2. **Fill Details**:
   - Title: "Test Document"
   - Description: "This is a test document for upload functionality"
   - Public: Checked (default)
3. **Upload**: Click "Upload Document"
4. **Verify**: Check for success message and loading state

### **Step 5: Verify Document Display**

1. **Check Course Card**: Look for the document in the course card
2. **Document List**: Verify the document appears in the documents section
3. **Document Info**: Check that it shows:
   - Document title
   - File size
   - File type
   - Public/private indicator

### **Step 6: Test Document Management**

1. **Delete Document**: Click the trash icon on a document
2. **Verify Deletion**: Check that the document is removed from the list
3. **Refresh**: Refresh the page and verify the document is gone

## 🔍 **Expected Results**

### **✅ Success Indicators**

- [ ] Upload dialog opens correctly
- [ ] File selection works
- [ ] Upload completes without errors
- [ ] Success message appears
- [ ] Document appears in course card
- [ ] Document metadata is displayed correctly
- [ ] Delete functionality works
- [ ] No console errors

### **❌ Error Indicators**

- [ ] Upload fails with 500 error
- [ ] File not accepted
- [ ] Document doesn't appear after upload
- [ ] Delete doesn't work
- [ ] Console shows errors

## 🐛 **Troubleshooting**

### **If Upload Fails:**

1. Check FastAPI server logs for errors
2. Verify S3 bucket permissions
3. Check database connection
4. Ensure authentication token is valid

### **If Documents Don't Appear:**

1. Check browser console for errors
2. Verify API endpoints are working
3. Check network tab for failed requests
4. Ensure course has documents

### **If Delete Fails:**

1. Check API permissions
2. Verify document ownership
3. Check database constraints

## 📊 **Test Data**

### **Test Files to Try:**

- `test-document.txt` (small text file)
- `sample.pdf` (PDF document)
- `presentation.pptx` (PowerPoint file)
- `spreadsheet.xlsx` (Excel file)

### **Test Scenarios:**

1. **Public Document**: Upload with public access
2. **Private Document**: Upload with private access
3. **Large File**: Test with file > 1MB
4. **Multiple Files**: Upload several documents to same course
5. **Different File Types**: Test various supported formats

## 🎉 **Success Criteria**

- [ ] All upload scenarios work
- [ ] Documents display correctly
- [ ] Delete functionality works
- [ ] No errors in console
- [ ] UI is responsive and user-friendly
- [ ] File size and type validation works
- [ ] Public/private toggle works

## 📝 **Notes**

- Document uploads are stored in S3 bucket `visionware-lecture-courses`
- File metadata is stored in SQLite database
- Maximum file size is 50MB
- Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF
