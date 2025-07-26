import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import VideoBackground from '../components/VideoBackground';
import { 
  BookOpen, 
  Users, 
  Video, 
  Brain, 
  Shield, 
  BarChart3, 
  Clock, 
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Presentation,
  Settings,
  Sparkles,
  Zap,
  Target,
  Star
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Change header style when scrolled past the hero section (approximately 600px)
      setIsScrolled(scrollPosition > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Video className="h-6 w-6" />,
      title: "Live Lectures",
      description: "Attend real-time lectures with interactive features and real-time collaboration.",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Smart Learning",
      description: "Advanced tools for personalized learning experiences and content generation.",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Collaborative Learning",
      description: "Work together with peers and teachers in real-time collaborative sessions.",
      gradient: "from-green-500 to-blue-600"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Insights",
      description: "Track your learning progress with detailed analytics and performance insights.",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Attendance Tracking",
      description: "Automated attendance tracking and engagement monitoring for better accountability.",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Assessment Tools",
      description: "Comprehensive assessment tools including quizzes, polls, and interactive exercises.",
      gradient: "from-teal-500 to-green-600"
    }
  ];

  const roles = [
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: "Students",
      description: "Access courses, attend lectures, participate in discussions, and track your progress.",
      features: ["Live lecture participation", "Course materials", "Progress tracking", "Collaborative learning"],
      gradient: "from-blue-500 to-indigo-600",
      color: "bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-400/30"
    },
    {
      icon: <Presentation className="h-8 w-8" />,
      title: "Teachers",
      description: "Create and manage courses, conduct live lectures, and monitor student engagement.",
      features: ["Course creation", "Live streaming", "Student analytics", "Assessment tools"],
      gradient: "from-green-500 to-emerald-600",
      color: "bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-400/30"
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "Administrators",
      description: "Manage the platform, oversee user accounts, and monitor system performance.",
      features: ["User management", "System monitoring", "Platform analytics", "Security controls"],
      gradient: "from-purple-500 to-violet-600",
      color: "bg-gradient-to-br from-purple-900/20 to-violet-900/20 border-purple-400/30"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-950">
      {/* Fixed Glassy Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/95 backdrop-blur-xl border-b border-blue-400/30 shadow-2xl' 
          : 'bg-black/20 backdrop-blur-xl border-b border-blue-400/20 shadow-2xl'
      }`}>
        <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
                <img src="/visionware-logo.png" alt="VisionWare Logo" className="w-12 h-12 rounded-2xl shadow-lg" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </div>
            <div>
                <span className={`text-2xl font-bold transition-colors duration-300 ${
                  isScrolled 
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' 
                    : 'text-white drop-shadow-lg'
                }`}>
                VisionWare
              </span>
                <p className={`text-xs font-medium transition-colors duration-300 ${
                  isScrolled 
                    ? 'text-blue-200' 
                    : 'text-blue-100 drop-shadow-lg'
                }`}>
                  e-learning reimagined
                </p>
            </div>
          </div>
          <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')} 
                className={`font-medium transition-all duration-300 ${
                  isScrolled
                    ? 'text-blue-200 hover:text-white hover:bg-blue-900/30'
                    : 'text-white hover:text-blue-300 hover:bg-white/10 border border-blue-400/30 bg-black/20 backdrop-blur-sm'
                }`}
              >
              Sign In
            </Button>
            <Button onClick={() => navigate('/register')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl text-white font-semibold border border-blue-400/30">
              Register
            </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Video Background */}
      <VideoBackground>
        <section className="container mx-auto px-4 py-20 pt-32">
        <div className="text-center max-w-6xl mx-auto">
            <Badge className="mb-6 px-6 py-3 text-sm font-semibold bg-black/30 backdrop-blur-xl text-white border border-blue-400/40 shadow-2xl">
            <Shield className="h-4 w-4 mr-2" />
            Secure Learning Platform
          </Badge>
          
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight text-white drop-shadow-2xl">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-lg">
            Next-Generation
            </span>
            <br />
              <span className="text-white drop-shadow-2xl">Learning Platform</span>
          </h1>
          
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed font-medium drop-shadow-lg">
            Experience the future of education with advanced live lectures, 
            collaborative learning, and comprehensive analytics designed for 
            students, teachers, and administrators.
          </p>
          
                     <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
             <button 
               onClick={() => navigate('/register')} 
                className="bg-black/40 backdrop-blur-xl text-white border border-blue-400/40 hover:bg-blue-900/30 text-lg px-8 py-4 font-semibold rounded-lg shadow-2xl transition-all duration-300 flex items-center justify-center whitespace-nowrap"
             >
               Register Today
                <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
             </button>
             <button 
               onClick={() => navigate('/login')} 
                className="bg-transparent text-white border-2 border-blue-400/50 hover:bg-blue-900/20 text-lg px-8 py-4 font-semibold rounded-lg shadow-2xl transition-all duration-300 backdrop-blur-sm"
             >
               Sign In
            </button>
          </div>

                     {/* Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center bg-black/40 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-blue-400/30">
                <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">10K+</div>
                <div className="text-blue-100 font-medium drop-shadow-md">Active Students</div>
             </div>
              <div className="text-center bg-black/40 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-blue-400/30">
                <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">500+</div>
                <div className="text-blue-100 font-medium drop-shadow-md">Expert Teachers</div>
             </div>
              <div className="text-center bg-black/40 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-blue-400/30">
                <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">95%</div>
                <div className="text-blue-100 font-medium drop-shadow-md">Success Rate</div>
             </div>
          </div>
        </div>
      </section>
      </VideoBackground>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Modern Education</span>
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Our platform combines cutting-edge technology with proven educational 
            methodologies to deliver an exceptional learning experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative">
              {/* Organic background shape */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl transform rotate-1 scale-105 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              
              <Card className="relative group hover:shadow-2xl transition-all duration-500 border border-blue-400/20 bg-black/30 backdrop-blur-xl shadow-xl hover:bg-black/40 hover:scale-105 hover:-rotate-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`relative w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <div className="text-white">
                        {feature.icon}
                      </div>
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-xl opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors duration-300">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-100 leading-relaxed text-sm">
                    {feature.description}
                  </CardDescription>
                  
                  {/* Interactive element */}
                  <div className="mt-4 flex items-center text-blue-300 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Learn more</span>
                    <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </CardContent>
                
                {/* Decorative accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Designed for
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Every Role</span>
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Our platform serves the entire educational ecosystem with role-specific 
            features and capabilities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <div key={index} className="group relative">
              {/* Organic background shape */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-3xl transform -rotate-1 scale-105 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              
              <Card className={`relative group hover:shadow-2xl transition-all duration-500 border border-blue-400/20 bg-black/30 backdrop-blur-xl shadow-xl hover:bg-black/40 hover:scale-105 hover:rotate-1 ${role.color}`}>
                <CardHeader className="text-center pb-6">
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${role.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-white">
                        {role.icon}
                      </div>
                      {/* Subtle glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} rounded-2xl opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-300`}></div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full group-hover:scale-150 transition-transform duration-500 delay-100"></div>
                  </div>
                  
                  <CardTitle className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors duration-300">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-blue-100 leading-relaxed text-sm mt-2">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {role.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-blue-100 group-hover:text-white transition-colors duration-300">
                        <div className="relative mr-3">
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <div className="absolute inset-0 bg-green-400/20 rounded-full blur-sm group-hover:scale-150 transition-transform duration-300"></div>
                        </div>
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Interactive element */}
                  <div className="mt-6 pt-4 border-t border-blue-400/20">
                    <div className="flex items-center justify-center text-blue-300 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Explore {role.title.toLowerCase()}</span>
                      <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </CardContent>
                
                {/* Decorative accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-xl rounded-3xl p-12 text-center text-white border border-blue-400/30 shadow-2xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Learning Experience?
          </h2>
            <p className="text-xl mb-8 text-blue-100">
            Join our secure learning platform and experience the future of education. 
            Register today to get started or sign in to your existing account.
          </p>
                         <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
               <Button size="lg" onClick={() => navigate('/login')} variant="secondary" className="bg-white/20 backdrop-blur-xl text-white hover:bg-white/30 text-lg px-8 py-4 shadow-2xl font-semibold border border-white/30">
            Sign In to Your Account
                 <ArrowRight className="ml-2 h-5 w-5" />
               </Button>
               <Button size="lg" variant="secondary" onClick={() => navigate('/register')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 shadow-2xl font-semibold border border-blue-400/30">
                 Register Today
          </Button>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/80 backdrop-blur-xl text-white py-12 border-t border-blue-400/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="relative">
              <img src="/visionware-logo.png" alt="VisionWare Logo" className="w-8 h-8 rounded-lg" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-1.5 w-1.5 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              VisionWare
            </span>
          </div>
          <div className="text-center">
            <p className="text-blue-200 text-sm mb-4">
            © 2024 VisionWare. All rights reserved. Secure learning platform for educational institutions.
          </p>
            <div className="flex justify-center space-x-6 text-sm text-blue-200">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Contact Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;