import whisper
import numpy as np
import torch
import asyncio
import threading
import queue
import logging
from typing import Optional, Callable, Dict, Any
from datetime import datetime
import io
import wave
import base64

logger = logging.getLogger(__name__)


class WhisperTranscriptionService:
    def __init__(self, model_name: str = "base"):
        """
        Initialize Whisper transcription service

        Args:
            model_name: Whisper model to use (tiny, base, small, medium, large)
        """
        self.model_name = model_name
        self.model = None
        self.is_initialized = False
        self.transcription_queue = queue.Queue()
        self.is_processing = False
        self.callbacks: Dict[str, Callable] = {}
        self.websocket_connections: Dict[str, list] = {}  # Store WebSocket connections by stream_id

        # Initialize model in a separate thread to avoid blocking
        self._init_thread = threading.Thread(target=self._initialize_model)
        self._init_thread.start()

    def _initialize_model(self):
        """Initialize the Whisper model"""
        try:
            logger.info(f"Loading Whisper model: {self.model_name}")
            self.model = whisper.load_model(self.model_name)
            self.is_initialized = True
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            self.is_initialized = False

    def add_callback(self, stream_id: str, callback: Callable):
        """Add a callback for transcription results"""
        self.callbacks[stream_id] = callback

    def remove_callback(self, stream_id: str):
        """Remove a callback for a specific stream"""
        if stream_id in self.callbacks:
            del self.callbacks[stream_id]
    
    def add_websocket_connection(self, stream_id: str, websocket):
        """Add a WebSocket connection for real-time transcription"""
        if stream_id not in self.websocket_connections:
            self.websocket_connections[stream_id] = []
        self.websocket_connections[stream_id].append(websocket)
    
    def remove_websocket_connection(self, stream_id: str, websocket):
        """Remove a WebSocket connection"""
        if stream_id in self.websocket_connections:
            try:
                self.websocket_connections[stream_id].remove(websocket)
                if not self.websocket_connections[stream_id]:
                    del self.websocket_connections[stream_id]
            except ValueError:
                pass

    def process_audio_chunk(self, stream_id: str, audio_data: bytes, sample_rate: int = 16000, format_type: str = "webm"):
        """
        Process an audio chunk for transcription

        Args:
            stream_id: Unique identifier for the stream
            audio_data: Raw audio data in bytes
            sample_rate: Sample rate of the audio (default: 16000)
            format_type: Audio format (webm, wav, etc.)
        """
        if not self.is_initialized:
            logger.warning("Whisper model not yet initialized")
            return

        try:
            # Handle different audio formats
            if format_type.lower() == "webm" or len(audio_data) < 1000:
                # For WebRTC/WebM audio, convert using a different approach
                try:
                    import tempfile
                    import os
                    
                    # Write to temporary file
                    with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_file:
                        temp_file.write(audio_data)
                        temp_file_path = temp_file.name
                    
                    try:
                        # Use whisper to load the audio file directly
                        audio_array = whisper.load_audio(temp_file_path)
                        
                        # Add to processing queue
                        self.transcription_queue.put({
                            'stream_id': stream_id,
                            'audio': audio_array,
                            'sample_rate': sample_rate,
                            'timestamp': datetime.now()
                        })

                        # Start processing if not already running
                        if not self.is_processing:
                            self._start_processing()
                            
                    finally:
                        # Clean up temp file
                        if os.path.exists(temp_file_path):
                            os.unlink(temp_file_path)
                            
                except Exception as e:
                    logger.warning(f"Failed to process WebM audio, trying raw PCM: {e}")
                    # Fallback to raw PCM processing
                    self._process_raw_pcm(stream_id, audio_data, sample_rate)
            else:
                # Process as raw PCM data
                self._process_raw_pcm(stream_id, audio_data, sample_rate)

        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}")
    
    def _process_raw_pcm(self, stream_id: str, audio_data: bytes, sample_rate: int):
        """Process raw PCM audio data"""
        try:
            # Convert audio data to numpy array
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            audio_array = audio_array.astype(np.float32) / 32768.0

            # Add to processing queue
            self.transcription_queue.put({
                'stream_id': stream_id,
                'audio': audio_array,
                'sample_rate': sample_rate,
                'timestamp': datetime.now()
            })

            # Start processing if not already running
            if not self.is_processing:
                self._start_processing()

        except Exception as e:
            logger.error(f"Error processing raw PCM audio: {e}")

    def _start_processing(self):
        """Start the background processing thread"""
        if self.is_processing:
            return

        self.is_processing = True
        processing_thread = threading.Thread(target=self._process_queue)
        processing_thread.daemon = True
        processing_thread.start()

    def _process_queue(self):
        """Process the transcription queue"""
        while True:
            try:
                # Get item from queue with timeout
                item = self.transcription_queue.get(timeout=1)

                if item is None:  # Shutdown signal
                    break

                # Transcribe the audio
                result = self._transcribe_audio(
                    item['audio'], item['sample_rate'])

                if result and result.strip():
                    # Create transcription result
                    transcription_result = {
                        'stream_id': item['stream_id'],
                        'text': result.strip(),
                        'timestamp': item['timestamp'].isoformat(),
                        'confidence': 0.8,  # Placeholder confidence score
                        'language': 'en'  # Default to English
                    }

                    # Call callback if registered
                    if item['stream_id'] in self.callbacks:
                        try:
                            self.callbacks[item['stream_id']](
                                transcription_result)
                        except Exception as e:
                            logger.error(
                                f"Error in transcription callback: {e}")

                    # Broadcast to WebSocket connections
                    self._broadcast_transcription(item['stream_id'], transcription_result)

                    logger.info(
                        f"Transcription for stream {item['stream_id']}: {result.strip()}")

            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error in transcription processing: {e}")

    def _transcribe_audio(self, audio_array: np.ndarray, sample_rate: int) -> Optional[str]:
        """
        Transcribe audio using Whisper

        Args:
            audio_array: Audio data as numpy array
            sample_rate: Sample rate of the audio

        Returns:
            Transcribed text or None if failed
        """
        try:
            # Ensure audio is the right length (Whisper expects 30-second chunks)
            target_length = 30 * sample_rate

            if len(audio_array) < target_length:
                # Pad with zeros if too short
                audio_array = np.pad(
                    audio_array, (0, target_length - len(audio_array)))
            elif len(audio_array) > target_length:
                # Truncate if too long
                audio_array = audio_array[:target_length]

            # Transcribe using Whisper
            result = self.model.transcribe(
                audio_array,
                language="en",
                task="transcribe",
                fp16=False  # Use fp32 for better compatibility
            )

            return result.get('text', '').strip()

        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return None

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        return {
            'model_name': self.model_name,
            'model_size': self.model_name,  # Use model_name as size for now
            'is_initialized': self.is_initialized,
            'queue_size': self.transcription_queue.qsize(),
            'is_processing': self.is_processing
        }

    def _broadcast_transcription(self, stream_id: str, transcription_result: dict):
        """Broadcast transcription result to all WebSocket connections for a stream"""
        if stream_id not in self.websocket_connections:
            return
        
        import json
        import asyncio
        
        message = {
            "type": "transcription",
            "text": transcription_result['text'],
            "confidence": transcription_result['confidence'],
            "language": transcription_result['language'],
            "timestamp": transcription_result['timestamp']
        }
        
        # Remove closed connections
        active_connections = []
        for ws in self.websocket_connections[stream_id]:
            try:
                # Try to send message
                asyncio.create_task(ws.send_text(json.dumps(message)))
                active_connections.append(ws)
            except Exception as e:
                logger.warning(f"Removing closed WebSocket connection: {e}")
        
        self.websocket_connections[stream_id] = active_connections
        if not active_connections:
            del self.websocket_connections[stream_id]

    def shutdown(self):
        """Shutdown the transcription service"""
        self.is_processing = False
        self.transcription_queue.put(None)  # Signal shutdown


# Global instance
whisper_service = WhisperTranscriptionService()
