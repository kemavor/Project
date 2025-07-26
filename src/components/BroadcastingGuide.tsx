import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Download, 
  Settings, 
  Video, 
  Mic, 
  Monitor, 
  Copy,
  CheckCircle,
  ExternalLink,
  Info
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BroadcastingGuideProps {
  lectureId: string;
  serverUrl: string;
}

export const BroadcastingGuide = ({ lectureId, serverUrl }: BroadcastingGuideProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const rtmpUrl = `rtmp://${serverUrl}:1935/live/${lectureId}`;
  const streamKey = lectureId;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const obsSettings = {
    url: rtmpUrl,
    streamKey: streamKey,
    videoBitrate: 5000,
    audioBitrate: 128,
    fps: 30,
    resolution: '1920x1080'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Broadcasting Setup Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="obs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="obs">OBS Studio</TabsTrigger>
            <TabsTrigger value="streamlabs">Streamlabs</TabsTrigger>
            <TabsTrigger value="manual">Manual Setup</TabsTrigger>
          </TabsList>

          {/* OBS Studio Setup */}
          <TabsContent value="obs" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="font-medium">Step 1: Download OBS Studio</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://obsproject.com/', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Download OBS
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Step 2: Configure Stream Settings</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stream URL</Label>
                    <div className="flex gap-2">
                      <Input value={obsSettings.url} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(obsSettings.url, 'Stream URL')}
                      >
                        {copied === 'Stream URL' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Stream Key</Label>
                    <div className="flex gap-2">
                      <Input value={obsSettings.streamKey} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(obsSettings.streamKey, 'Stream Key')}
                      >
                        {copied === 'Stream Key' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Step 3: Recommended Settings</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Video Bitrate:</span>
                    <span className="ml-2 font-medium">{obsSettings.videoBitrate} Kbps</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Audio Bitrate:</span>
                    <span className="ml-2 font-medium">{obsSettings.audioBitrate} Kbps</span>
                  </div>
                  <div>
                    <span className="text-gray-600">FPS:</span>
                    <span className="ml-2 font-medium">{obsSettings.fps}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Resolution:</span>
                    <span className="ml-2 font-medium">{obsSettings.resolution}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Step 4: OBS Setup Instructions</Label>
                <div className="space-y-2 text-sm">
                  <p>1. Open OBS Studio</p>
                  <p>2. Go to <strong>Settings → Stream</strong></p>
                  <p>3. Select <strong>Custom</strong> as service</p>
                  <p>4. Enter the Stream URL and Stream Key above</p>
                  <p>5. Go to <strong>Settings → Video</strong></p>
                  <p>6. Set Output Resolution to <strong>1920x1080</strong></p>
                  <p>7. Go to <strong>Settings → Output</strong></p>
                  <p>8. Set Video Bitrate to <strong>5000 Kbps</strong></p>
                  <p>9. Add your camera and microphone as sources</p>
                  <p>10. Click <strong>Start Streaming</strong></p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Streamlabs Setup */}
          <TabsContent value="streamlabs" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="font-medium">Step 1: Download Streamlabs OBS</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://streamlabs.com/', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Download Streamlabs
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Step 2: Configure Custom RTMP</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Server URL</Label>
                    <div className="flex gap-2">
                      <Input value={obsSettings.url} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(obsSettings.url, 'Server URL')}
                      >
                        {copied === 'Server URL' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Stream Key</Label>
                    <div className="flex gap-2">
                      <Input value={obsSettings.streamKey} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(obsSettings.streamKey, 'Stream Key')}
                      >
                        {copied === 'Stream Key' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Step 3: Streamlabs Setup Instructions</Label>
                <div className="space-y-2 text-sm">
                  <p>1. Open Streamlabs OBS</p>
                  <p>2. Go to <strong>Settings → Stream</strong></p>
                  <p>3. Select <strong>Custom</strong> as platform</p>
                  <p>4. Enter the Server URL and Stream Key above</p>
                  <p>5. Configure your scenes and sources</p>
                  <p>6. Add overlays and alerts if desired</p>
                  <p>7. Click <strong>Go Live</strong></p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Manual Setup */}
          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Manual RTMP Configuration</span>
                </div>
                <p className="text-sm text-blue-700">
                  Use these settings with any RTMP-compatible broadcasting software.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>RTMP Server Information</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Server URL</Label>
                      <div className="flex gap-2">
                        <Input value={obsSettings.url} readOnly />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(obsSettings.url, 'Server URL')}
                        >
                          {copied === 'Server URL' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Stream Key</Label>
                      <div className="flex gap-2">
                        <Input value={obsSettings.streamKey} readOnly />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(obsSettings.streamKey, 'Stream Key')}
                        >
                          {copied === 'Stream Key' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Recommended Settings</Label>
                  <Textarea
                    value={`Video Bitrate: ${obsSettings.videoBitrate} Kbps
Audio Bitrate: ${obsSettings.audioBitrate} Kbps
FPS: ${obsSettings.fps}
Resolution: ${obsSettings.resolution}
Codec: H.264
Audio Codec: AAC`}
                    readOnly
                    className="h-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Compatible Software</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Badge variant="outline">OBS Studio</Badge>
                    <Badge variant="outline">Streamlabs OBS</Badge>
                    <Badge variant="outline">XSplit</Badge>
                    <Badge variant="outline">Wirecast</Badge>
                    <Badge variant="outline">vMix</Badge>
                    <Badge variant="outline">FFmpeg</Badge>
                    <Badge variant="outline">Restream</Badge>
                    <Badge variant="outline">ManyCam</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 