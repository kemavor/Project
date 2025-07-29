import google.generativeai as genai
import boto3
import json
import os
from typing import List, Dict, Any, Optional
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv
from enhanced_document_processor import EnhancedDocumentProcessor
from google.api_core import exceptions as google_exceptions
import time
import random
import asyncio
from datetime import datetime, timedelta
from collections import deque

# Load environment variables
load_dotenv()

# Rate limiting configuration


class RateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = deque()

    def can_make_request(self) -> bool:
        now = datetime.now()
        # Remove old requests outside the window
        while self.requests and (now - self.requests[0]) > timedelta(seconds=self.window_seconds):
            self.requests.popleft()

        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True
        return False

    def get_wait_time(self) -> float:
        if not self.requests:
            return 0
        oldest_request = self.requests[0]
        return max(0, self.window_seconds - (datetime.now() - oldest_request).total_seconds())


class GeminiService:
    def __init__(self):
        # Initialize Gemini AI with environment variable
        self.api_key = os.getenv('GEMINI_API_KEY')
        # Initialize rate limiter
        self.rate_limiter = RateLimiter(
            max_requests=int(os.getenv('ECHO_RATE_LIMIT', '10')),
            window_seconds=int(os.getenv('ECHO_RATE_WINDOW', '60'))
        )

        # Connection and timeout configuration
        self.request_timeout = int(os.getenv('ECHO_REQUEST_TIMEOUT', '30'))
        self.max_retries = int(os.getenv('ECHO_MAX_RETRIES', '3'))
        self.retry_delay_base = float(
            os.getenv('ECHO_RETRY_DELAY_BASE', '1.0'))

        if not self.api_key:
            print("Warning: GEMINI_API_KEY environment variable not set")
            self.model = None
        else:
            genai.configure(api_key=self.api_key)

            try:
                # Use environment variable for model selection
                model_name = os.getenv('ECHO_MODEL', 'gemini-1.5-flash')
                self.model = genai.GenerativeModel(model_name)
                print(f"✅ ECHO initialized with {model_name}")
            except Exception as e:
                print(f"Warning: Could not initialize Gemini model: {e}")
                # Fallback to basic model
                try:
                    self.model = genai.GenerativeModel('gemini-1.5-flash')
                    print("✅ ECHO initialized with fallback model")
                except Exception as fallback_error:
                    print(
                        f"Warning: Could not initialize fallback model: {fallback_error}")
                    self.model = None

        # Initialize S3 client
        use_iam_role = os.getenv('USE_IAM_ROLE', 'false').lower() == 'true'

        if use_iam_role:
            # Use IAM role (no credentials needed)
            self.s3_client = boto3.client(
                's3',
                region_name=os.getenv('AWS_REGION', 'us-east-1')
            )
        else:
            # Use access keys
            self.s3_client = boto3.client(
                's3',
                region_name=os.getenv('AWS_REGION', 'us-east-1'),
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
            )

        # S3 bucket configuration
        self.bucket_name = os.getenv(
            'S3_BUCKET_NAME', 'visionware-lecture-courses')

        # Initialize enhanced document processor
        self.document_processor = EnhancedDocumentProcessor(
            self.s3_client, self.bucket_name)

        # ECHO configuration from environment
        self.max_tokens = int(os.getenv('ECHO_MAX_TOKENS', '2048'))
        self.temperature = float(os.getenv('ECHO_TEMPERATURE', '0.7'))
        self.max_history = int(os.getenv('ECHO_MAX_HISTORY', '10'))

        # Feature flags
        self.course_content_enabled = os.getenv(
            'ECHO_COURSE_CONTENT_ENABLED', 'true').lower() == 'true'
        self.analytics_enabled = os.getenv(
            'ECHO_ANALYTICS_ENABLED', 'true').lower() == 'true'
        self.voice_enabled = os.getenv(
            'ECHO_VOICE_ENABLED', 'false').lower() == 'true'
        self.multilingual_enabled = os.getenv(
            'ECHO_MULTILINGUAL_ENABLED', 'false').lower() == 'true'

        # System prompt for the chatbot
        self.system_prompt = """
You are ECHO (Educational Context Handler Oracle), an intelligent educational assistant for VisionWare, an e-learning platform. 

As ECHO, your role is to process, understand, and reflect back knowledge to help students with their coursework by providing:

1. **Educational Context Processing**: Understand and analyze course materials, lectures, and discussions
2. **Contextual Learning Assistance**: Provide help based on specific course content and student context
3. **Knowledge Reflection**: Mirror back understanding in clear, educational ways
4. **Study Guidance**: Offer personalized learning strategies and insights
5. **Content Synthesis**: Combine information from multiple sources to provide comprehensive answers

**ECHO's Core Principles:**
- **Educational Focus**: Always prioritize learning and understanding
- **Context Awareness**: Use available course content and student context
- **Knowledge Handling**: Process and organize information effectively
- **Oracle Wisdom**: Provide insightful, well-reasoned guidance
- **Active Processing**: Engage with content dynamically, not just static responses

**Important Guidelines:**
- Be concise and to the point
- Maintain a helpful and encouraging tone
- Be respectful and professional
- If you don't know something, admit it and suggest where to find the information
- Reflect back the student's understanding and build upon it
- Use markdown formatting for better readability
- Provide actionable next steps when possible

**Context Available:**
- Course documents and materials from S3 bucket
- Course descriptions and syllabi
- Student's enrolled courses and progress
- Live stream transcripts and summaries
- Previous conversation context

**Response Format:**
- Use markdown for formatting (bold, italics, lists, code blocks)
- Use bullet points strategically to highlight key points, main concepts, and subpoints
- Keep bullet points purposeful - use them for lists of features, steps, or important items
- Avoid excessive bullet points - use paragraphs for general explanations
- Include relevant course content when available
- Suggest next steps or additional resources
- Do NOT add any signatures or "— ECHO" text to your responses
- Provide clean, professional responses like Google Gemini

**When No Course Content is Available:**
- Clearly state that no course materials are currently available
- Explain that this may be due to local development environment limitations
- Ask the student to provide more details about the course
- Suggest checking with the instructor for course materials
- Offer to help with general educational questions
- Provide guidance on how to access course content
- Mention that course content will be available in production environment

**ECHO's Personality:**
- Wise and knowledgeable, like an educational oracle
- Encouraging and supportive of learning
- Context-aware and personalized
- Professional yet approachable
- Always focused on educational growth
- Clean and concise communication style
"""

    def get_s3_course_content(self, course_id: int) -> List[Dict[str, Any]]:
        """Retrieve course content from S3 bucket"""
        if not self.course_content_enabled:
            return []

        try:
            # List objects in the course folder
            prefix = f"courses/{course_id}/"
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )

            course_content = []

            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']

                    # Skip if it's a directory
                    if key.endswith('/'):
                        continue

                    # Get file content
                    content = self._extract_file_content(
                        key, obj.get('ContentType', ''))
                    if content:
                        course_content.append({
                            'key': key,
                            'content': content,
                            'content_type': obj.get('ContentType', ''),
                            'size': obj.get('Size', 0)
                        })

            return course_content

        except Exception as e:
            print(
                f"Error accessing S3 content for course {course_id}: {str(e)}")
            # Return empty list instead of raising exception
            return []

    def _extract_file_content(self, key: str, content_type: str) -> Optional[str]:
        """Extract text content from different file types using enhanced processor"""
        try:
            # Use enhanced document processor
            result = self.document_processor.extract_content(key, content_type)

            if result and result.get('content'):
                content = result['content']

                # Add format information if available
                if result.get('format') and result['format'] != 'text':
                    content = f"[{result['format'].upper()} Document]\n{content}"

                return content
            else:
                error_msg = result.get(
                    'error', 'Unknown error') if result else 'No content extracted'
                print(f"Error extracting content from {key}: {error_msg}")
                return None

        except Exception as e:
            print(f"Error extracting content from {key}: {e}")
            return None

    def get_course_context(self, course_id: int, db_session=None) -> str:
        """Get comprehensive course context for ECHO from both S3 and database"""
        if not self.course_content_enabled:
            return "Course content integration is disabled."

        context_parts = [f"Course ID: {course_id}"]

        # Get S3 content
        s3_content = self.get_s3_course_content(course_id)
        s3_content_count = len(s3_content)

        # Get database content if session is provided
        db_content_count = 0
        if db_session:
            try:
                from models import CourseDocument
                db_documents = db_session.query(CourseDocument).filter(
                    CourseDocument.course_id == course_id
                ).all()
                db_content_count = len(db_documents)

                # Add database documents to context
                if db_documents:
                    context_parts.append(
                        f"\nDatabase Documents: {db_content_count}")
                    for doc in db_documents:
                        context_parts.append(
                            f"\n--- {doc.title or doc.original_filename} ---")
                        if doc.description:
                            context_parts.append(
                                f"Description: {doc.description}")
                        # Add document metadata
                        context_parts.append(f"Type: {doc.file_type}")
                        context_parts.append(f"Size: {doc.file_size} bytes")
                        context_parts.append(f"Public: {doc.is_public}")

            except Exception as e:
                print(
                    f"Error accessing database content for course {course_id}: {str(e)}")

        # Add S3 content
        if s3_content:
            context_parts.append(f"\nS3 Content Files: {s3_content_count}")
            for item in s3_content:
                filename = item['key'].split('/')[-1]
                context_parts.append(f"\n--- {filename} ---")
                context_parts.append(
                    item['content'][:500] + "..." if len(item['content']) > 500 else item['content'])

        total_content = s3_content_count + db_content_count

        if total_content == 0:
            return f"No course content found for Course ID: {course_id}. This course may not have any uploaded materials yet, or the content may be stored in a different location. In a local development environment, course content from S3 may not be available."

        context_parts.insert(
            1, f"Total Available Content Files: {total_content}")
        return "\n".join(context_parts)

    def chat_with_context(self, message: str, course_id: Optional[int] = None, conversation_history: List[Dict] = None, course_info: Optional[Dict] = None, db_session=None) -> Dict[str, Any]:
        """Chat with ECHO using course context"""
        # Check rate limiting
        if not self.rate_limiter.can_make_request():
            wait_time = self.rate_limiter.get_wait_time()
            return {
                "response": f"I apologize, but the system is currently experiencing high demand. Please wait {int(wait_time)} seconds and try again.",
                "success": False,
                "error": "Rate limit exceeded",
                "course_content_used": False,
                "content_files_count": 0,
                "retry_after": int(wait_time)
            }

        for attempt in range(self.max_retries):
            try:
                # Check if model is available
                if not self.model:
                    return {
                        "response": "I apologize, but the AI service is currently unavailable. Please try again later or contact support.",
                        "success": False,
                        "error": "Gemini model not initialized",
                        "course_content_used": False,
                        "content_files_count": 0
                    }

                # Build the conversation context
                conversation = []

                # Add system prompt
                conversation.append({
                    "role": "user",
                    "parts": [self.system_prompt]
                })

                # Add course context if available
                if course_id and self.course_content_enabled:
                    course_context = self.get_course_context(
                        course_id, db_session)

                    # Add course info if available
                    if course_info:
                        course_info_text = f"""
Course Information:
- Title: {course_info.get('title', 'Unknown')}
- Description: {course_info.get('description', 'No description available')}
- Credits: {course_info.get('credits', 'Unknown')}
"""
                        course_context = course_info_text + "\n" + course_context

                    conversation.append({
                        "role": "user",
                        "parts": [f"Course Context:\n{course_context}"]
                    })

                # Add conversation history (limited to max_history)
                if conversation_history:
                    # Limit to last max_history messages
                    for msg in conversation_history[-self.max_history:]:
                        conversation.append({
                            "role": msg.get("role", "user"),
                            "parts": [msg.get("content", "")]
                        })

                # Add current message
                conversation.append({
                    "role": "user",
                    "parts": [message]
                })

                # Generate response with ECHO configuration
                generation_config = {
                    'temperature': self.temperature,
                    'max_output_tokens': self.max_tokens,
                }

                response = self.model.generate_content(
                    conversation,
                    generation_config=generation_config
                )

                # Extract course content info
                course_content_available = course_id is not None and self.course_content_enabled
                course_content_files = self.get_s3_course_content(
                    course_id) if course_id and self.course_content_enabled else []
                course_content_used = len(course_content_files) > 0
                content_files_count = len(course_content_files)

                return {
                    "response": response.text,
                    "success": True,
                    "course_content_used": course_content_used,
                    "content_files_count": content_files_count,
                    "model_used": os.getenv('ECHO_MODEL', 'gemini-1.5-flash'),
                    "tokens_used": response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else None
                }

            except google_exceptions.ServiceUnavailable as e:
                if attempt < self.max_retries - 1:
                    # Exponential backoff with jitter
                    delay = self.retry_delay_base * \
                        (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(delay)
                    continue
                else:
                    return {
                        "response": "I apologize, but Google's AI service is currently experiencing high demand and is temporarily unavailable. This is a temporary issue on Google's servers. Please try again in a few minutes.",
                        "success": False,
                        "error": "Google API service unavailable",
                        "course_content_used": False,
                        "content_files_count": 0
                    }

            except google_exceptions.RetryError as e:
                if attempt < self.max_retries - 1:
                    # Exponential backoff with jitter
                    delay = self.retry_delay_base * \
                        (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(delay)
                    continue
                else:
                    return {
                        "response": "I apologize, but the request to Google's AI service timed out. This can happen during periods of high demand. Please try again in a moment.",
                        "success": False,
                        "error": "Google API timeout",
                        "course_content_used": False,
                        "content_files_count": 0
                    }

            except Exception as e:
                # Handle other errors
                error_message = str(e)
                if "timeout" in error_message.lower() or "503" in error_message:
                    if attempt < self.max_retries - 1:
                        # Exponential backoff with jitter
                        delay = self.retry_delay_base * \
                            (2 ** attempt) + random.uniform(0, 1)
                        time.sleep(delay)
                        continue
                    else:
                        user_message = "I apologize, but Google's AI service is currently experiencing issues. Please try again in a few minutes."
                else:
                    user_message = f"I apologize, but I encountered an error while processing your request: {error_message}. Please try again or contact support if the issue persists."

                return {
                    "response": user_message,
                    "success": False,
                    "error": str(e),
                    "course_content_used": False,
                    "content_files_count": 0
                }

        # This should never be reached, but just in case
        return {
            "response": "I apologize, but the AI service is currently experiencing issues. Please try again in a few minutes.",
            "success": False,
            "error": "Max retries exceeded",
            "course_content_used": False,
            "content_files_count": 0
        }

    def analyze_course_content(self, course_id: int) -> Dict[str, Any]:
        """Analyze course content and provide insights"""
        if not self.course_content_enabled:
            return {
                "success": False,
                "error": "Course content analysis is disabled",
                "analysis": "",
                "content_count": 0,
                "file_types": []
            }

        try:
            course_content = self.get_s3_course_content(course_id)

            if not course_content:
                return {
                    "success": True,
                    "analysis": "No course content found for analysis.",
                    "content_count": 0,
                    "file_types": []
                }

            # Analyze file types
            file_types = list(set([item['content_type']
                              for item in course_content]))

            # Create analysis prompt
            analysis_prompt = f"""
Analyze the following course content and provide educational insights:

Course ID: {course_id}
Total Files: {len(course_content)}
File Types: {file_types}

Content Summary:
{chr(10).join([f"- {item['key']}: {len(item['content'])} characters" for item in course_content[:5]])}

Please provide:
1. Content overview and structure
2. Key topics covered
3. Learning objectives that can be inferred
4. Study recommendations for students
5. Potential areas for additional content

Keep the analysis educational and actionable.
"""

            if self.model:
                response = self.model.generate_content(analysis_prompt)
                analysis = response.text
            else:
                analysis = "AI model not available for content analysis."

            return {
                "success": True,
                "analysis": analysis,
                "content_count": len(course_content),
                "file_types": file_types
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "analysis": "",
                "content_count": 0,
                "file_types": []
            }

    def chat_with_files(self, message: str, files: List[Dict], course_id: Optional[int] = None, conversation_history: List[Dict] = None, course_info: Optional[Dict] = None, db_session=None) -> Dict[str, Any]:
        """Chat with ECHO using uploaded files (images, documents, etc.)"""
        # Check rate limiting
        if not self.rate_limiter.can_make_request():
            wait_time = self.rate_limiter.get_wait_time()
            return {
                "response": f"I apologize, but the system is currently experiencing high demand. Please wait {int(wait_time)} seconds and try again.",
                "success": False,
                "error": "Rate limit exceeded",
                "course_content_used": False,
                "content_files_count": 0,
                "retry_after": int(wait_time)
            }

        for attempt in range(self.max_retries):
            try:
                # Check if model is available
                if not self.model:
                    return {
                        "response": "I apologize, but the AI service is currently unavailable. Please try again later or contact support.",
                        "success": False,
                        "error": "Gemini model not initialized",
                        "course_content_used": False,
                        "content_files_count": 0
                    }

                # Build the conversation context
                conversation = []

                # Add system prompt
                conversation.append({
                    "role": "user",
                    "parts": [self.system_prompt]
                })

                # Process uploaded files
                file_contents = []
                for file_info in files:
                    try:
                        file_path = file_info['saved_path']
                        file_name = file_info['original_name']
                        content_type = file_info['content_type']

                        # Extract content based on file type
                        if content_type and content_type.startswith('image/'):
                            # Handle images
                            with open(file_path, 'rb') as f:
                                image_data = f.read()

                            file_contents.append({
                                "type": "image",
                                "name": file_name,
                                "data": image_data,
                                "mime_type": content_type
                            })
                        else:
                            # Handle documents and other files
                            result = self.document_processor.extract_content(
                                file_path, content_type)
                            if result and result.get('content'):
                                file_contents.append({
                                    "type": "document",
                                    "name": file_name,
                                    "content": result['content'],
                                    "format": result.get('format', 'unknown')
                                })
                    except Exception as e:
                        print(
                            f"Error processing file {file_info['original_name']}: {e}")
                        continue

                # Add course context if available
                if course_id and self.course_content_enabled:
                    course_context = self.get_course_context(
                        course_id, db_session)

                    # Add course info if available
                    if course_info:
                        course_info_text = f"""
Course Information:
- Title: {course_info.get('title', 'Unknown')}
- Description: {course_info.get('description', 'No description available')}
- Credits: {course_info.get('credits', 'Unknown')}
"""
                        course_context = course_info_text + "\n" + course_context

                    conversation.append({
                        "role": "user",
                        "parts": [f"Course Context:\n{course_context}"]
                    })

                # Add conversation history (limited to max_history)
                if conversation_history:
                    # Limit to last max_history messages
                    for msg in conversation_history[-self.max_history:]:
                        conversation.append({
                            "role": msg.get("role", "user"),
                            "parts": [msg.get("content", "")]
                        })

                # Add current message with files
                message_parts = [message]

                # Add file contents to message
                for file_content in file_contents:
                    if file_content["type"] == "image":
                        # Add image to message parts
                        message_parts.append({
                            "mime_type": file_content["mime_type"],
                            "data": file_content["data"]
                        })
                    elif file_content["type"] == "document":
                        # Add document content as text
                        message_parts.append(
                            f"\n\n[Document: {file_content['name']}]\n{file_content['content']}")

                conversation.append({
                    "role": "user",
                    "parts": message_parts
                })

                # Generate response
                if self.model:
                    response = self.model.generate_content(conversation)

                    # Determine if course content was used
                    course_content_used = course_id is not None and self.course_content_enabled
                    course_content_files = self.get_s3_course_content(
                        course_id) if course_id and self.course_content_enabled else []
                    content_files_count = len(course_content_files)

                    return {
                        "response": response.text,
                        "success": True,
                        "course_content_used": course_content_used,
                        "content_files_count": content_files_count,
                        "files_processed": len(files),
                        "model_used": os.getenv('ECHO_MODEL', 'gemini-1.5-flash'),
                        "tokens_used": response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else None
                    }
                else:
                    return {
                        "response": "I apologize, but the AI model is not available at the moment.",
                        "success": False,
                        "error": "Model not available",
                        "course_content_used": False,
                        "content_files_count": 0
                    }

            except google_exceptions.ServiceUnavailable as e:
                if attempt < self.max_retries - 1:
                    # Exponential backoff with jitter
                    delay = self.retry_delay_base * \
                        (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(delay)
                    continue
                else:
                    return {
                        "response": "I apologize, but Google's AI service is currently experiencing high demand and is temporarily unavailable. This is a temporary issue on Google's servers. Please try again in a few minutes.",
                        "success": False,
                        "error": "Google API service unavailable",
                        "course_content_used": False,
                        "content_files_count": 0
                    }
            except google_exceptions.RetryError as e:
                if attempt < self.max_retries - 1:
                    # Exponential backoff with jitter
                    delay = self.retry_delay_base * \
                        (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(delay)
                    continue
                else:
                    return {
                        "response": "I apologize, but the request to Google's AI service timed out. This can happen during periods of high demand. Please try again in a moment.",
                        "success": False,
                        "error": "Google API timeout",
                        "course_content_used": False,
                        "content_files_count": 0
                    }
            except Exception as e:
                # Handle specific Google API errors
                if isinstance(e, google_exceptions.ServiceUnavailable):
                    return {
                        "response": "I apologize, but Google's AI service is currently experiencing high demand and is temporarily unavailable. This is a temporary issue on Google's servers. Please try again in a few minutes.",
                        "success": False,
                        "error": "Google API service unavailable",
                        "course_content_used": False,
                        "content_files_count": 0
                    }
                elif isinstance(e, google_exceptions.RetryError):
                    return {
                        "response": "I apologize, but the request to Google's AI service timed out. This can happen during periods of high demand. Please try again in a moment.",
                        "success": False,
                        "error": "Google API timeout",
                        "course_content_used": False,
                        "content_files_count": 0
                    }
                elif isinstance(e, google_exceptions.QuotaExceeded):
                    return {
                        "response": "I apologize, but the API quota has been exceeded. Please try again later or contact support if this issue persists.",
                        "success": False,
                        "error": "API quota exceeded",
                        "course_content_used": False,
                        "content_files_count": 0
                    }
                else:
                    # Handle other errors
                    error_message = str(e)
                    if "timeout" in error_message.lower() or "503" in error_message:
                        user_message = "I apologize, but Google's AI service is currently experiencing issues. Please try again in a few minutes."
                    else:
                        user_message = f"I apologize, but I encountered an error while processing your request with files: {error_message}. Please try again or contact support if the issue persists."

                    return {
                        "response": user_message,
                        "success": False,
                        "error": str(e),
                        "course_content_used": False,
                        "content_files_count": 0
                    }

        # This should never be reached, but just in case
        return {
            "response": "I apologize, but the AI service is currently experiencing issues. Please try again in a few minutes.",
            "success": False,
            "error": "Max retries exceeded",
            "course_content_used": False,
            "content_files_count": 0
        }

    def get_echo_status(self) -> Dict[str, Any]:
        """Get ECHO system status and configuration"""
        try:
            # Get document processing capabilities
            supported_formats = self.document_processor.get_supported_formats()

            # Test API connectivity
            api_status = "unknown"
            api_error = None
            if self.model:
                try:
                    # Simple test call
                    response = self.model.generate_content("test")
                    api_status = "connected"
                except google_exceptions.ServiceUnavailable:
                    api_status = "service_unavailable"
                    api_error = "Google API service is currently overloaded"
                except google_exceptions.RetryError:
                    api_status = "timeout"
                    api_error = "Google API request timed out"
                except Exception as e:
                    api_status = "error"
                    api_error = str(e)
            else:
                api_status = "not_initialized"
                api_error = "Model not initialized"

            return {
                "model_available": self.model is not None,
                "model_name": os.getenv('ECHO_MODEL', 'gemini-1.5-flash'),
                "api_status": api_status,
                "api_error": api_error,
                "course_content_enabled": self.course_content_enabled,
                "analytics_enabled": self.analytics_enabled,
                "voice_enabled": self.voice_enabled,
                "multilingual_enabled": self.multilingual_enabled,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
                "max_history": self.max_history,
                "s3_bucket": self.bucket_name,
                "aws_configured": bool(os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('USE_IAM_ROLE') == 'true'),
                "document_processing": {
                    "supported_formats": len(supported_formats),
                    "formats": list(supported_formats.keys()),
                    "enhanced_processing": True
                }
            }
        except Exception as e:
            return {
                "error": f"Error getting ECHO status: {str(e)}",
                "model_available": False,
                "api_status": "error",
                "api_error": str(e),
                "aws_configured": False,
                "course_content_enabled": False
            }


# Global instance
gemini_service = GeminiService()
