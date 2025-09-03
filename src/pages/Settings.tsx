import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Layout } from '@/components/Layout'
import ImageCropper from '@/components/ImageCropper'
import { StatsCardSkeleton } from '@/components/EnhancedSkeleton'
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button as DSButton,
  Badge as DSBadge,
  Card as DSCard
} from '@/components/ui/design-system'
import {
  User,
  Settings as SettingsIcon,
  Shield,
  Bell,
  Palette,
  Globe,
  Camera,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  Download,
  LogOut,
  AlertCircle,
  CheckCircle,
  Loader2,
  Image,
  Video,
  Play,
  Monitor,
  Wifi
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

// Import default profile images
import defaultImage1 from '../Images/1.jpeg'
import defaultImage2 from '../Images/2.jpeg'
import defaultImage3 from '../Images/3.jpeg'

const Settings = () => {
  const { user, updateUser, updatePreferences, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [userStats, setUserStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [showDefaultImages, setShowDefaultImages] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [cropperImage, setCropperImage] = useState('')

  // Default profile images
  const defaultImages = [
    { id: 1, src: defaultImage1, name: 'Default Avatar 1' },
    { id: 2, src: defaultImage2, name: 'Default Avatar 2' },
    { id: 3, src: defaultImage3, name: 'Default Avatar 3' }
  ]

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    age: user?.age || '',
    sex: user?.sex || ''
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: user?.preferences?.theme || 'light',
    notifications: user?.preferences?.notifications ?? true,
    emailUpdates: user?.preferences?.emailUpdates ?? true,
    language: user?.preferences?.language || 'en'
  })

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      await updateUser({
        ...profileData,
        age: typeof profileData.age === 'string' ? parseInt(profileData.age) : profileData.age
      })
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferencesUpdate = async () => {
    setIsLoading(true)
    try {
      await updatePreferences(preferences)
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)
    try {
      await changePassword({
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccountDeletion = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // In a real app, this would call an API endpoint
        toast.success('Account deletion request submitted')
        await logout()
      } catch (error) {
        toast.error('Failed to process account deletion')
      }
    }
  }

  // Load user stats when component mounts
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) return;
      setLoadingStats(true);
      try {
        const response = await apiClient.getUserStats()
        if (response.data) {
          setUserStats(response.data)
        }
      } catch (error) {
        console.error('Failed to load user stats:', error)
      }
      setLoadingStats(false);
    }

    loadUserStats()
  }, [user?.id]) // Only depend on user ID to prevent infinite loops

  const handleDataExport = async () => {
    try {
      // In a real app, this would call an API endpoint to generate export
      toast.success('Data export will be emailed to you within 24 hours')
    } catch (error) {
      toast.error('Failed to initiate data export')
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 2MB')
      return
    }

    // Read the file and show cropper
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setCropperImage(result)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
    
    // Reset the input
    e.target.value = ''
  }

  const handleDefaultImageSelect = async (imageSrc: string) => {
    setAvatarUploading(true)
    try {
      // Convert the imported image to a base64 data URL
      const response = await fetch(imageSrc)
      const blob = await response.blob()
      
      // Convert blob to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64Data = e.target?.result as string
        
        // Update the profile data
        setProfileData(prev => ({ ...prev, avatar: base64Data }))
        toast.success('Default avatar selected successfully!')
        setShowDefaultImages(false)
      }
      reader.readAsDataURL(blob)
    } catch (error: any) {
      console.error('Default image selection error:', error)
      toast.error('Failed to set default avatar. Please try again.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleCrop = async (croppedImage: string) => {
    setAvatarUploading(true)
    try {
      // Update the profile data with the cropped image
      setProfileData(prev => ({ ...prev, avatar: croppedImage }))
      toast.success('Profile photo updated successfully!')
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      toast.error('Failed to upload profile photo. Please try again.')
    } finally {
      setAvatarUploading(false)
    }
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <StatsCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6 space-y-6">
        <div className="container mx-auto max-w-4xl space-y-6">
        <div className="space-y-6">
          {/* Enhanced Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-green-500 rounded-2xl">
              <SettingsIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <H1 className="text-black mb-1 font-bold text-4xl">Settings</H1>
              <LargeText className="text-black font-semibold text-lg">Manage your account settings and preferences</LargeText>
            </div>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList 
              role="tablist" 
              aria-orientation="horizontal" 
              className="h-14 items-center justify-center text-muted-foreground grid w-full grid-cols-5 max-w-4xl bg-white/95 backdrop-blur-sm border border-white/30 rounded-2xl p-1 shadow-xl"
            >
              <TabsTrigger 
                value="profile" 
                className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 transition-all duration-300 rounded-xl font-semibold px-3 py-2 text-sm"
              >
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="preferences" 
                className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 transition-all duration-300 rounded-xl font-semibold px-3 py-2 text-sm"
              >
                <Palette className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              {user?.role === 'teacher' && (
                <TabsTrigger 
                  value="streaming" 
                  className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 transition-all duration-300 rounded-xl font-semibold px-3 py-2 text-sm"
                >
                  <Video className="h-4 w-4" />
                  Streaming
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="security" 
                className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 transition-all duration-300 rounded-xl font-semibold px-3 py-2 text-sm"
              >
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="account" 
                className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 transition-all duration-300 rounded-xl font-semibold px-3 py-2 text-sm"
              >
                <User className="h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black text-3xl font-bold">
                    <User className="h-6 w-6 text-blue-600" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-black font-medium">
                    Update your profile information and how others see you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={profileData.avatar} />
                      <AvatarFallback className="text-lg text-blue-700 bg-blue-100 font-bold">
                        {profileData.first_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button 
                        size="sm"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        disabled={avatarUploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowDefaultImages(!showDefaultImages)}
                        disabled={avatarUploading}
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                      >
                        <Image className="h-4 w-4 mr-2" />
                        {avatarUploading ? 'Loading...' : 'Choose Default'}
                      </Button>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <p className="text-sm text-black font-medium">
                        JPG, PNG or GIF. Max size 2MB
                      </p>
                    </div>
                  </div>

                  {/* Default Images Selection */}
                  {showDefaultImages && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                      <h4 className="text-sm font-medium mb-3 text-black font-bold">Choose Default Avatar</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {defaultImages.map((image) => (
                          <button
                            key={image.id}
                            onClick={() => handleDefaultImageSelect(image.src)}
                            disabled={avatarUploading}
                            className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all duration-200"
                          >
                            <img
                              src={image.src}
                              alt={image.name}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            {avatarUploading && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowDefaultImages(false)}
                        className="mt-3 bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  <Separator />

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-black font-bold">First Name</Label>
                      <Input
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                        id="first_name"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        placeholder="Your first name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-black font-bold">Last Name</Label>
                      <Input
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                        id="last_name"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        placeholder="Your last name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-black font-bold">Email Address</Label>
                      <Input
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="your@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-black font-bold">Phone Number</Label>
                      <Input
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-black font-bold">Location</Label>
                      <Input
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="website" className="text-black font-bold">Website</Label>
                      <Input
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                        id="website"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio" className="text-black font-bold">Bio</Label>
                      <textarea
                        id="bio"
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        rows={3}
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder="Tell us a bit about yourself..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-black font-bold">Age</Label>
                      <Input
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                        id="age"
                        type="number"
                        min={1}
                        value={profileData.age}
                        onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                        placeholder="Enter your age"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sex" className="text-black font-bold">Sex/Gender</Label>
                      <Select
                        value={profileData.sex}
                        onValueChange={(value) => setProfileData(prev => ({ ...prev, sex: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your sex/gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleProfileUpdate} 
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* User Stats */}
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-black">Learning Statistics</CardTitle>
                  <CardDescription className="text-black">Your progress and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all duration-200">
                      <div className="text-2xl font-bold text-blue-600">{loadingStats ? '...' : (userStats?.lectures_attended ?? 0)}</div>
                      <div className="text-sm text-black font-medium">Lectures Attended</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-all duration-200">
                      <div className="text-2xl font-bold text-green-600">{loadingStats ? '...' : (userStats?.flashcards_reviewed ?? 0)}</div>
                      <div className="text-sm text-black font-medium">Flashcards Reviewed</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-all duration-200">
                      <div className="text-2xl font-bold text-purple-600">{loadingStats ? '...' : `${Math.round((userStats?.quiz_average_score ?? 0))}%`}</div>
                      <div className="text-sm text-black font-medium">Quiz Average</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-all duration-200">
                      <div className="text-2xl font-bold text-orange-600">{loadingStats ? '...' : (userStats?.learning_streak_days ?? 0)}</div>
                      <div className="text-sm text-black font-medium">Day Streak</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold text-xl">
                    <Palette className="h-6 w-6 text-blue-600" />
                    Appearance
                  </CardTitle>
                  <CardDescription className="text-black font-medium">
                    Customize how VisionWare looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-black font-bold">Theme</Label>
                      <p className="text-sm text-black font-medium">Choose your preferred theme</p>
                    </div>
                    <Select
                      value={preferences.theme}
                      onValueChange={(value) => setPreferences({ ...preferences, theme: value as any })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-black font-bold">Language</Label>
                      <p className="text-sm text-black font-medium">Select your preferred language</p>
                    </div>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold text-xl">
                    <Bell className="h-6 w-6 text-blue-600" />
                    Notifications
                  </CardTitle>
                  <CardDescription className="text-black font-medium">
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-black font-bold">Push Notifications</Label>
                      <p className="text-sm text-black font-medium">Receive notifications in your browser</p>
                    </div>
                    <Switch
                      checked={preferences.notifications}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, notifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-black font-bold">Email Updates</Label>
                      <p className="text-sm text-black font-medium">Receive course updates via email</p>
                    </div>
                    <Switch
                      checked={preferences.emailUpdates}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, emailUpdates: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  onClick={handlePreferencesUpdate} 
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold text-xl">
                    <Lock className="h-6 w-6 text-blue-600" />
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-black font-medium">
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-black font-bold">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-black font-bold">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-black font-bold">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="text-gray-900"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handlePasswordChange} 
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold text-xl">
                    <Shield className="h-6 w-6 text-blue-600" />
                    Account Security
                  </CardTitle>
                  <CardDescription className="text-black font-medium">
                    Manage your account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50/30 transition-all duration-200">
                    <div>
                      <div className="font-medium text-black font-bold">Two-Factor Authentication</div>
                      <div className="text-sm text-black font-medium">Add an extra layer of security</div>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50/30 transition-all duration-200">
                    <div>
                      <div className="font-medium text-black font-bold">Login Sessions</div>
                      <div className="text-sm text-black font-medium">Manage active sessions</div>
                    </div>
                    <Button 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      View Sessions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Streaming Tab - Teachers Only */}
            {user?.role === 'teacher' && activeTab === 'streaming' && (
              <TabsContent value="streaming" className="space-y-6">
                <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Video className="h-5 w-5 text-gray-700" />
                      Streaming Management
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage your live streaming settings and configurations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Streaming Setup */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50/30 transition-all duration-200">
                        <div>
                          <div className="font-medium text-gray-900">Streaming Architecture</div>
                          <div className="text-sm text-gray-600">Choose your preferred streaming method</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate('/streaming-setup')}
                        >
                          <SettingsIcon />
                          Configure
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50/30 transition-all duration-200">
                        <div>
                          <div className="font-medium text-gray-900">Create Live Stream</div>
                          <div className="text-sm text-gray-600">Start a new live streaming session</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate('/livestream/create')}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Create Stream
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50/30 transition-all duration-200">
                        <div>
                          <div className="font-medium text-gray-900">View My Streams</div>
                          <div className="text-sm text-gray-600">Manage your existing live streams</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate('/livestream')}
                        >
                          <Monitor className="h-4 w-4 mr-2" />
                          View Streams
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Streaming Information */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-900">Streaming Options</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Monitor className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-gray-900">Browser-Based Streaming</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Stream directly from your browser using camera and microphone
                          </p>
                          <div className="space-y-1 text-xs text-gray-500">
                            <div>✅ No additional software needed</div>
                            <div>✅ Quick setup (2-5 minutes)</div>
                            <div>✅ Built-in chat integration</div>
                            <div>❌ Limited to browser capabilities</div>
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="h-4 w-4 text-purple-500" />
                            <span className="font-medium text-gray-900">Professional Broadcasting</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Use OBS Studio for professional-quality streaming
                          </p>
                          <div className="space-y-1 text-xs text-gray-500">
                            <div>✅ High-quality video (up to 4K)</div>
                            <div>✅ Multiple video sources</div>
                            <div>✅ Advanced overlays and graphics</div>
                            <div>❌ Requires OBS Studio installation</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Quick Actions */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-black font-bold">Quick Actions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button 
                          size="sm"
                          onClick={() => navigate('/streaming-guide/mediasoup')}
                          className="justify-start bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                        >
                          <Wifi />
                          Browser Setup Guide
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => navigate('/streaming-guide/rtmp')}
                          className="justify-start bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                        >
                          <Video />
                          OBS Setup Guide
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold text-xl">
                    <Download className="h-6 w-6 text-blue-600" />
                    Data Export
                  </CardTitle>
                  <CardDescription className="text-black font-medium">
                    Download a copy of your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-black font-medium">
                      You can request a copy of all your data including courses, progress, and personal information.
                    </p>
                    <Button 
                      onClick={handleDataExport} 
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Request Data Export
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 font-bold text-xl">
                    <Trash2 className="h-6 w-6 text-red-600" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-red-600 font-medium">
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-red-100 border-red-300">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 font-medium">
                      Once you delete your account, there is no going back. Please be certain.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={handleAccountDeletion} 
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        </div>
      </div>

      {/* Image Cropper */}
      <ImageCropper
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        onCrop={handleCrop}
        imageSrc={cropperImage}
      />
    </Layout>
  )
}

export default Settings