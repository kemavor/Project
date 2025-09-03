import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import VideoBackground from '../components/VideoBackground';
import { HoverEffect } from '../components/ui/card-hover-effect';
import { GlowingEffect } from '../components/ui/glowing-effect';
import { TextRevealCard, TextRevealCardTitle, TextRevealCardDescription } from '../components/ui/text-reveal-card';
import { cn } from '../lib/utils';
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
  Star,
  MessageSquare,
  TrendingUp,
  Calendar,
  FileText,
  Mic,
  Monitor
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
      icon: <Mic className="h-6 w-6" />,
      title: "Live Classes",
      description: "Join live classes from anywhere. Ask questions, participate in discussions, and learn in real-time with your classmates.",
      color: "text-blue-600"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Group Discussions",
      description: "Chat with classmates, share notes, and work on projects together. Learning is better when you're not alone.",
      color: "text-purple-600"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Track Your Progress",
      description: "See how you're doing with easy-to-understand charts and reports. Know exactly where you need to improve.",
      color: "text-green-600"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Never Miss a Class",
      description: "Get reminders for upcoming classes and automatically track your attendance. Stay on top of your learning schedule.",
      color: "text-orange-600"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Study Materials",
      description: "Access all your course materials, notes, and assignments in one place. Everything you need, organized and ready.",
      color: "text-indigo-600"
    },
    {
      icon: <Monitor className="h-6 w-6" />,
      title: "Practice Tests",
      description: "Test your knowledge with quizzes and practice exams. Get instant feedback to help you learn faster.",
      color: "text-green-600"
    }
  ];

  const roles = [
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: "Students",
      description: "Join classes, study with friends, and track your learning journey. Everything you need to succeed is right here.",
      features: ["Join live classes", "Study with classmates", "Track your progress", "Access course materials"],
      color: "bg-blue-900/20 border-blue-400/30"
    },
    {
      icon: <Presentation className="h-8 w-8" />,
      title: "Teachers",
      description: "Create engaging courses, teach live classes, and help your students succeed. Make teaching easier and more effective.",
      features: ["Create courses", "Teach live classes", "Track student progress", "Create assignments"],
      color: "bg-green-900/20 border-green-400/30"
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "School Admins",
      description: "Manage your school's learning platform, help teachers and students, and keep everything running smoothly.",
      features: ["Manage users", "Monitor classes", "View reports", "Support teachers"],
      color: "bg-blue-900/20 border-blue-400/30"
    }
  ];

  return (
    <div className="min-h-screen bg-black">
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
            </div>
            <div>
                <span className={`text-2xl font-bold transition-colors duration-300 ${
                  isScrolled 
                    ? 'text-blue-600' 
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
                    ? 'text-gray-200 hover:text-white hover:bg-black/30'
: 'text-white hover:text-gray-300 hover:bg-white/10 border border-gray-400/30 bg-black/20 backdrop-blur-sm'
                }`}
              >
              Sign In
            </Button>
            <Button onClick={() => navigate('/register')} className="bg-gray-700 hover:bg-gray-800 shadow-xl text-white font-semibold border border-gray-400/30">
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
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight text-white drop-shadow-2xl">
              <span className="text-blue-300 drop-shadow-lg">
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
                className="bg-black/40 backdrop-blur-xl text-white border border-gray-400/40 hover:bg-black/30 text-lg px-8 py-4 font-semibold rounded-lg shadow-2xl transition-all duration-300 flex items-center justify-center whitespace-nowrap"
             >
               Register Today
                <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
             </button>
             <button 
               onClick={() => navigate('/login')} 
                className="bg-transparent text-white border-2 border-gray-400/50 hover:bg-black/20 text-lg px-8 py-4 font-semibold rounded-lg shadow-2xl transition-all duration-300 backdrop-blur-sm"
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
      <section className="w-full bg-white py-20">
        <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
            Everything You Need to
            <span className="text-blue-600"> Learn Better</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            We've built the tools that make learning easier, more engaging, and more effective. 
            Whether you're a student or teacher, you'll find everything you need here.
          </p>
        </div>
        
        <HoverEffect 
          items={features.map(feature => ({
            title: feature.title,
            description: feature.description,
            icon: feature.icon,
            color: feature.color
          }))}
          className="max-w-5xl mx-auto px-4"
        />
        </div>
      </section>

      {/* Roles Section */}
      <section className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Built for
            <span className="text-blue-600"> Everyone</span>
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Whether you're learning, teaching, or managing a school, we've got you covered. 
            Each role has the tools they need to succeed.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="h-[24rem]">
            <TextRevealCard
              text="Students"
              revealText="Join classes, study with friends, and track your learning journey. Everything you need to succeed is right here."
            >
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="mt-6 space-y-2">
                {["Join live classes", "Study with classmates", "Track your progress", "Access course materials"].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </TextRevealCard>
          </div>

          <div className="h-[24rem]">
            <TextRevealCard
              text="Teachers"
              revealText="Create engaging courses, teach live classes, and help your students succeed. Make teaching easier and more effective."
            >
              <div className="flex items-center gap-3 mb-4">
                <Presentation className="h-6 w-6 text-white" />
              </div>
              <div className="mt-6 space-y-2">
                {["Create courses", "Teach live classes", "Track student progress", "Create assignments"].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </TextRevealCard>
          </div>

          <div className="h-[24rem]">
            <TextRevealCard
              text="School Admins"
              revealText="Manage your school's learning platform, help teachers and students, and keep everything running smoothly."
            >
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div className="mt-6 space-y-2">
                {["Manage users", "Monitor classes", "View reports", "Support teachers"].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </TextRevealCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative flex h-[50rem] w-full items-center justify-center bg-black">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:40px_40px]",
            "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
          )}
        />
        {/* Radial gradient for the container to give a faded look */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        
        <div className="relative z-20 max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
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
            <Button size="lg" variant="secondary" onClick={() => navigate('/register')} className="bg-gray-700 hover:bg-gray-800 text-white text-lg px-8 py-4 shadow-2xl font-semibold border border-gray-400/30">
              Register Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/80 backdrop-blur-xl text-white py-12 border-t border-blue-400/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="relative">
              <img src="/visionware-logo.png" alt="VisionWare Logo" className="w-8 h-8 rounded-lg" />
            </div>
            <span className="text-2xl font-bold text-blue-600">
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