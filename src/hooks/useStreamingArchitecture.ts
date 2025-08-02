import { useState, useEffect } from 'react';
import { StreamingArchitecture } from '../components/StreamingArchitectureSelector';

interface StreamingArchitectureConfig {
  architecture: StreamingArchitecture;
  serverUrl: string;
  rtmpUrl?: string;
  streamKey?: string;
  qualitySettings: {
    width: number;
    height: number;
    frameRate: number;
    bitrate: number;
  };
}

interface UseStreamingArchitectureReturn {
  architecture: StreamingArchitecture;
  config: StreamingArchitectureConfig;
  setArchitecture: (architecture: StreamingArchitecture) => void;
  getArchitectureInfo: () => {
    title: string;
    description: string;
    setupInstructions: string[];
    requirements: string[];
  };
  getStreamingConfig: () => {
    serverUrl: string;
    streamKey?: string;
    rtmpUrl?: string;
    qualitySettings: any;
  };
}

export const useStreamingArchitecture = (
  initialArchitecture: StreamingArchitecture = 'mediasoup'
): UseStreamingArchitectureReturn => {
  const [architecture, setArchitecture] = useState<StreamingArchitecture>(initialArchitecture);

  const config: StreamingArchitectureConfig = {
    architecture,
    serverUrl: architecture === 'mediasoup' 
      ? 'http://localhost:3001' 
      : 'rtmp://localhost:1935/live',
    rtmpUrl: architecture === 'rtmp' ? 'rtmp://localhost:1935/live' : undefined,
    streamKey: architecture === 'rtmp' ? 'your-stream-key' : undefined,
    qualitySettings: {
      width: architecture === 'mediasoup' ? 1280 : 1920,
      height: architecture === 'mediasoup' ? 720 : 1080,
      frameRate: 30,
      bitrate: architecture === 'mediasoup' ? 2500 : 5000,
    }
  };

  const getArchitectureInfo = () => {
    if (architecture === 'mediasoup') {
      return {
        title: 'Browser-Based Streaming',
        description: 'Stream directly from your browser using WebRTC technology',
        setupInstructions: [
          'Ensure your camera and microphone are connected',
          'Grant browser permissions for camera and microphone',
          'Click "Start Stream" to begin broadcasting',
          'Students can join via the stream viewer'
        ],
        requirements: [
          'Modern web browser (Chrome, Firefox, Safari, Edge)',
          'Camera and microphone',
          'Stable internet connection',
          'No additional software required'
        ]
      };
    } else {
      return {
        title: 'Professional Broadcasting',
        description: 'Stream using OBS Studio or professional broadcasting software',
        setupInstructions: [
          'Download and install OBS Studio from obsproject.com',
          'Configure OBS with the provided RTMP settings',
          'Add camera and microphone sources in OBS',
          'Start streaming from OBS Studio',
          'Students can join via the stream viewer'
        ],
        requirements: [
          'OBS Studio or similar broadcasting software',
          'Camera and microphone hardware',
          'Computer with good performance',
          'Stable internet connection',
          'RTMP server running'
        ]
      };
    }
  };

  const getStreamingConfig = () => {
    if (architecture === 'mediasoup') {
      return {
        serverUrl: config.serverUrl,
        qualitySettings: {
          video: {
            width: { ideal: config.qualitySettings.width },
            height: { ideal: config.qualitySettings.height },
            frameRate: { ideal: config.qualitySettings.frameRate }
          },
          audio: true
        }
      };
    } else {
      return {
        serverUrl: config.serverUrl,
        streamKey: config.streamKey,
        rtmpUrl: config.rtmpUrl,
        qualitySettings: {
          videoBitrate: config.qualitySettings.bitrate,
          audioBitrate: 128,
          fps: config.qualitySettings.frameRate,
          resolution: `${config.qualitySettings.width}x${config.qualitySettings.height}`
        }
      };
    }
  };

  // Save architecture preference to localStorage
  useEffect(() => {
    localStorage.setItem('streaming-architecture', architecture);
  }, [architecture]);

  // Load architecture preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('streaming-architecture') as StreamingArchitecture;
    if (saved && (saved === 'mediasoup' || saved === 'rtmp')) {
      setArchitecture(saved);
    }
  }, []);

  return {
    architecture,
    config,
    setArchitecture,
    getArchitectureInfo,
    getStreamingConfig
  };
}; 