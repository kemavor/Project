import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, Info, Video, Monitor, Zap, Clock, Users, Settings, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export type StreamingArchitecture = 'mediasoup' | 'rtmp';

interface ArchitectureOption {
  id: StreamingArchitecture;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  pros: string[];
  cons: string[];
  requirements: string[];
  setupTime: string;
  quality: string;
  latency: string;
  scalability: string;
  features: string[];
  recommendedFor: string[];
  notRecommendedFor: string[];
}

interface StreamingArchitectureSelectorProps {
  onSelect: (architecture: StreamingArchitecture) => void;
  selectedArchitecture?: StreamingArchitecture;
  className?: string;
}

const architectureOptions: ArchitectureOption[] = [
  {
    id: 'mediasoup',
    title: 'Browser-Based Streaming',
    subtitle: 'Stream directly from your browser',
    description: 'Use your camera and microphone directly in the browser with WebRTC technology.',
    icon: <Monitor className="h-8 w-8 text-blue-600" />,
    pros: [
      'No additional software required',
      'Instant setup - start streaming immediately',
      'Built-in camera and microphone support',
      'Real-time chat and Q&A integration',
      'Automatic quality adaptation',
      'Works on any device with a browser',
      'No installation or configuration needed',
      'Integrated with VisionWare platform'
    ],
    cons: [
      'Limited to browser capabilities',
      'Single camera/microphone only',
      'No advanced features like overlays',
      'Quality depends on browser performance',
      'No screen sharing (basic only)',
      'Limited customization options',
      'May have browser compatibility issues',
      'No professional streaming features'
    ],
    requirements: [
      'Modern web browser (Chrome, Firefox, Safari, Edge)',
      'Camera and microphone permissions',
      'Stable internet connection',
      'No additional software needed'
    ],
    setupTime: '2-5 minutes',
    quality: 'Good (up to 1080p)',
    latency: 'Very Low (WebRTC)',
    scalability: 'Good (up to 50 concurrent viewers)',
    features: [
      'Real-time video streaming',
      'Live chat integration',
      'Q&A system',
      'Automatic quality adjustment',
      'Connection monitoring',
      'Basic screen sharing'
    ],
    recommendedFor: [
      'Quick lectures and presentations',
      'Teachers new to streaming',
      'Basic educational content',
      'Small to medium class sizes',
      'Immediate streaming needs',
      'Simple camera/microphone setup'
    ],
    notRecommendedFor: [
      'Professional broadcasting',
      'Complex multi-camera setups',
      'Advanced overlays and graphics',
      'Large audience events',
      'High-production value content',
      'Screen sharing with multiple sources'
    ]
  },
  {
    id: 'rtmp',
    title: 'Professional Broadcasting',
    subtitle: 'Use OBS Studio or professional software',
    description: 'Stream using professional broadcasting software like OBS Studio for advanced features.',
    icon: <Video className="h-8 w-8 text-purple-600" />,
    pros: [
      'Professional quality and features',
      'Multiple video/audio sources',
      'Advanced screen sharing capabilities',
      'Custom overlays and graphics',
      'Picture-in-picture layouts',
      'Recording while streaming',
      'Professional streaming features',
      'Industry-standard tools',
      'High-quality video output',
      'Advanced audio mixing'
    ],
    cons: [
      'Requires additional software installation',
      'Steeper learning curve',
      'More complex setup process',
      'Higher system requirements',
      'May require configuration time',
      'Not integrated with platform chat',
      'Separate software to manage',
      'Potential compatibility issues'
    ],
    requirements: [
      'OBS Studio or similar broadcasting software',
      'Camera and microphone hardware',
      'Stable internet connection',
      'Computer with good performance',
      'RTMP server configuration'
    ],
    setupTime: '15-30 minutes',
    quality: 'Excellent (up to 4K)',
    latency: 'Low (RTMP)',
    scalability: 'Excellent (hundreds of viewers)',
    features: [
      'Professional video streaming',
      'Multiple camera inputs',
      'Advanced screen sharing',
      'Custom overlays and graphics',
      'Audio mixing and effects',
      'Recording capabilities',
      'Stream key management',
      'Professional broadcasting tools'
    ],
    recommendedFor: [
      'Professional lectures and presentations',
      'Experienced streamers',
      'High-quality educational content',
      'Large audience events',
      'Complex multi-source setups',
      'Advanced production needs',
      'Screen sharing with multiple sources',
      'Professional broadcasting requirements'
    ],
    notRecommendedFor: [
      'Quick impromptu sessions',
      'Teachers new to streaming',
      'Simple camera-only lectures',
      'Limited technical experience',
      'Basic educational content',
      'Immediate streaming needs'
    ]
  }
];

export const StreamingArchitectureSelector: React.FC<StreamingArchitectureSelectorProps> = ({
  onSelect,
  selectedArchitecture,
  className = ''
}) => {
  const [expandedArchitecture, setExpandedArchitecture] = useState<StreamingArchitecture | null>(null);

  const handleSelect = (architecture: StreamingArchitecture) => {
    onSelect(architecture);
    toast.success(`Selected ${architecture === 'mediasoup' ? 'Browser-based' : 'Professional'} streaming`);
  };

  const toggleExpanded = (architecture: StreamingArchitecture) => {
    setExpandedArchitecture(expandedArchitecture === architecture ? null : architecture);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Streaming Method
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select the streaming architecture that best fits your needs. Each option has different features, 
          setup requirements, and use cases.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {architectureOptions.map((option) => (
          <Card 
            key={option.id}
            className={`relative transition-all duration-200 hover:shadow-lg ${
              selectedArchitecture === option.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {option.icon}
                  <div>
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription className="text-sm">{option.subtitle}</CardDescription>
                  </div>
                </div>
                {selectedArchitecture === option.id && (
                  <Badge variant="default" className="bg-blue-500">
                    Selected
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-600">{option.description}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Setup: {option.setupTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-gray-500" />
                  <span>Quality: {option.quality}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gray-500" />
                  <span>Latency: {option.latency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>Scalability: {option.scalability}</span>
                </div>
              </div>

              {/* Expandable Details */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpanded(option.id)}
                  className="w-full"
                >
                  <Info className="h-4 w-4 mr-2" />
                  {expandedArchitecture === option.id ? 'Hide Details' : 'Show Details'}
                </Button>

                {expandedArchitecture === option.id && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Pros and Cons */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Pros
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {option.pros.map((pro, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Cons
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {option.cons.map((con, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Requirements
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {option.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Key Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {option.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">Recommended For</h4>
                        <ul className="space-y-1 text-sm">
                          {option.recommendedFor.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-700 mb-2">Not Recommended For</h4>
                        <ul className="space-y-1 text-sm">
                          {option.notRecommendedFor.map((notRec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <XCircle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{notRec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleSelect(option.id)}
                  className={`flex-1 ${
                    selectedArchitecture === option.id
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {selectedArchitecture === option.id ? 'Selected' : 'Choose This Option'}
                </Button>
                
                {option.id === 'rtmp' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://obsproject.com/', '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download OBS
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Need Help Choosing?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Choose Browser-Based If:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• You want to start streaming immediately</li>
                <li>• You're new to streaming</li>
                <li>• You have a simple camera/microphone setup</li>
                <li>• You're doing basic lectures</li>
                <li>• You don't want to install additional software</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Choose Professional If:</h4>
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
  );
}; 