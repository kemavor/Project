import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Layout } from '@/components/Layout'
import ImageCropper from '@/components/ImageCropper'
import { StatsCardSkeleton } from '@/components/EnhancedSkeleton'
import {
  User,
  Mail,
  Calendar,
  Settings,
  Bell,
  Globe,
  Shield,
  Trophy,
  BookOpen,
  Target,
  Flame,
  CheckCircle,
  Camera,
  Loader2,
  Image,
  Phone,
  MapPin
} from 'lucide-react'
import toast from 'react-hot-toast'
import { updateUserPreferences, changePassword, updateCurrentUser, uploadAvatar, deleteAccount, apiClient } from '@/lib/api'

// Import default profile images
import defaultImage1 from '../Images/1.jpeg'
import defaultImage2 from '../Images/2.jpeg'
import defaultImage3 from '../Images/3.jpeg'

const Profile = () => {
  const { user, isLoading, updateUser } = useAuth()
  const [editingProfile, setEditingProfile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userStats, setUserStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [showDefaultImages, setShowDefaultImages] = useState(false)
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    age: user?.age || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    location: user?.location || '',
    website: user?.website || '',
    sex: user?.sex || ''
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [showCropper, setShowCropper] = useState(false)
  const [cropperImage, setCropperImage] = useState('')

  // Default profile images
  const defaultImages = [
    { id: 1, src: defaultImage1, name: 'Default Avatar 1' },
    { id: 2, src: defaultImage2, name: 'Default Avatar 2' },
    { id: 3, src: defaultImage3, name: 'Default Avatar 3' }
  ]

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

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        age: user.age || '',
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        website: user.website || '',
        sex: user.sex || ''
      })
    }
  }, [user])

  if (!user) return null

  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
      const response = await updateCurrentUser(profileData);
      if (response.data && typeof response.data === 'object') {
        updateUser({
          first_name: (response.data as any).first_name,
          last_name: (response.data as any).last_name,
          email: (response.data as any).email,
          age: (response.data as any).age,
          bio: (response.data as any).bio
        });
      }
      setSuccessMessage('Profile updated successfully!');
      setEditingProfile(false);
      setTimeout(() => setSuccessMessage(''), 3000);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (prefs: Partial<typeof user.preferences>) => {
    if (!user) return
    try {
      const response = await updateUserPreferences(prefs)
      if (response.data) {
        updateUser({ preferences: (response.data as any).preferences })
      }
    } catch (error) {
      // silent fail
    }
  }

  const handlePreferenceChange = (key: keyof typeof user.preferences | string, value: string | boolean) => {
    updatePreferences({ [key]: value } as any)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'instructor': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      case 'admin': return 'bg-red-500/10 text-red-600 dark:text-red-400'
      default: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    }
  }

  const handleChangePassword = async () => {
    const currentPassword = prompt('Enter current password:')
    if (!currentPassword) return
    const newPassword = prompt('Enter new password:')
    if (!newPassword) return
    
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }
    
    try {
      const result = await changePassword({ old_password: currentPassword, new_password: newPassword })
      if (result.data) {
        toast.success('Password changed successfully')
      } else {
        toast.error(result.error || 'Failed to change password')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to change password')
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
        
        // Update the user's avatar immediately
        updateUser({ 
          avatar: base64Data, 
          profile_picture: base64Data 
        })
        
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
      // Convert base64 to blob
      const response = await fetch(croppedImage)
      const blob = await response.blob()
      const file = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' })
      
      // Upload the cropped image
      const uploadResponse = await uploadAvatar(file)
      const responseData = uploadResponse.data as any;
      if (responseData && responseData.avatar) {
        updateUser({ avatar: responseData.avatar, profile_picture: responseData.avatar })
        toast.success('Profile photo updated successfully!')
      } else if (responseData && responseData.profile_picture) {
        updateUser({ avatar: responseData.profile_picture, profile_picture: responseData.profile_picture })
        toast.success('Profile photo updated successfully!')
      } else {
        toast.error(uploadResponse.error || 'Failed to upload profile photo')
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      toast.error(error.response?.data?.error || 'Failed to upload profile photo. Please try again.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password')
      return
    }
    setLoading(true)
    try {
      const response = await deleteAccount(deletePassword)
      if (response.data) {
        toast.success('Account deleted successfully')
        setShowDeleteConfirm(false)
        setDeletePassword('')
        // Log out and redirect
        window.location.href = '/login'
      } else {
        toast.error(response.error || 'Failed to delete account')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xl bg-primary/10 text-primary">
                        {[user.first_name, user.last_name].filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-primary hover:bg-primary/90"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{user.first_name} {user.last_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRoleBadgeColor(typeof user.role === 'object' ? user.role?.role_type : '')}>
                          {typeof user.role === 'object' ? (user.role?.name || user.role?.role_type) : user.role}
                        </Badge>
                        {user.age !== undefined && user.age !== null && (
                          <Badge variant="outline">Age: {user.age}</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Member since {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        disabled={avatarUploading}
                        className="flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDefaultImages(!showDefaultImages)}
                        disabled={avatarUploading}
                        className="flex items-center gap-2"
                      >
                        <Image className="h-4 w-4" />
                        {avatarUploading ? 'Loading...' : 'Choose Default'}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, GIF or WebP. Max size 2MB
                      </p>
                    </div>

                    {/* Default Images Selection */}
                    {showDefaultImages && (
                      <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <h4 className="text-sm font-medium mb-3">Choose Default Avatar</h4>
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
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDefaultImages(false)}
                          className="mt-3"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="first_name"
                        value={editingProfile ? profileData.first_name : user.first_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                        disabled={!editingProfile}
                        className="flex-1"
                      />
                      <User className="h-5 w-5 text-gray-400 self-center" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="last_name"
                        value={editingProfile ? profileData.last_name : user.last_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                        disabled={!editingProfile}
                        className="flex-1"
                      />
                      <User className="h-5 w-5 text-gray-400 self-center" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="email"
                        type="email"
                        value={editingProfile ? profileData.email : user.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!editingProfile}
                        className="flex-1"
                      />
                      <Mail className="h-5 w-5 text-gray-400 self-center" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="age"
                        type="number"
                        value={editingProfile ? profileData.age : user.age || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                        disabled={!editingProfile}
                        className="flex-1"
                        placeholder="Enter your age"
                      />
                      <Calendar className="h-5 w-5 text-gray-400 self-center" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="phone"
                        type="tel"
                        value={editingProfile ? profileData.phone : user.phone || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!editingProfile}
                        className="flex-1"
                        placeholder="+1 (555) 123-4567"
                      />
                      <Phone className="h-5 w-5 text-gray-400 self-center" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="location"
                        value={editingProfile ? profileData.location : user.location || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                        disabled={!editingProfile}
                        className="flex-1"
                        placeholder="City, Country"
                      />
                      <MapPin className="h-5 w-5 text-gray-400 self-center" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="website"
                        type="url"
                        value={editingProfile ? profileData.website : user.website || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                        disabled={!editingProfile}
                        className="flex-1"
                        placeholder="https://yourwebsite.com"
                      />
                      <Globe className="h-5 w-5 text-gray-400 self-center" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex/Gender</Label>
                    <div className="flex space-x-2">
                      <Select
                        value={editingProfile ? profileData.sex : user.sex || ''}
                        onValueChange={(value) => setProfileData(prev => ({ ...prev, sex: value }))}
                        disabled={!editingProfile}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select your sex/gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <User className="h-5 w-5 text-gray-400 self-center" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <span className="capitalize">
                        {typeof user.role === 'object' ? user.role.role_type : user.role}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span>{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                {/* Bio Field */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={editingProfile ? profileData.bio : user.bio || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!editingProfile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {editingProfile ? (
                    <>
                      <Button onClick={handleProfileUpdate} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingProfile(false)
                          setProfileData({
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            email: user.email || '',
                            age: user.age || '',
                            bio: user.bio || '',
                            phone: user.phone || '',
                            location: user.location || '',
                            website: user.website || '',
                            sex: user.sex || ''
                          })
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditingProfile(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Lectures Attended</p>
                      <p className="text-2xl font-bold">{loadingStats ? '...' : (userStats?.lectures_attended ?? 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Trophy className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quizzes Completed</p>
                      <p className="text-2xl font-bold">{loadingStats ? '...' : (userStats?.quizzes_completed ?? 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Score</p>
                      <p className="text-2xl font-bold">{loadingStats ? '...' : `${Math.round((userStats?.quiz_average_score ?? 0))}%`}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Flame className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Study Streak</p>
                      <p className="text-2xl font-bold">{loadingStats ? '...' : `${userStats?.learning_streak_days ?? 0} days`}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>
                  Your learning journey over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Machine Learning</span>
                    <span className="text-sm text-gray-600">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Deep Learning</span>
                    <span className="text-sm text-gray-600">72%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '72%' }} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Data Science</span>
                    <span className="text-sm text-gray-600">91%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '91%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={user.preferences?.notifications ?? false}
                    onCheckedChange={(checked) => handlePreferenceChange('notifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Language & Region</CardTitle>
                <CardDescription>
                  Set your preferred language and region
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={user.preferences?.language ?? 'en'}
                      onValueChange={(value) => handlePreferenceChange('language', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>
                  Customize your visual experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={user.preferences?.theme ?? 'light'}
                      onValueChange={(value) => handlePreferenceChange('theme', value as 'light' | 'dark')}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button variant="outline" onClick={handleChangePassword}>
                  Change Password
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">
                    Enable 2FA
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-red-600 mb-4">Danger Zone</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all associated data
                  </p>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => setShowDeleteConfirm(true)}>
                    Delete Account
                  </Button>
                  {showDeleteConfirm && (
                    <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded">
                      <p className="mb-2 text-red-700 font-semibold">Are you sure? This action cannot be undone.</p>
                      <Input
                        type="password"
                        placeholder="Enter your password to confirm"
                        value={deletePassword}
                        onChange={e => setDeletePassword(e.target.value)}
                        className="mb-2"
                        disabled={loading}
                      />
                      <div className="flex space-x-2">
                        <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete My Account'}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeletePassword('') }} disabled={loading}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

export default Profile