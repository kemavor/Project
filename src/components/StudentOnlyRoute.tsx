import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Unauthorized from '../pages/Unauthorized';

interface StudentOnlyRouteProps {
  children: React.ReactNode;
}

export const StudentOnlyRoute: React.FC<StudentOnlyRouteProps> = ({ children }) => {
  const { user } = useAuth();

  // If user is not authenticated, show unauthorized
  if (!user) {
    return <Unauthorized />;
  }

  // If user is not a student, show unauthorized
  if (user.role !== 'student') {
    return <Unauthorized />;
  }

  // If user is a student, render the children
  return <>{children}</>;
}; 