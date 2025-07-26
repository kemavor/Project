import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermissions?: string[]
  requiredRole?: string
  allowedRoles?: string[]
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  requiredRole,
  allowedRoles = []
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, hasRole, user } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Helper function to get user role consistently
  const getUserRole = () => {
    if (!user) return null
    
    // Handle new Django model structure
    if (user.role && typeof user.role === 'object' && 'role_type' in user.role) {
      return user.role.role_type
    }
    
    // Handle legacy string role
    if (typeof user.role === 'string') {
      return user.role
    }
    
    // Fallback
    return null
  }

  const userRole = getUserRole()

  // Check role if required
  if (requiredRole) {
    const hasRequiredRole = hasRole(requiredRole) || userRole === requiredRole
    if (!hasRequiredRole) {
      console.log(`Role check failed: required=${requiredRole}, user=${userRole}`)
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Check if user's role is in allowed roles list
  if (allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log(`Allowed roles check failed: allowed=${allowedRoles}, user=${userRole}`)
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Check permissions if required
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    )
    if (!hasAllPermissions) {
      console.log(`Permission check failed: required=${requiredPermissions}`)
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <>{children}</>
}

// Role-specific route components
export function StudentRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['student']}>{children}</ProtectedRoute>
}

export function TeacherRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['teacher']}>{children}</ProtectedRoute>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin', 'super_admin']}>{children}</ProtectedRoute>
}

export function TeacherOrAdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}>{children}</ProtectedRoute>
}

export default ProtectedRoute