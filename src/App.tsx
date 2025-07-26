import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import CourseSelection from './pages/CourseSelection';
import TeacherCourses from './pages/TeacherCourses';
import LectureManager from './pages/LectureManager';
import CreateLiveStream from './pages/CreateLiveStream';
import StreamViewer from './pages/StreamViewer';
import StreamList from './pages/StreamList';
import Unauthorized from './pages/Unauthorized';
import QuizDashboard from './pages/QuizDashboard';
import Flashcards from './pages/Flashcards';
import Summaries from './pages/Summaries';
import StudentCourseDocuments from './pages/StudentCourseDocuments';
import StudentAppliedCourses from './pages/StudentAppliedCourses';
import MyCourses from './pages/MyCourses';
import LoadingSpinner from './components/LoadingSpinner';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OAuthCallback } from './components/OAuthCallback';
import Chatbot from './pages/Chatbot';
import { StudentOnlyRoute } from './components/StudentOnlyRoute';
import CourseDetail from './pages/CourseDetail';
import CourseDocuments from './pages/CourseDocuments';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Protected Routes - Only for authenticated users */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><StudentOnlyRoute><CourseSelection /></StudentOnlyRoute></ProtectedRoute>} />
      <Route path="/courses/:courseId" element={<ProtectedRoute><StudentOnlyRoute><CourseDetail /></StudentOnlyRoute></ProtectedRoute>} />
      <Route path="/courses/:courseId/documents" element={<ProtectedRoute><StudentOnlyRoute><CourseDocuments /></StudentOnlyRoute></ProtectedRoute>} />
      <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
      <Route path="/teacher/courses" element={<ProtectedRoute><TeacherCourses /></ProtectedRoute>} />
      <Route path="/lectures" element={<ProtectedRoute><LectureManager /></ProtectedRoute>} />
      <Route path="/livestream/create" element={<ProtectedRoute><CreateLiveStream /></ProtectedRoute>} />
      <Route path="/livestream" element={<ProtectedRoute><StreamList /></ProtectedRoute>} />
      <Route path="/livestream/:streamId" element={<ProtectedRoute><StreamViewer /></ProtectedRoute>} />
      <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
      <Route path="/quizzes" element={<ProtectedRoute><QuizDashboard /></ProtectedRoute>} />
      <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
      <Route path="/summaries" element={<ProtectedRoute><Summaries /></ProtectedRoute>} />
      <Route path="/student/documents" element={<ProtectedRoute><StudentCourseDocuments /></ProtectedRoute>} />
      <Route path="/student/applied-courses" element={<ProtectedRoute><StudentAppliedCourses /></ProtectedRoute>} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;