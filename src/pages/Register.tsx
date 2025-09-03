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
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button as DSButton,
  Badge as DSBadge,
  Card as DSCard
} from '@/components/ui/design-system'

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
      color: 'bg-blue-50 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      icon: <GraduationCap className="h-6 w-6" />
    },
    teacher: {
      title: 'Teacher Account',
      description: 'Create courses, manage lectures, and interact with students.',
      color: 'bg-green-50 border-green-200',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      icon: <BookOpen className="h-6 w-6" />
    },
    admin: {
      title: 'Admin Account',
      description: 'System administration, user management, and platform oversight.',
      color: 'bg-purple-50 border-purple-200',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
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
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse animate-in fade-in duration-1000 ease-in-out"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000 animate-in fade-in duration-1000 ease-in-out delay-500"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000 animate-in fade-in duration-1000 ease-in-out delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row rounded-2xl shadow-2xl overflow-hidden bg-white/70 backdrop-blur-sm min-h-[600px] max-h-[700px]">
          {/* Left Panel */}
          <div className="lg:w-2/5 w-full bg-blue-800 flex flex-col items-center justify-center p-6 text-white relative">
            <div className="flex flex-col items-center w-full">
              <img src="/visionware-logo.png" alt="VisionWare Logo" className="w-14 h-14 rounded-2xl shadow-xl mb-3" />
              <H2 className="mb-2 text-white text-4xl font-bold tracking-tight">Join VisionWare!</H2>
              <NormalText className="text-white/90 mb-4 text-center">Create your account and start your learning journey with access to courses, lectures, and more.</NormalText>
              <button
                onClick={() => navigate('/login')}
                className="border border-white rounded-full px-6 py-2 font-semibold text-white hover:bg-white/10 transition mb-2 text-sm"
              >
                Sign In Instead
              </button>
            </div>
          </div>

          {/* Right Panel (Registration Form) */}
          <div className="lg:w-3/5 w-full bg-white/70 backdrop-blur-sm flex flex-col justify-center p-4 lg:p-6">
            <div className="text-center mb-3">
              <div className="flex justify-center mb-2">
                <div className={`w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg`}>
                  <div className="text-white">
                    {config.icon}
                  </div>
                </div>
              </div>
              <h3 className="text-base font-bold text-black mb-1">{config.title}</h3>
              <p className="text-black text-xs">{config.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50/80 animate-in slide-in-from-top-2 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center text-sm">
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="first_name" className="text-xs font-semibold text-black">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      autoComplete="given-name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="John"
                      disabled={isLoading}
                      className="pl-9 pr-3 py-1.5 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="last_name" className="text-xs font-semibold text-black">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      autoComplete="family-name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Smith"
                      disabled={isLoading}
                      className="pl-9 pr-3 py-1.5 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" className="text-xs font-semibold text-black">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter a username"
                    disabled={isLoading}
                    className="pl-9 pr-3 py-1.5 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <p className="text-xs text-black">
                  At least 3 characters, letters, numbers, and underscores only
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-black">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@university.edu"
                    disabled={isLoading}
                    className="pl-9 pr-3 py-1.5 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="role_select" className="text-xs font-semibold text-black">Select Your Role</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))} defaultValue={formData.role} value={formData.role} disabled={isLoading}>
                  <SelectTrigger className="border-2 border-gray-200 bg-white/80 focus:border-blue-500 py-2 text-sm" id="role_select" name="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-black">
                  {formData.role === 'student' && 'Access courses and learning materials'}
                  {formData.role === 'teacher' && 'Create and manage courses and lectures'}
                  {formData.role === 'admin' && 'System administration and user management'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-semibold text-black">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create password"
                      disabled={isLoading}
                      className="pl-9 pr-9 py-1.5 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 hover:bg-transparent border-0 shadow-none"
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
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-black">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      disabled={isLoading}
                      className="pl-9 pr-9 py-1.5 text-sm border-2 border-gray-200 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 hover:bg-transparent border-0 shadow-none"
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
                <Label htmlFor="terms" className="text-xs text-black leading-relaxed">
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
                className={`w-full ${config.buttonColor || 'bg-blue-600 hover:bg-blue-700'} shadow-lg text-white font-semibold py-2 text-sm transition-all duration-300`}
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
                  className="text-black hover:text-blue-600 font-medium px-0 text-sm border-0 shadow-none"
                >
                  Already have an account? Sign in here
                </Button>
                <Button
                  variant="link"
                  onClick={() => navigate('/')}
                  className="text-black hover:text-blue-600 font-medium px-0 text-sm border-0 shadow-none"
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