import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Download,
  BookmarkPlus,
  Eye,
  EyeOff,
  MessageSquare,
  HelpCircle
} from 'lucide-react'

interface ViewerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  isFullscreen: boolean;
  onFullscreen: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  viewerCount: number;
  onToggleChat: () => void;
  onToggleQa: () => void;
  onDownload: () => void;
  onBookmark: () => void;
  showTranscription: boolean;
  onToggleTranscription: () => void;
}

const CameraSelector: React.FC = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Detect cameras
  const detectCameras = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === "videoinput");
    setDevices(videoDevices);
  };

  // Start camera preview
  const handleSelectCamera = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } }
    });
    setStream(newStream);
    const video = document.getElementById("camera-preview") as HTMLVideoElement;
    if (video) {
      video.srcObject = newStream;
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={detectCameras}>Add Camera</button>
      {devices.length > 0 && (
        <select
          onChange={e => handleSelectCamera(e.target.value)}
          value={selectedDeviceId || ""}
        >
          <option value="" disabled>Select a camera</option>
          {devices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>
      )}
      <div>
        <video id="camera-preview" autoPlay style={{ width: 320, height: 240, marginTop: 8 }} />
      </div>
    </div>
  );
};

export const ViewerControls = ({
  isPlaying,
  onPlayPause,
  volume,
  onVolumeChange,
  isFullscreen,
  onFullscreen,
  currentTime,
  duration,
  onSeek,
  viewerCount,
  onToggleChat,
  onToggleQa,
  onDownload,
  onBookmark,
  showTranscription,
  onToggleTranscription
}: ViewerControlsProps) => {
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleProgressClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    onSeek(newTime);
  }, [duration, onSeek]);

  return (
    <div className="space-y-4">
      <CameraSelector />
      {/* Main Video Controls */}
      <Card>
        <CardContent className="p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div 
              className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="absolute h-full bg-blue-500 rounded-full transition-all duration-150"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onPlayPause}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
                >
                  {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {viewerCount} viewers
              </Badge>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Interactive Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleChat}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onToggleQa}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Q&A
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranscription}
              className="flex items-center gap-2"
            >
              {showTranscription ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showTranscription ? "Hide" : "Show"} Transcript
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onBookmark}
              className="flex items-center gap-2"
            >
              <BookmarkPlus className="h-4 w-4" />
              Bookmark
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Controls
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
            >
              {showAdvancedControls ? "Hide" : "Show"}
            </Button>
          </div>
        </CardHeader>
        {showAdvancedControls && (
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Playback Speed</Label>
                  <Select defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x (Normal)</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Video Quality</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="1080p">1080p</SelectItem>
                      <SelectItem value="720p">720p</SelectItem>
                      <SelectItem value="480p">480p</SelectItem>
                      <SelectItem value="360p">360p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="autoplay">Autoplay</Label>
                  <p className="text-sm text-gray-600">Automatically play next lecture</p>
                </div>
                <Switch id="autoplay" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-sm text-gray-600">Get notified about new content</p>
                </div>
                <Switch id="notifications" />
              </div>

              <Button
                variant="outline"
                onClick={onDownload}
                className="w-full flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Lecture
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}; 