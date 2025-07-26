// components/ApiTest.tsx
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/contexts/AuthContext';

const ApiTest = () => {
  const { register, login, logout, user, isAuthenticated } = useAuth();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpass123');
  const [testName, setTestName] = useState('Test User');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    try {
      setError(null);
      const username = testEmail.split('@')[0];
      const result = await register({
        username,
        password: testPassword,
        email: testEmail,
        first_name: testName.split(' ')[0] || testName,
        last_name: testName.split(' ')[1] || '',
      });
      setResponse(result);
      console.log('Registration result:', result);
    } catch (err: any) {
      setError(err.message);
      console.error('Registration error:', err);
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);
      await login(testEmail, testPassword);
      setResponse({ success: true, user });
      console.log('Login successful, user:', user);
    } catch (err: any) {
      setError(err.message);
      console.error('Login error:', err);
    }
  };

  const handleLogout = () => {
    logout();
    setResponse({ success: true, message: 'Logged out' });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>API Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Email</Label>
              <Input
                id="testEmail"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testPassword">Password</Label>
              <Input
                id="testPassword"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testName">Name</Label>
              <Input
                id="testName"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button onClick={handleRegister}>Test Register</Button>
            <Button onClick={handleLogin}>Test Login</Button>
            <Button onClick={handleLogout} variant="outline">Test Logout</Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Authentication Status:</h3>
            <p className={isAuthenticated ? "text-green-600" : "text-red-600"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </p>
          </div>

          {user && (
            <div>
              <h3 className="font-medium mb-2">Current User:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {response && (
            <div>
              <h3 className="font-medium mb-2">Response:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiTest;