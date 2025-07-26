import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react'

interface StreamQuality {
  label: string;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}

interface StreamStats {
  bitrate: number;
  frameRate: number;
  packetLoss: number;
  latency: number;
  jitter: number;
}

interface StreamQualityManagerProps {
  isBroadcaster: boolean;
  currentQuality: StreamQuality;
  onQualityChange: (quality: StreamQuality) => void;
  streamStats: StreamStats;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  onAutoQualityToggle: (enabled: boolean) => void;
  autoQualityEnabled: boolean;
}

const STREAM_QUALITIES: StreamQuality[] = [
  { label: "Low (480p)", width: 854, height: 480, frameRate: 24, bitrate: 800 },
  { label: "Medium (720p)", width: 1280, height: 720, frameRate: 30, bitrate: 2500 },
  { label: "High (1080p)", width: 1920, height: 1080, frameRate: 30, bitrate: 5000 },
  { label: "Ultra (4K)", width: 3840, height: 2160, frameRate: 30, bitrate: 15000 }
];

export const StreamQualityManager = ({
  isBroadcaster,
  currentQuality,
  onQualityChange,
  streamStats,
  connectionQuality,
  onAutoQualityToggle,
  autoQualityEnabled
}: StreamQualityManagerProps) => {
  const [qualityHistory, setQualityHistory] = useState<StreamQuality[]>([]);
  const [recommendedQuality, setRecommendedQuality] = useState<StreamQuality>(currentQuality);

  // Auto-quality adjustment logic
  useEffect(() => {
    if (!autoQualityEnabled || !isBroadcaster) return;

    const adjustQuality = () => {
      const { packetLoss, latency, bitrate } = streamStats;
      
      let newQuality = currentQuality;
      
      // Downgrade quality if connection is poor
      if (packetLoss > 5 || latency > 200) {
        const currentIndex = STREAM_QUALITIES.findIndex(q => q.label === currentQuality.label);
        if (currentIndex > 0) {
          newQuality = STREAM_QUALITIES[currentIndex - 1];
        }
      }
      
      // Upgrade quality if connection is excellent
      if (packetLoss < 1 && latency < 50 && bitrate > currentQuality.bitrate * 1.5) {
        const currentIndex = STREAM_QUALITIES.findIndex(q => q.label === currentQuality.label);
        if (currentIndex < STREAM_QUALITIES.length - 1) {
          newQuality = STREAM_QUALITIES[currentIndex + 1];
        }
      }

      if (newQuality.label !== currentQuality.label) {
        setRecommendedQuality(newQuality);
        onQualityChange(newQuality);
        setQualityHistory(prev => [...prev, newQuality]);
      }
    };

    const interval = setInterval(adjustQuality, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [autoQualityEnabled, isBroadcaster, streamStats, currentQuality, onQualityChange]);

  const getQualityColor = (quality: StreamQuality) => {
    const index = STREAM_QUALITIES.findIndex(q => q.label === quality.label);
    if (index <= 0) return 'text-green-600';
    if (index <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good':
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Stream Quality Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto Quality Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-quality">Auto Quality Adjustment</Label>
            <p className="text-sm text-gray-600">
              Automatically adjust stream quality based on connection
            </p>
          </div>
          <Switch
            id="auto-quality"
            checked={autoQualityEnabled}
            onCheckedChange={onAutoQualityToggle}
            disabled={!isBroadcaster}
          />
        </div>

        {/* Quality Selection */}
        <div className="space-y-2">
          <Label>Stream Quality</Label>
          <Select 
            value={currentQuality.label} 
            onValueChange={(value) => {
              const quality = STREAM_QUALITIES.find(q => q.label === value);
              if (quality) onQualityChange(quality);
            }}
            disabled={autoQualityEnabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STREAM_QUALITIES.map((quality) => (
                <SelectItem key={quality.label} value={quality.label}>
                  <div className="flex items-center justify-between w-full">
                    <span>{quality.label}</span>
                    <Badge variant="outline" className={getQualityColor(quality)}>
                      {quality.bitrate} Kbps
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Connection Quality</Label>
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              <span className="text-sm capitalize">{connectionQuality}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Current Bitrate</Label>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{streamStats.bitrate} KB/s</span>
            </div>
          </div>
        </div>

        {/* Stream Statistics */}
        <div className="space-y-3">
          <Label>Stream Statistics</Label>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Frame Rate</span>
                <span className="font-medium">{streamStats.frameRate} fps</span>
              </div>
              <Progress value={(streamStats.frameRate / 30) * 100} className="h-1" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Packet Loss</span>
                <span className="font-medium">{streamStats.packetLoss}%</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - streamStats.packetLoss * 10)} 
                className="h-1" 
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Latency</span>
                <span className="font-medium">{streamStats.latency}ms</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (streamStats.latency / 10))} 
                className="h-1" 
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Jitter</span>
                <span className="font-medium">{streamStats.jitter}ms</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (streamStats.jitter / 5))} 
                className="h-1" 
              />
            </div>
          </div>
        </div>

        {/* Quality History */}
        {qualityHistory.length > 0 && (
          <div className="space-y-2">
            <Label>Quality Changes</Label>
            <div className="space-y-1">
              {qualityHistory.slice(-3).reverse().map((quality, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{quality.label}</span>
                  <Badge variant="outline" className={getQualityColor(quality)}>
                    {quality.bitrate} Kbps
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {autoQualityEnabled && recommendedQuality.label !== currentQuality.label && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Recommended Quality</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Consider switching to {recommendedQuality.label} for better performance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 