// Debug script to test document upload
// Run this in browser console on the TeacherCourses page

async function debugUpload() {
    console.log('🔍 Debugging document upload...');
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No authentication token found');
        return;
    }
    console.log('✅ Authentication token found');
    
    // Check if we have a selected course
    const courseId = 2; // Assuming course ID 2 exists
    console.log(`📚 Using course ID: ${courseId}`);
    
    // Create a test file
    const testContent = 'This is a test document for debugging upload functionality.';
    const testFile = new File([testContent], 'debug-test.txt', { type: 'text/plain' });
    console.log('📄 Test file created:', testFile.name, testFile.size, 'bytes');
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('title', 'Debug Test Document');
    formData.append('description', 'This is a test document for debugging');
    formData.append('is_public', 'true');
    
    console.log('📦 FormData created with fields:', {
        file: testFile.name,
        title: 'Debug Test Document',
        description: 'This is a test document for debugging',
        is_public: 'true'
    });
    
    try {
        // Test the upload endpoint directly
        console.log('🚀 Attempting upload...');
        const response = await fetch(`http://localhost:8000/api/documents/courses/${courseId}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const result = await response.json();
        console.log('📡 Response body:', result);
        
        if (response.ok) {
            console.log('✅ Upload successful!');
            console.log('📄 Document ID:', result.document?.id);
            console.log('📄 S3 URL:', result.document?.s3_url);
        } else {
            console.error('❌ Upload failed:', result);
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Function to check current state
function checkState() {
    console.log('🔍 Checking current state...');
    
    // Check authentication
    const token = localStorage.getItem('token');
    console.log('🔑 Token exists:', !!token);
    
    // Check user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('👤 User role:', user.role);
    
    // Check if we're on the right page
    console.log('📍 Current URL:', window.location.href);
    
    // Check for any console errors
    console.log('⚠️ Check browser console for any errors');
}

// Run debug functions
console.log('🐛 Upload Debug Tools Loaded');
console.log('Run debugUpload() to test upload');
console.log('Run checkState() to check current state'); 