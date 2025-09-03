import boto3
import os
import uuid
import mimetypes
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
import botocore.config

from config import settings


class VideoUploadService:
    """Service for handling video uploads to S3 for recorded lectures"""
    
    def __init__(self):
        self.s3_client = self._get_s3_client()
        
    def _get_s3_client(self):
        """Get S3 client using IAM role or access keys"""
        try:
            if settings.use_iam_role:
                # Use IAM role attached to EC2 instance (recommended for production)
                config = botocore.config.Config(
                    read_timeout=300,  # 5 minutes for large video files
                    connect_timeout=60,
                    retries={'max_attempts': 3}
                )
                return boto3.client('s3', region_name=settings.aws_region, config=config)
            elif settings.aws_access_key_id and settings.aws_secret_access_key:
                # Use access keys (for local development only)
                config = botocore.config.Config(
                    read_timeout=300,  # 5 minutes for large video files
                    connect_timeout=60,
                    retries={'max_attempts': 3}
                )
                return boto3.client(
                    's3',
                    aws_access_key_id=settings.aws_access_key_id,
                    aws_secret_access_key=settings.aws_secret_access_key,
                    region_name=settings.aws_region,
                    config=config
                )
            else:
                print("WARNING: AWS credentials not configured. Video uploads will fail.")
                return None
        except Exception as e:
            print(f"ERROR: Failed to create S3 client for videos: {e}")
            return None
    
    def generate_video_key(self, stream_id: int, filename: str) -> str:
        """Generate S3 key for video file"""
        file_extension = Path(filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        return f"livestream-recordings/{stream_id}/{unique_filename}"
    
    def upload_video_chunk(self, stream_id: int, chunk_data: bytes, chunk_number: int) -> Dict[str, Any]:
        """Upload a video chunk during live streaming"""
        if not self.s3_client:
            return {"success": False, "error": "S3 client not available"}
            
        try:
            # Generate key for chunk
            chunk_key = f"livestream-recordings/{stream_id}/chunks/chunk_{chunk_number:06d}.webm"
            
            # Upload chunk to S3
            self.s3_client.put_object(
                Bucket=settings.s3_video_bucket_name,
                Key=chunk_key,
                Body=chunk_data,
                ContentType='video/webm',
                Metadata={
                    'stream_id': str(stream_id),
                    'chunk_number': str(chunk_number),
                    'upload_time': datetime.utcnow().isoformat()
                }
            )
            
            s3_url = f"https://{settings.s3_video_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{chunk_key}"
            
            return {
                "success": True,
                "chunk_key": chunk_key,
                "s3_url": s3_url,
                "chunk_number": chunk_number
            }
            
        except Exception as e:
            print(f"ERROR: Failed to upload video chunk: {e}")
            return {"success": False, "error": str(e)}
    
    def upload_complete_video(self, stream_id: int, video_data: bytes, filename: str) -> Dict[str, Any]:
        """Upload a complete recorded video file"""
        if not self.s3_client:
            return {"success": False, "error": "S3 client not available"}
            
        try:
            # Generate video key
            video_key = self.generate_video_key(stream_id, filename)
            
            # Determine content type
            content_type = mimetypes.guess_type(filename)[0] or 'video/mp4'
            
            # Upload complete video to S3
            self.s3_client.put_object(
                Bucket=settings.s3_video_bucket_name,
                Key=video_key,
                Body=video_data,
                ContentType=content_type,
                Metadata={
                    'stream_id': str(stream_id),
                    'original_filename': filename,
                    'upload_time': datetime.utcnow().isoformat(),
                    'file_size': str(len(video_data))
                }
            )
            
            s3_url = f"https://{settings.s3_video_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{video_key}"
            
            return {
                "success": True,
                "s3_key": video_key,
                "s3_url": s3_url,
                "file_size": len(video_data),
                "content_type": content_type
            }
            
        except Exception as e:
            print(f"ERROR: Failed to upload complete video: {e}")
            return {"success": False, "error": str(e)}
    
    def combine_video_chunks(self, stream_id: int, chunk_count: int) -> Dict[str, Any]:
        """Combine video chunks into a single video file"""
        if not self.s3_client:
            return {"success": False, "error": "S3 client not available"}
            
        try:
            # List all chunks for this stream
            chunk_prefix = f"livestream-recordings/{stream_id}/chunks/"
            
            response = self.s3_client.list_objects_v2(
                Bucket=settings.s3_video_bucket_name,
                Prefix=chunk_prefix
            )
            
            if 'Contents' not in response:
                return {"success": False, "error": "No chunks found"}
            
            # Sort chunks by chunk number
            chunks = sorted(response['Contents'], key=lambda x: x['Key'])
            
            # Download and combine chunks
            combined_data = b''
            for chunk in chunks:
                chunk_response = self.s3_client.get_object(
                    Bucket=settings.s3_video_bucket_name,
                    Key=chunk['Key']
                )
                combined_data += chunk_response['Body'].read()
            
            # Upload combined video
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            final_filename = f"livestream_{stream_id}_{timestamp}.webm"
            
            result = self.upload_complete_video(stream_id, combined_data, final_filename)
            
            if result["success"]:
                # Clean up chunks after successful combination
                self._cleanup_chunks(stream_id)
                
            return result
            
        except Exception as e:
            print(f"ERROR: Failed to combine video chunks: {e}")
            return {"success": False, "error": str(e)}
    
    def _cleanup_chunks(self, stream_id: int):
        """Clean up temporary chunks after video combination"""
        try:
            chunk_prefix = f"livestream-recordings/{stream_id}/chunks/"
            
            response = self.s3_client.list_objects_v2(
                Bucket=settings.s3_video_bucket_name,
                Prefix=chunk_prefix
            )
            
            if 'Contents' in response:
                # Delete all chunks
                delete_objects = [{'Key': obj['Key']} for obj in response['Contents']]
                
                self.s3_client.delete_objects(
                    Bucket=settings.s3_video_bucket_name,
                    Delete={'Objects': delete_objects}
                )
                
                print(f"Cleaned up {len(delete_objects)} video chunks for stream {stream_id}")
                
        except Exception as e:
            print(f"WARNING: Failed to cleanup chunks for stream {stream_id}: {e}")
    
    def generate_presigned_video_url(self, video_key: str, expiration: int = 3600) -> Optional[str]:
        """Generate a pre-signed URL for video access"""
        if not self.s3_client:
            return None
            
        try:
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.s3_video_bucket_name, 'Key': video_key},
                ExpiresIn=expiration
            )
            return presigned_url
            
        except Exception as e:
            print(f"ERROR: Failed to generate presigned video URL: {e}")
            return None
    
    def delete_video(self, video_key: str) -> bool:
        """Delete a video from S3"""
        if not self.s3_client:
            return False
            
        try:
            self.s3_client.delete_object(
                Bucket=settings.s3_video_bucket_name,
                Key=video_key
            )
            return True
            
        except Exception as e:
            print(f"ERROR: Failed to delete video {video_key}: {e}")
            return False
    
    def get_video_metadata(self, video_key: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a video file"""
        if not self.s3_client:
            return None
            
        try:
            response = self.s3_client.head_object(
                Bucket=settings.s3_video_bucket_name,
                Key=video_key
            )
            
            return {
                'size': response['ContentLength'],
                'last_modified': response['LastModified'],
                'content_type': response['ContentType'],
                'metadata': response.get('Metadata', {})
            }
            
        except Exception as e:
            print(f"ERROR: Failed to get video metadata: {e}")
            return None


# Global instance
video_service = VideoUploadService()