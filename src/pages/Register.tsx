import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from '@/contexts/AuthContext'
import { Brain, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Sparkles, ArrowRight, User, Lock, Shield, Mail, GraduationCap, BookOpen, XCircle } from 'lucide-react'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()

  const checkPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value))
    }
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required')
      return false
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long')
      return false
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return false
    }

    if (!formData.first_name.trim()) {
      setError('First name is required')
      return false
    }

    if (!formData.last_name.trim()) {
      setError('Last name is required')
      return false
    }

    if (!formData.email) {
      setError('Email is required')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    try {
      await register({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      })
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError('Registration failed. Username or email may already be in use.')
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 3) return 'Medium'
    return 'Strong'
  }

  const roleConfig = {
    student: {
      title: 'Student Account',
      description: 'Access courses, attend lectures, and participate in discussions.',
      color: 'bg-gradient-to-br from-blue-50/80 to-indigo-100/80 border-blue-200/50',
      gradient: 'from-blue-500 to-indigo-600',
      icon: <GraduationCap className="h-6 w-6" />
    },
    teacher: {
      title: 'Teacher Account',
      description: 'Create courses, manage lectures, and interact with students.',
      color: 'bg-gradient-to-br from-green-50/80 to-emerald-100/80 border-green-200/50',
      gradient: 'from-green-500 to-emerald-600',
      icon: <BookOpen className="h-6 w-6" />
    },
    admin: {
      title: 'Admin Account',
      description: 'System administration, user management, and platform oversight.',
      color: 'bg-gradient-to-br from-purple-50/80 to-violet-100/80 border-purple-200/50',
      gradient: 'from-purple-500 to-violet-600',
      icon: <Shield className="h-6 w-6" />
    }
  }

  const config = roleConfig[formData.role as keyof typeof roleConfig]

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

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row rounded-2xl shadow-2xl overflow-hidden bg-white/70 backdrop-blur-sm">
          {/* Left Panel */}
          <div className="lg:w-1/2 w-full bg-gradient-to-br from-blue-600/90 to-black/90 flex flex-col items-center justify-center p-8 text-white relative backdrop-blur-sm">
            <div className="flex flex-col items-center w-full">
              <img src="/visionware-logo.png" alt="VisionWare Logo" className="w-16 h-16 rounded-2xl shadow-xl mb-4" />
              <h2 className="text-3xl font-bold mb-2">Join VisionWare!</h2>
              <p className="text-white/90 mb-6 text-center">Create your account and start your learning journey with access to courses, lectures, and more.</p>
              <button
                onClick={() => navigate('/login')}
                className="border border-white rounded-full px-8 py-2 font-semibold text-white hover:bg-white/10 transition mb-2"
              >
                Sign In Instead
              </button>
            </div>
          </div>

          {/* Right Panel (Registration Form) */}
          <div className="lg:w-1/2 w-full bg-white/70 backdrop-blur-sm flex flex-col justify-center p-6">
            <div className="text-center mb-4">
              <div className="flex justify-center mb-2">
                <div className={`w-10 h-10 bg-gradient-to-r ${config.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <div className="text-white">
                    {config.icon}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{config.title}</h3>
              <p className="text-gray-600 text-xs">{config.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50/80 animate-in slide-in-from-top-2 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center text-sm">
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="first_name" className="text-xs font-semibold text-gray-800">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="John"
                      disabled={isLoading}
                      className="pl-9 pr-3 py-2 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="last_name" className="text-xs font-semibold text-gray-800">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Smith"
                      disabled={isLoading}
                      className="pl-9 pr-3 py-2 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" className="text-xs font-semibold text-gray-800">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter a username"
                    disabled={isLoading}
                    className="pl-9 pr-3 py-2 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  At least 3 characters, letters, numbers, and underscores only
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-800">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@university.edu"
                    disabled={isLoading}
                    className="pl-9 pr-3 py-2 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="role" className="text-xs font-semibold text-gray-800">Select Your Role</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))} defaultValue={formData.role} value={formData.role} disabled={isLoading}>
                  <SelectTrigger className="border-2 border-gray-200 bg-white/80 focus:border-blue-500 py-2 text-sm">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">
                  {formData.role === 'student' && 'Access courses and learning materials'}
                  {formData.role === 'teacher' && 'Create and manage courses and lectures'}
                  {formData.role === 'admin' && 'System administration and user management'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-semibold text-gray-800">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create password"
                      disabled={isLoading}
                      className="pl-9 pr-9 py-2 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
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

                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Strength</span>
                        <span className={`font-medium ${
                          passwordStrength <= 2 ? 'text-red-600' :
                          passwordStrength <= 3 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-800">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      disabled={isLoading}
                      className="pl-9 pr-9 py-2 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>

                  {formData.confirmPassword && (
                    <div className="flex items-center space-x-1">
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                  required
                />
                <Label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className={`w-full bg-gradient-to-r ${config.gradient} hover:opacity-90 shadow-lg text-white font-semibold py-2.5 text-sm transition-all duration-300 transform hover:scale-[1.02]`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="flex flex-col items-center gap-1 pt-1">
                <Button
                  variant="link"
                  onClick={() => navigate('/login')}
                  className="text-gray-600 hover:text-blue-600 font-medium px-0 text-sm"
                >
                  Already have an account? Sign in here
                </Button>
                <Button
                  variant="link"
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-blue-600 font-medium px-0 text-sm"
                >
                  ← Back to Home
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register