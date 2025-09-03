import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MessageSquare, Brain, BookOpen, Lightbulb, Users, Zap } from 'lucide-react';

interface ECHOWelcomeProps {
  onStartChat: () => void;
}

const ECHOWelcome: React.FC<ECHOWelcomeProps> = ({ onStartChat }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
             <div className="text-center mb-8">
         <div className="inline-flex items-center justify-center mb-6">
           <img src="/ECHO.png" alt="ECHO Logo" className="max-w-48 max-h-48 w-auto h-auto" />
         </div>
        <h1 className="text-4xl font-bold text-black mb-3">Welcome to ECHO</h1>
        <p className="text-xl text-black mb-2">Educational Context Handler Oracle</p>
        <p className="text-black">Your intelligent AI learning assistant that processes, understands, and reflects back knowledge</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg text-black font-bold">Educational Context Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-black">ECHO understands and analyzes your course materials, lectures, and discussions to provide contextual help.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg text-black font-bold">Knowledge Reflection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-black">ECHO mirrors back understanding in clear, educational ways, building upon your existing knowledge.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <Lightbulb className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-lg text-black font-bold">Oracle Wisdom</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-black">Get insightful, well-reasoned guidance and recommendations for your learning journey.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle className="text-lg text-black font-bold">Personalized Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-black">ECHO adapts to your specific courses, learning style, and educational needs.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-lg text-black font-bold">Active Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-black">Engage with content dynamically through real-time conversations and interactive learning.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
            <CardTitle className="text-lg text-black font-bold">24/7 Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-black">Get help whenever you need it, with persistent chat sessions and conversation history.</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-black mb-3">Ready to Start Learning with ECHO?</h3>
          <p className="text-black mb-4">Ask questions about your coursework, get study guidance, or explore course concepts with your intelligent AI assistant.</p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge className="text-sm bg-blue-100 text-blue-800 border-blue-300 font-medium">Course Content</Badge>
            <Badge className="text-sm bg-green-100 text-green-800 border-green-300 font-medium">Study Strategies</Badge>
            <Badge className="text-sm bg-purple-100 text-purple-800 border-purple-300 font-medium">Concept Explanations</Badge>
            <Badge className="text-sm bg-orange-100 text-orange-800 border-orange-300 font-medium">Assignment Help</Badge>
            <Badge className="text-sm bg-indigo-100 text-indigo-800 border-indigo-300 font-medium">Learning Resources</Badge>
          </div>
        </div>
        
        <Button 
          onClick={onStartChat}
          size="lg"
          className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 text-lg"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Start Chatting with ECHO
        </Button>
      </div>
    </div>
  );
};

export default ECHOWelcome; 