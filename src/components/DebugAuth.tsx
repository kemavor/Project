import { useAuth } from '../contexts/AuthContext'

export function DebugAuth() {
  const { user, isAuthenticated, hasRole, hasPermission } = useAuth()

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        {user && (
          <>
            <div>User: {user.first_name} {user.last_name}</div>
            <div>Email: {user.email}</div>
            <div>Role: {JSON.stringify(user.role)}</div>
            <div>Has Student Role: {hasRole('student') ? '✅' : '❌'}</div>
            <div>Has Teacher Role: {hasRole('teacher') ? '✅' : '❌'}</div>
            <div>Has Admin Role: {hasRole('admin') ? '✅' : '❌'}</div>
          </>
        )}
      </div>
    </div>
  )
} 