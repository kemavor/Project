import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { StreamingArchitectureSelector, StreamingArchitecture } from '../components/StreamingArchitectureSelector';
import { StreamingSetupGuide } from '../components/StreamingSetupGuide';
import { useStreamingArchitecture } from '../hooks/useStreamingArchitecture';
import { Video, Monitor, Settings, Play, Users, Clock, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StreamingDemo: React.FC = () => {
  const navigate = useNavigate();
  const [selectedArchitecture, setSelectedArchitecture] = useState<StreamingArchitecture>('mediasoup');
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [demoStreamId] = useState('demo-stream-123');

  const {
    architecture,
    setArchitecture,
    getArchitectureInfo,
    getStreamingConfig
  } = useStreamingArchitecture(selectedArchitecture);

  const handleArchitectureSelect = (architecture: StreamingArchitecture) => {
    setSelectedArchitecture(architecture);
    setArchitecture(architecture);
    toast.success(`Selected ${architecture === 'mediasoup' ? 'Browser-based' : 'Professional'} streaming`);
  };

  const handleStartDemo = () => {
    const config = getStreamingConfig();
    const info = getArchitectureInfo();
    
    toast.success(`Demo started with ${info.title}!`);
    console.log('Demo streaming config:', config);
  };

  const architectureStats = {
    mediasoup: {
      setupTime: '2-5 minutes',
      quality: 'Good (up to 1080p)',
      latency: 'Very Low (WebRTC)',
      scalability: 'Good (up to 50 viewers)',
      features: ['Real-time chat', 'Q&A system', 'Automatic quality adjustment', 'No software needed']
    },
    rtmp: {
      setupTime: '15-30 minutes',
      quality: 'Excellent (up to 4K)',
      latency: 'Low (RTMP)',
      scalability: 'Excellent (hundreds of viewers)',
      features: ['Professional quality', 'Multiple sources', 'Advanced overlays', 'Recording capabilities']
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Streaming Architecture Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore and test different streaming methods for your VisionWare lectures. 
            Choose the architecture that best fits your teaching style and technical requirements.
          </p>
        </div>

        {/* Architecture Comparison */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Browser-Based (MediaSoup) */}
          <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-xl">Browser-Based Streaming</CardTitle>
                    <CardDescription>Stream directly from your browser</CardDescription>
                  </div>
                </div>
                {selectedArchitecture === 'mediasoup' && (
                  <Badge variant="default" className="bg-blue-500">Selected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Use your camera and microphone directly in the browser with WebRTC technology.
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Setup: {architectureStats.mediasoup.setupTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-500" />
                    <span>Quality: {architectureStats.mediasoup.quality}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gray-500" />
                    <span>Latency: {architectureStats.mediasoup.latency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Scalability: {architectureStats.mediasoup.scalability}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Key Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {architectureStats.mediasoup.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleArchitectureSelect('mediasoup')}
                  className={`w-full ${
                    selectedArchitecture === 'mediasoup'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {selectedArchitecture === 'mediasoup' ? 'Selected' : 'Choose Browser-Based'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Professional (RTMP) */}
          <Card className="border-2 border-purple-200 hover:border-purple-300 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-purple-600" />
                  <div>
                    <CardTitle className="text-xl">Professional Broadcasting</CardTitle>
                    <CardDescription>Use OBS Studio or professional software</CardDescription>
                  </div>
                </div>
                {selectedArchitecture === 'rtmp' && (
                  <Badge variant="default" className="bg-purple-500">Selected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Stream using professional broadcasting software like OBS Studio for advanced features.
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Setup: {architectureStats.rtmp.setupTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-500" />
                    <span>Quality: {architectureStats.rtmp.quality}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gray-500" />
                    <span>Latency: {architectureStats.rtmp.latency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Scalability: {architectureStats.rtmp.scalability}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Key Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {architectureStats.rtmp.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleArchitectureSelect('rtmp')}
                    className={`flex-1 ${
                      selectedArchitecture === 'rtmp'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {selectedArchitecture === 'rtmp' ? 'Selected' : 'Choose Professional'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://obsproject.com/', '_blank')}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Demo Controls
            </CardTitle>
            <CardDescription>
              Test the selected streaming architecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium mb-1">Selected Architecture: {getArchitectureInfo().title}</h4>
                <p className="text-sm text-gray-600">{getArchitectureInfo().description}</p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleStartDemo}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Demo
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowSetupGuide(!showSetupGuide)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showSetupGuide ? 'Hide' : 'Show'} Setup Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Guide */}
        {showSetupGuide && (
          <div className="mb-8">
            <StreamingSetupGuide 
              architecture={selectedArchitecture}
              streamId={demoStreamId}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => navigate('/livestream/create')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Video className="h-4 w-4 mr-2" />
            Create Real Stream
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help Choosing?</CardTitle>
            <CardDescription>
              Here's a quick guide to help you decide
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-green-700">Choose Browser-Based If:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• You want to start streaming immediately</li>
                  <li>• You're new to streaming</li>
                  <li>• You have a simple camera/microphone setup</li>
                  <li>• You're doing basic lectures</li>
                  <li>• You don't want to install additional software</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-purple-700">Choose Professional If:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• You need high-quality video</li>
                  <li>• You want advanced features (overlays, effects)</li>
                  <li>• You're experienced with streaming software</li>
                  <li>• You need screen sharing with multiple sources</li>
                  <li>• You're doing professional presentations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StreamingDemo; 