import React, { useState } from 'react';
import FlvVideoPlayer from '../components/FlvVideoPlayer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'react-hot-toast';

const StreamTest: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [streamKey, setStreamKey] = useState('609860e6-de40-4c74-acbd-28fb6c09ea32');

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const testStreamKey = '609860e6-de40-4c74-acbd-28fb6c09ea32';

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>FLV Video Player Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stream Key:</label>
              <input
                type="text"
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter stream key"
              />
            </div>
            
            <div className="aspect-video bg-gray-900">
              <FlvVideoPlayer
                src={`http://localhost:8001/live/${streamKey}.flv`}
                className="w-full h-full object-cover"
                controls={true}
                autoPlay={true}
                muted={isMuted}
                onError={(error) => {
                  console.log('FLV player error:', error);
                  toast.error('Failed to load video stream');
                }}
                onLoad={() => {
                  console.log('FLV stream loaded successfully');
                  toast.success('Stream connected successfully');
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={toggleMute}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
              <Button onClick={() => setStreamKey(testStreamKey)}>
                Use Test Stream Key
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>Test Stream Key:</strong> {testStreamKey}</p>
              <p><strong>RTMP Server:</strong> rtmp://localhost:1935/live</p>
              <p><strong>FLV URL:</strong> http://localhost:8001/live/{streamKey}.flv</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamTest; 