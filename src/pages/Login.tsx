import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Eye, EyeOff, Lock, User, Sparkles, ArrowRight, AlertCircle, XCircle, Shield, BookOpen, GraduationCap } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const result = await login(username, password, selectedRole);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid credentials. Please check your username and password.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const roleConfig = {
    student: {
      title: 'Student Portal',
      description: 'Access your courses, attend lectures, and participate in discussions.',
      color: 'bg-gradient-to-br from-blue-50/80 to-indigo-100/80 border-blue-200/50',
      gradient: 'from-blue-500 to-indigo-600',
      icon: <GraduationCap className="h-6 w-6" />
    },
    teacher: {
      title: 'Teacher Portal',
      description: 'Manage your courses, create lectures, and interact with students.',
      color: 'bg-gradient-to-br from-green-50/80 to-emerald-100/80 border-green-200/50',
      gradient: 'from-green-500 to-emerald-600',
      icon: <BookOpen className="h-6 w-6" />
    },
    admin: {
      title: 'Admin Portal',
      description: 'System administration, user management, and platform oversight.',
      color: 'bg-gradient-to-br from-purple-50/80 to-violet-100/80 border-purple-200/50',
      gradient: 'from-purple-500 to-violet-600',
      icon: <Shield className="h-6 w-6" />
    }
  };

  const config = roleConfig[selectedRole];

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-2 sm:px-4"
      style={{
        backgroundImage: 'url(/Background/login_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden bg-white/70 backdrop-blur-sm">
          {/* Left Panel */}
          <div className="md:w-1/2 w-full bg-gradient-to-br from-blue-600/90 to-black/90 flex flex-col items-center justify-center p-8 text-white relative backdrop-blur-sm">
            <div className="flex flex-col items-center w-full">
              <img src="/visionware-logo.png" alt="VisionWare Logo" className="w-16 h-16 rounded-2xl shadow-xl mb-4" />
              <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
              <p className="text-white/90 mb-6 text-center">Sign in to your VisionWare account to access your courses, lectures, and more.</p>
              <button
                onClick={() => navigate('/register')}
                className="border border-white rounded-full px-8 py-2 font-semibold text-white hover:bg-white/10 transition mb-2"
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Right Panel (Login Form) */}
          <div className="md:w-1/2 w-full bg-white/70 backdrop-blur-sm flex flex-col justify-center p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-2">
                <div className={`w-12 h-12 bg-gradient-to-r ${config.gradient} rounded-2xl flex items-center justify-center shadow-xl`}>
                  <div className="text-white">
                    {config.icon}
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{config.title}</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{config.description}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="role" className="text-sm font-semibold text-gray-800">Select Your Role</Label>
                <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                  <SelectTrigger className="border-2 border-gray-200 bg-white/80 focus:border-blue-500">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-800">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your username"
                    className={`pl-10 pr-4 py-2 border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-800">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your password"
                    className={`pl-10 pr-10 py-2 border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50/80 animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center">
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button 
                type="submit" 
                className={`w-full bg-gradient-to-r ${config.gradient} hover:opacity-90 shadow-xl text-white font-semibold py-2 text-base transition-all duration-300 transform hover:scale-[1.02]`} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <div className="flex flex-col items-center gap-2 pt-2">
                <Button
                  variant="link"
                  onClick={() => navigate('/register')}
                  className="text-gray-600 hover:text-blue-600 font-medium px-0"
                >
                  Don't have an account? Sign up here
                </Button>
                <Button
                  variant="link"
                  onClick={() => navigate('/forgot-password')}
                  className="text-gray-600 hover:text-blue-600 font-medium px-0"
                >
                  Forgot your password?
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;