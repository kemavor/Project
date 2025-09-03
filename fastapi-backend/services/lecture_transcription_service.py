"""
Lecture Transcription Service using Whisper.cpp and T5-small
Processes recorded lecture videos from S3 to generate transcriptions and summaries
"""

import os
import subprocess
import tempfile
import json
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import requests
import ffmpeg

from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch

from config import settings
from services.video_service import video_service
from database import SessionLocal
from models import LiveStream, LectureTranscription, LectureSummary


class LectureTranscriptionService:
    """Service for transcribing and summarizing recorded lectures"""
    
    def __init__(self):
        self.t5_model = None
        self.t5_tokenizer = None
        self.temp_dir = tempfile.mkdtemp()
        self._whisper_model = None  # Will be loaded on first use
        
    def _load_whisper_model(self):
        """Load Whisper model on first use"""
        if self._whisper_model is None:
            try:
                import whisper
                print("Loading Whisper base model...")
                self._whisper_model = whisper.load_model("base")
                print("Whisper model loaded successfully")
                return True
            except Exception as e:
                print(f"ERROR: Failed to load Whisper model: {e}")
                return False
        return True
    
    def _load_t5_model(self):
        """Load T5-small model for summarization"""
        if self.t5_model is None:
            print("Loading T5-small model for summarization...")
            try:
                self.t5_tokenizer = T5Tokenizer.from_pretrained("t5-small")
                self.t5_model = T5ForConditionalGeneration.from_pretrained("t5-small")
                print("T5-small model loaded successfully")
            except Exception as e:
                print(f"ERROR: Failed to load T5-small model: {e}")
                return False
        return True
    
    async def process_lecture(self, stream_id: int) -> Dict[str, any]:
        """Main method to process a recorded lecture"""
        db = SessionLocal()
        try:
            # Get stream info
            stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
            if not stream or not stream.video_s3_key:
                return {"success": False, "error": "No recorded video found for this stream"}
            
            # Check if already processing
            existing_transcription = db.query(LectureTranscription).filter(
                LectureTranscription.stream_id == stream_id
            ).first()
            
            if existing_transcription and existing_transcription.status == "processing":
                return {"success": False, "error": "Transcription already in progress"}
            
            # Create or update transcription record
            if not existing_transcription:
                transcription = LectureTranscription(
                    stream_id=stream_id,
                    status="processing",
                    processing_started_at=datetime.utcnow()
                )
                db.add(transcription)
            else:
                transcription = existing_transcription
                transcription.status = "processing"
                transcription.processing_started_at = datetime.utcnow()
                transcription.error_message = None
            
            db.commit()
            
            # Process the lecture
            result = await self._process_lecture_pipeline(stream, transcription, db)
            
            # Update final status
            if result["success"]:
                transcription.status = "completed"
                transcription.processing_completed_at = datetime.utcnow()
            else:
                transcription.status = "failed"
                transcription.error_message = result.get("error", "Unknown error")
            
            db.commit()
            return result
            
        except Exception as e:
            print(f"ERROR: Processing lecture {stream_id}: {e}")
            return {"success": False, "error": str(e)}
        finally:
            db.close()
    
    async def _process_lecture_pipeline(self, stream: LiveStream, transcription: LectureTranscription, db) -> Dict[str, any]:
        """Complete processing pipeline for a lecture"""
        try:
            # Step 1: Download video from S3
            print(f"Step 1: Downloading video from S3...")
            video_path = await self._download_video_from_s3(stream.video_s3_key)
            if not video_path:
                return {"success": False, "error": "Failed to download video from S3"}
            
            # Step 2: Extract audio from video
            print(f"Step 2: Extracting audio from video...")
            audio_path = await self._extract_audio_from_video(video_path)
            if not audio_path:
                return {"success": False, "error": "Failed to extract audio from video"}
            
            transcription.audio_extracted = True
            transcription.audio_file_path = audio_path
            db.commit()
            
            # Step 3: Transcribe audio using Whisper.cpp
            print(f"Step 3: Transcribing audio with Whisper.cpp...")
            transcript_result = await self._transcribe_audio_whisper(audio_path)
            if not transcript_result["success"]:
                return {"success": False, "error": f"Transcription failed: {transcript_result['error']}"}
            
            # Update transcription in database
            transcription.full_transcript = transcript_result["transcript"]
            transcription.transcript_chunks = transcript_result["chunks"]
            transcription.audio_duration_seconds = transcript_result.get("duration_seconds")
            transcription.transcription_completed = True
            db.commit()
            
            # Step 4: Generate summary using T5-small
            print(f"Step 4: Generating summary with T5-small...")
            summary_result = await self._generate_summary_t5(transcript_result["transcript"], stream.id, transcription.id, db)
            if summary_result["success"]:
                transcription.summary_completed = True
                db.commit()
            
            # Step 5: Generate questions using NLP techniques
            print(f"Step 5: Generating questions using NLP (NER + Keyphrase Extraction)...")
            questions_result = await self._generate_questions_nlp(transcript_result["transcript"], stream.id, db)
            if questions_result["success"]:
                transcription.questions_generated = True
                db.commit()
                print(f"Generated {questions_result.get('questions_count', 0)} questions successfully")
            else:
                print(f"Question generation failed: {questions_result.get('error', 'Unknown error')}")
            
            # Step 6: Cleanup temporary files
            self._cleanup_temp_files([video_path, audio_path])
            
            return {
                "success": True,
                "transcript": transcript_result["transcript"],
                "summary": summary_result.get("summary") if summary_result["success"] else None,
                "questions_generated": questions_result.get("questions_count", 0) if questions_result["success"] else 0,
                "duration_seconds": transcript_result.get("duration_seconds")
            }
            
        except Exception as e:
            print(f"ERROR: Processing pipeline failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _download_video_from_s3(self, s3_key: str) -> Optional[str]:
        """Download video file from S3 to temporary location"""
        try:
            # Generate presigned URL
            presigned_url = video_service.generate_presigned_video_url(s3_key, expiration=3600)
            if not presigned_url:
                return None
            
            # Download video
            response = requests.get(presigned_url, stream=True)
            if response.status_code != 200:
                return None
            
            # Save to temporary file
            video_path = os.path.join(self.temp_dir, f"lecture_{datetime.now().timestamp()}.mp4")
            with open(video_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            return video_path
            
        except Exception as e:
            print(f"ERROR: Failed to download video: {e}")
            return None
    
    async def _extract_audio_from_video(self, video_path: str) -> Optional[str]:
        """Extract audio from video using ffmpeg"""
        try:
            audio_path = video_path.replace(".mp4", ".wav")
            
            # Try different FFmpeg paths
            possible_ffmpeg_paths = [
                r"C:\tools\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe",  # Original path
                "ffmpeg",  # System PATH
                r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",  # Alternative install location
                r"C:\ffmpeg\bin\ffmpeg.exe",  # Another common location
            ]
            
            ffmpeg_path = None
            for path in possible_ffmpeg_paths:
                if path == "ffmpeg":
                    # Check if ffmpeg is in PATH
                    try:
                        import shutil
                        if shutil.which("ffmpeg"):
                            ffmpeg_path = "ffmpeg"
                            break
                    except:
                        continue
                elif os.path.exists(path):
                    ffmpeg_path = path
                    break
            
            if not ffmpeg_path:
                print(f"ERROR: ffmpeg not found in any of the expected locations: {possible_ffmpeg_paths}")
                print("Please install ffmpeg and ensure it's in your system PATH or install it to one of the expected locations")
                return None
            
            # Use direct subprocess call instead of ffmpeg-python to avoid path issues
            cmd = [
                ffmpeg_path,
                "-i", video_path,
                "-vn",  # No video
                "-acodec", "pcm_s16le",
                "-ac", "1",  # Mono
                "-ar", "16000",  # 16kHz for Whisper
                "-y",  # Overwrite output
                audio_path
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                print(f"ERROR: FFmpeg failed: {stderr.decode()}")
                return None
            
            if os.path.exists(audio_path):
                return audio_path
            else:
                return None
                
        except Exception as e:
            print(f"ERROR: Failed to extract audio: {e}")
            return None
    
    async def _transcribe_audio_whisper(self, audio_path: str) -> Dict[str, any]:
        """Transcribe audio using OpenAI Whisper"""
        try:
            import whisper
            import librosa
            
            # Load Whisper model if not already loaded
            if not self._load_whisper_model():
                return {"success": False, "error": "Failed to load Whisper model"}
            
            # Transcribe audio
            print(f"Transcribing audio: {audio_path}")
            result = self._whisper_model.transcribe(
                audio_path,
                language="en",  # Set to English for better performance
                task="transcribe",
                verbose=False,
                word_timestamps=True  # Get word-level timestamps for better chunking
            )
            
            # Extract segments with timing information
            chunks = []
            for segment in result.get("segments", []):
                chunks.append({
                    "start": float(segment.get("start", 0)),
                    "end": float(segment.get("end", 0)),
                    "text": segment.get("text", "").strip()
                })
            
            # Get audio duration using librosa
            try:
                duration = librosa.get_duration(filename=audio_path)
            except Exception as e:
                print(f"Warning: Could not get audio duration with librosa: {e}")
                # Fallback to last segment end time
                duration = result.get("segments", [])[-1].get("end", 0) if result.get("segments") else 0
            
            full_transcript = result.get("text", "").strip()
            
            print(f"Transcription completed: {len(full_transcript)} characters, {len(chunks)} segments")
            
            return {
                "success": True,
                "transcript": full_transcript,
                "chunks": chunks,
                "duration_seconds": int(duration)
            }
                
        except Exception as e:
            print(f"ERROR: Whisper transcription failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _generate_summary_t5(self, transcript: str, stream_id: int, transcription_id: int, db) -> Dict[str, any]:
        """Generate summary using T5-small model and create student-accessible summary"""
        try:
            if not self._load_t5_model():
                return {"success": False, "error": "Failed to load T5-small model"}
            
            if not transcript or len(transcript.strip()) < 100:
                return {"success": False, "error": "Transcript too short for summarization"}
            
            # Get stream and course info for the summary
            stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
            if not stream:
                return {"success": False, "error": "Stream not found"}
            
            # Prepare text for summarization
            summarize_text = f"summarize: {transcript}"
            
            # Tokenize and generate summary
            inputs = self.t5_tokenizer.encode(
                summarize_text, 
                return_tensors="pt", 
                max_length=512, 
                truncation=True
            )
            
            # Generate summary
            with torch.no_grad():
                summary_ids = self.t5_model.generate(
                    inputs,
                    max_length=150,
                    min_length=50,
                    length_penalty=2.0,
                    num_beams=4,
                    early_stopping=True
                )
            
            summary_text = self.t5_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
            
            # Extract key points and topics
            key_points = self._extract_key_points(transcript)
            topics_covered = self._extract_topics(transcript)
            
            # Save transcription-specific summary
            transcription_summary = LectureSummary(
                transcription_id=transcription_id,
                stream_id=stream_id,
                summary_text=summary_text,
                key_points=key_points,
                topics_covered=topics_covered,
                model_used="t5-small",
                processing_time_seconds=0
            )
            
            db.add(transcription_summary)
            
            # For now, we only create the transcription-specific summary
            # The student summaries system can access this via the stream relationship
            # This avoids the table structure conflicts
            db.commit()
            
            return {
                "success": True,
                "summary": summary_text,
                "key_points": key_points,
                "topics_covered": topics_covered
            }
            
        except Exception as e:
            print(f"ERROR: T5 summarization failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _extract_key_points(self, transcript: str) -> List[str]:
        """Extract key points from transcript (simple implementation)"""
        sentences = transcript.split('. ')
        # Simple heuristic: longer sentences might be more important
        key_sentences = [s for s in sentences if len(s.split()) > 10]
        return key_sentences[:5]  # Return top 5
    
    def _extract_topics(self, transcript: str) -> List[str]:
        """Extract main topics from transcript (simple implementation)"""
        # Simple keyword extraction (could be improved with NLP libraries)
        words = transcript.lower().split()
        word_freq = {}
        
        # Common lecture topic indicators
        topic_words = ['theory', 'concept', 'method', 'approach', 'technique', 'principle', 'algorithm', 'model']
        
        for word in words:
            if word in topic_words:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Return most frequent topic words
        sorted_topics = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [topic[0] for topic in sorted_topics[:5]]
    
    def _cleanup_temp_files(self, file_paths: List[str]):
        """Clean up temporary files"""
        for file_path in file_paths:
            try:
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"WARNING: Failed to cleanup {file_path}: {e}")
    
    async def _generate_questions_nlp(self, transcript: str, stream_id: int, db) -> Dict[str, any]:
        """Generate questions using NLP techniques (NER + Keyphrase Extraction)"""
        try:
            # Import here to avoid circular imports
            from services.question_generation_service import question_generation_service
            
            # Generate questions using the NLP service
            result = await question_generation_service.generate_questions_from_transcript(
                transcript=transcript,
                stream_id=stream_id,
                num_mcq=5,  # Default 5 multiple choice questions
                num_short_answer=3  # Default 3 short answer questions
            )
            
            if result["success"]:
                return {
                    "success": True,
                    "questions_count": result["questions_generated"],
                    "mcq_count": len(result.get("multiple_choice_questions", [])),
                    "short_answer_count": len(result.get("short_answer_questions", [])),
                    "entities_found": result.get("entities_found", 0),
                    "keyphrases_found": result.get("keyphrases_found", 0)
                }
            else:
                return {"success": False, "error": result.get("error", "Question generation failed")}
                
        except Exception as e:
            print(f"ERROR: Question generation failed: {e}")
            return {"success": False, "error": str(e)}
    
    def get_transcription_status(self, stream_id: int) -> Dict[str, any]:
        """Get current transcription status for a stream"""
        db = SessionLocal()
        try:
            transcription = db.query(LectureTranscription).filter(
                LectureTranscription.stream_id == stream_id
            ).first()
            
            if not transcription:
                return {"status": "not_started"}
            
            # Check if questions were generated
            from models import GeneratedQuestion
            questions_count = db.query(GeneratedQuestion).filter(
                GeneratedQuestion.stream_id == stream_id
            ).count()
            
            return {
                "status": transcription.status,
                "audio_extracted": transcription.audio_extracted,
                "transcription_completed": transcription.transcription_completed,
                "summary_completed": transcription.summary_completed,
                "questions_generated": questions_count > 0,
                "questions_count": questions_count,
                "processing_started_at": transcription.processing_started_at,
                "processing_completed_at": transcription.processing_completed_at,
                "error_message": transcription.error_message
            }
            
        finally:
            db.close()


# Global instance
lecture_transcription_service = LectureTranscriptionService()