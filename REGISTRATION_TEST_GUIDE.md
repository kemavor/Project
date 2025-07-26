# Registration and Login Test Guide

## 🧪 Manual Testing Steps

### 1. Start the Development Servers

```bash
# Terminal 1 - Start Frontend
npm run dev

# Terminal 2 - Start Backend (if using Django)
cd backend
python manage.py runserver

# Or if using FastAPI
cd fastapi-backend
uvicorn main:app --reload
```

### 2. Test Registration Form

1. **Navigate to Registration Page**

   - Go to `http://localhost:5173/register`
   - Verify the page loads correctly

2. **Check Username Field**

   - ✅ Username field is present at the top
   - ✅ Placeholder text: "Enter a username"
   - ✅ Help text shows requirements
   - ✅ Validation works (try invalid usernames)

3. **Test Form Validation**
   - Try submitting with empty username → Should show error
   - Try username less than 3 characters → Should show error
   - Try username with special characters → Should show error
   - Try valid username → Should accept

### 3. Test Complete Registration

1. **Fill Out Registration Form**

   ```
   Username: testuser123
   First Name: John
   Last Name: Doe
   Email: john.doe@example.com
   Password: TestPass123!
   Confirm Password: TestPass123!
   Role: Student
   ```

2. **Submit Registration**
   - Click "Create Account"
   - Should redirect to dashboard
   - Check browser console for any errors

### 4. Test Login with Created Account

1. **Navigate to Login Page**

   - Go to `http://localhost:5173/login`
   - Select "Student" role

2. **Login with Created Credentials**

   ```
   Username: testuser123
   Password: TestPass123!
   Role: Student
   ```

3. **Verify Login Success**
   - Should redirect to dashboard
   - User should be logged in
   - Check user info in browser dev tools

### 5. Test Duplicate Username Prevention

1. **Try to Register Same Username**
   - Go back to registration page
   - Use same username: `testuser123`
   - Different email: `john2@example.com`
   - Should show error about duplicate username

### 6. Test Different Roles

1. **Register as Teacher**

   ```
   Username: teacher123
   Email: teacher@example.com
   Role: Teacher
   ```

2. **Register as Admin**

   ```
   Username: admin123
   Email: admin@example.com
   Role: Administrator
   ```

3. **Test Role-Specific Login**
   - Login with teacher credentials → Teacher role
   - Login with admin credentials → Admin role

## ✅ Expected Results

### Registration Form

- ✅ Username field is present and functional
- ✅ All validations work correctly
- ✅ Form submits successfully
- ✅ User is created in database
- ✅ Redirects to dashboard after registration

### Login System

- ✅ Can login with username and password
- ✅ Role-based access works
- ✅ JWT tokens are generated
- ✅ Session persists correctly

### Error Handling

- ✅ Duplicate usernames are rejected
- ✅ Invalid usernames show proper errors
- ✅ Form validation prevents invalid submissions

## 🐛 Common Issues to Check

1. **Backend Server Not Running**

   - Check if Django/FastAPI server is running
   - Verify API endpoints are accessible

2. **Database Issues**

   - Check if database migrations are applied
   - Verify database connection

3. **CORS Issues**

   - Check browser console for CORS errors
   - Verify backend CORS settings

4. **JWT Token Issues**
   - Check if tokens are being generated
   - Verify token storage in localStorage

## 📊 Test Results Template

```
Test Date: _______________
Tester: _________________

✅ Registration Form Loads
✅ Username Field Present
✅ Form Validation Works
✅ Registration Successful
✅ Login with Username Works
✅ Role-Based Access Works
✅ Duplicate Prevention Works
✅ Error Handling Works

Notes: ________________________________
```

## 🎯 Success Criteria

The registration system is working correctly if:

1. Users can register with custom usernames
2. Users can login with their username and password
3. Role-based access control works
4. Duplicate usernames are properly prevented
5. All form validations work as expected
