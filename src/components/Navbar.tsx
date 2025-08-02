import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Bell, BookOpen, GraduationCap, LogOut, Settings, User, Menu, X, Video, FileText, Play, MessageSquare, Home } from 'lucide-react';
import NotificationsPanel from './NotificationsPanel';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModeToggle } from './ModeToggle';
import { apiClient } from '../lib/api';

// Version for cache busting
const NAVBAR_VERSION = '2.0.0';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await apiClient.getNotifications();
      if (response.data && Array.isArray(response.data)) {
        const unread = response.data.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh notification count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const getNavButtonClass = (path: string) => {
    return `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-blue-500 text-white hover:bg-blue-600'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-border/40 sticky top-0 z-50" data-version={NAVBAR_VERSION}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Logo and Brand */}
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                <img
                  className="h-6 w-6 rounded-full"
                  src="/visionware-logo.png"
                  alt="VisionWare"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">VisionWare</span>
            </div>
          </div>

          {/* Center - Main Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            {user ? (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className={getNavButtonClass('/dashboard')}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>

                {/* Student Navigation */}
                {user?.role === 'student' && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/courses')}
                      className={getNavButtonClass('/courses')}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Courses</span>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => navigate('/my-courses')}
                      className={getNavButtonClass('/my-courses')}
                    >
                      <GraduationCap className="h-4 w-4" />
                      <span>My Courses</span>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => navigate('/livestream')}
                      className={getNavButtonClass('/livestream')}
                    >
                      <Video className="h-4 w-4" />
                      <span>Live Streams</span>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => navigate('/chatbot')}
                      className={getNavButtonClass('/chatbot')}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>ECHO</span>
                    </Button>
                  </>
                )}

                {/* Teacher Navigation */}
                {user?.role === 'teacher' && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/teacher/courses')}
                      className={getNavButtonClass('/teacher/courses')}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>My Courses</span>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => navigate('/livestream/create')}
                      className={getNavButtonClass('/livestream/create')}
                    >
                      <Video className="h-4 w-4" />
                      <span>Create Stream</span>
                    </Button>



                    <Button
                      variant="ghost"
                      onClick={() => navigate('/chatbot')}
                      className={getNavButtonClass('/chatbot')}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>ECHO</span>
                    </Button>
                  </>
                )}

                {/* Admin Navigation */}
                {user?.role === 'admin' && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/admin')}
                      className={getNavButtonClass('/admin')}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className={getNavButtonClass('/')}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate('/courses')}
                  className={getNavButtonClass('/courses')}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Courses</span>
                </Button>
              </div>
            )}
          </div>

          {/* Right Side - User Menu and Notifications */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotificationsOpen((open) => !open);
                      if (!notificationsOpen) {
                        fetchUnreadCount(); // Refresh count when opening
                      }
                    }}
                    className="relative p-2"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-xs font-bold shadow-md">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 z-50">
                      <NotificationsPanel onNotificationUpdate={fetchUnreadCount} />
                    </div>
                  )}
                </div>

                {/* Theme Toggle */}
                <ModeToggle />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>{user.first_name?.[0] || user.username[0]}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.first_name} {user.last_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
                  className="w-full justify-start"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>

                {/* Student Mobile Navigation */}
                {user?.role === 'student' && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => { navigate('/courses'); setMobileMenuOpen(false); }}
                      className="w-full justify-start"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Courses
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => { navigate('/my-courses'); setMobileMenuOpen(false); }}
                      className="w-full justify-start"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      My Courses
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => { navigate('/livestream'); setMobileMenuOpen(false); }}
                      className="w-full justify-start"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Live Streams
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => { navigate('/chatbot'); setMobileMenuOpen(false); }}
                      className="w-full justify-start"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      ECHO
                    </Button>
                  </>
                )}

                {/* Teacher Mobile Navigation */}
                {user?.role === 'teacher' && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => { navigate('/teacher/courses'); setMobileMenuOpen(false); }}
                      className="w-full justify-start"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      My Courses
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => { navigate('/livestream/create'); setMobileMenuOpen(false); }}
                      className="w-full justify-start"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Create Stream
                    </Button>



                    <Button
                      variant="ghost"
                      onClick={() => { navigate('/chatbot'); setMobileMenuOpen(false); }}
                      className="w-full justify-start"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      ECHO
                    </Button>
                  </>
                )}

                {/* Admin Mobile Navigation */}
                {user?.role === 'admin' && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                      className="w-full justify-start"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                  className="w-full justify-start"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => { navigate('/courses'); setMobileMenuOpen(false); }}
                  className="w-full justify-start"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Courses
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 