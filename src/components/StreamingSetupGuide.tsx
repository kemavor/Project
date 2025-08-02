import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  Download, 
  Video, 
  Monitor, 
  Settings, 
  Copy, 
  ExternalLink,
  AlertCircle,
  Info
} from 'lucide-react';
import { StreamingArchitecture } from './StreamingArchitectureSelector';
import { toast } from 'react-hot-toast';

interface StreamingSetupGuideProps {
  architecture: StreamingArchitecture;
  streamId?: string;
  className?: string;
}

interface SetupStep {
  step: number;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon: React.ReactNode;
  };
}

export const StreamingSetupGuide: React.FC<StreamingSetupGuideProps> = ({
  architecture,
  streamId,
  className = ''
}) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getSetupSteps = (): SetupStep[] => {
    if (architecture === 'mediasoup') {
      return [
        {
          step: 1,
          title: 'Grant Permissions',
          description: 'Allow your browser to access camera and microphone when prompted.',
                      action: {
              label: 'Test Permissions',
              onClick: async () => {
                try {
                  await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                  toast.success('Camera and microphone access granted!');
                } catch (error) {
                  toast.error('Please grant camera and microphone permissions');
                }
              },
              icon: <Video className="h-4 w-4" />
            }
        },
        {
          step: 2,
          title: 'Start Stream',
          description: 'Click the "Start Stream" button to begin broadcasting.',
        },
        {
          step: 3,
          title: 'Share Stream Link',
          description: 'Share the stream link with your students so they can join.',
        },
        {
          step: 4,
          title: 'Begin Teaching',
          description: 'Start your lecture! Students can ask questions in the chat.',
        }
      ];
    } else {
      return [
        {
          step: 1,
          title: 'Download OBS Studio',
          description: 'Download and install OBS Studio from the official website.',
          action: {
            label: 'Download OBS',
            onClick: () => window.open('https://obsproject.com/', '_blank'),
            icon: <Download className="h-4 w-4" />
          }
        },
        {
          step: 2,
          title: 'Configure OBS Settings',
          description: 'Set up OBS with the provided RTMP settings.',
          action: {
            label: 'Copy Settings',
            onClick: () => copyToClipboard(
              `Server: rtmp://localhost:1935/live\nStream Key: ${streamId || 'your-stream-key'}`,
              'OBS Settings'
            ),
            icon: <Copy className="h-4 w-4" />
          }
        },
        {
          step: 3,
          title: 'Add Sources',
          description: 'Add your camera, microphone, and screen capture sources in OBS.',
        },
        {
          step: 4,
          title: 'Start Streaming',
          description: 'Click "Start Streaming" in OBS to begin broadcasting.',
        },
        {
          step: 5,
          title: 'Share Stream Link',
          description: 'Share the stream link with your students so they can join.',
        }
      ];
    }
  };

  const getRequirements = () => {
    if (architecture === 'mediasoup') {
      return [
        'Modern web browser (Chrome, Firefox, Safari, Edge)',
        'Camera and microphone',
        'Stable internet connection',
        'No additional software required'
      ];
    } else {
      return [
        'OBS Studio or similar broadcasting software',
        'Camera and microphone hardware',
        'Computer with good performance',
        'Stable internet connection',
        'RTMP server running'
      ];
    }
  };

  const getTroubleshooting = () => {
    if (architecture === 'mediasoup') {
      return [
        {
          issue: 'Camera not working',
          solution: 'Check browser permissions and ensure camera is not in use by another application.'
        },
        {
          issue: 'Poor video quality',
          solution: 'Check your internet connection and try reducing the resolution in settings.'
        },
        {
          issue: 'Audio not working',
          solution: 'Verify microphone permissions and check system audio settings.'
        },
        {
          issue: 'Stream won\'t start',
          solution: 'Refresh the page and try again. Ensure all permissions are granted.'
        }
      ];
    } else {
      return [
        {
          issue: 'OBS won\'t connect',
          solution: 'Verify the RTMP server is running and check the server URL and stream key.'
        },
        {
          issue: 'Poor video quality',
          solution: 'Increase bitrate in OBS settings and ensure stable internet connection.'
        },
        {
          issue: 'Audio issues',
          solution: 'Check audio sources in OBS and verify system audio settings.'
        },
        {
          issue: 'Stream lag',
          solution: 'Reduce bitrate or resolution in OBS settings.'
        }
      ];
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Setup Guide
          </CardTitle>
          <CardDescription>
            Follow these steps to start streaming with {architecture === 'mediasoup' ? 'browser-based' : 'professional'} streaming
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getSetupSteps().map((step) => (
              <div key={step.step} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{step.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  {step.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={step.action.onClick}
                      className="flex items-center gap-2"
                    >
                      {step.action.icon}
                      {step.action.label}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Requirements
          </CardTitle>
          <CardDescription>
            Make sure you have everything needed to start streaming
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {getRequirements().map((req, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{req}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Configuration Details */}
      {architecture === 'rtmp' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              OBS Studio Configuration
            </CardTitle>
            <CardDescription>
              Use these settings in OBS Studio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Server URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">
                      rtmp://localhost:1935/live
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard('rtmp://localhost:1935/live', 'Server URL')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Stream Key</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">
                      {streamId || 'your-stream-key'}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(streamId || 'your-stream-key', 'Stream Key')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Video Settings</label>
                  <div className="mt-1 space-y-1 text-sm text-gray-600">
                    <div>Resolution: 1920x1080</div>
                    <div>FPS: 30</div>
                    <div>Bitrate: 5000 Kbps</div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Audio Settings</label>
                  <div className="mt-1 space-y-1 text-sm text-gray-600">
                    <div>Sample Rate: 48kHz</div>
                    <div>Bitrate: 128 Kbps</div>
                    <div>Channels: Stereo</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Troubleshooting
          </CardTitle>
          <CardDescription>
            Common issues and solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getTroubleshooting().map((item, index) => (
              <div key={index} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-1">{item.issue}</h4>
                <p className="text-sm text-yellow-800">{item.solution}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Help Resources
          </CardTitle>
          <CardDescription>
            Get additional help and support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {architecture === 'mediasoup' ? (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Browser Media API Documentation
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://webrtc.org/', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  WebRTC Information
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://obsproject.com/wiki/', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  OBS Studio Documentation
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://obsproject.com/forum/', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  OBS Community Forum
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open('/support', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              VisionWare Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 