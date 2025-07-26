import google.generativeai as genai
import boto3
import json
import os
from typing import List, Dict, Any, Optional
from botocore.exceptions import ClientError, NoCredentialsError


class GeminiService:
    def __init__(self):
        # Initialize Gemini AI
        self.api_key = "AIzaSyApVQ5Y6B3w97Z3Qk22oP9S0dUvZqTDbvY"
        genai.configure(api_key=self.api_key)

        try:
            # Try different model names
            try:
                self.model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception:
                try:
                    self.model = genai.GenerativeModel('gemini-1.5-pro')
                except Exception:
                    # Fallback to basic model
                    self.model = genai.GenerativeModel('gemini-2.0-flash')
        except Exception as e:
            print(f"Warning: Could not initialize Gemini model: {e}")
            self.model = None

        # Initialize S3 client
        self.s3_client = boto3.client(
            's3',
            region_name='us-east-1',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )

        # S3 bucket configuration
        self.bucket_name = 'visionware-lecture-courses'

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

**Context Available:**
- Course documents and materials from S3 bucket
- Course descriptions and syllabi
- Student's enrolled courses and progress
- Live stream transcripts and summaries
- Previous conversation context

**Response Format:**
- Use markdown for formatting (bold, italics, lists)
- Include relevant course content when available
- Suggest next steps or additional resources
- Sign off as "ECHO" to reinforce the brand
"""

    def get_s3_course_content(self, course_id: int) -> List[Dict[str, Any]]:
        """Retrieve course content from S3 bucket"""
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

                    # Get object metadata
                    try:
                        head_response = self.s3_client.head_object(
                            Bucket=self.bucket_name,
                            Key=key
                        )

                        # Extract content based on file type
                        content = self._extract_file_content(
                            key, head_response.get('ContentType', ''))

                        if content:
                            course_content.append({
                                'filename': os.path.basename(key),
                                'file_type': head_response.get('ContentType', 'unknown'),
                                'size': obj['Size'],
                                'last_modified': obj['LastModified'].isoformat(),
                                'content': content,
                                's3_key': key
                            })

                    except ClientError as e:
                        print(f"Error accessing file {key}: {e}")
                        continue

            return course_content

        except (ClientError, NoCredentialsError) as e:
            print(f"Error accessing S3: {e}")
            return []

    def _extract_file_content(self, key: str, content_type: str) -> Optional[str]:
        """Extract text content from different file types"""
        try:
            # For now, we'll focus on text-based files
            text_extensions = ['.txt', '.md', '.pdf', '.doc', '.docx']
            file_extension = os.path.splitext(key)[1].lower()

            if file_extension in text_extensions:
                # Get the object content
                response = self.s3_client.get_object(
                    Bucket=self.bucket_name,
                    Key=key
                )

                # For text files, decode the content
                if content_type.startswith('text/') or file_extension in ['.txt', '.md']:
                    return response['Body'].read().decode('utf-8')

                # For other files, return metadata for now
                # In a production system, you'd use libraries like PyPDF2, python-docx, etc.
                return f"File: {os.path.basename(key)} (Type: {content_type}, Size: {response['ContentLength']} bytes)"

            return None

        except Exception as e:
            print(f"Error extracting content from {key}: {e}")
            return None

    def get_course_context(self, course_id: int) -> str:
        """Get comprehensive course context from S3"""
        course_content = self.get_s3_course_content(course_id)

        if not course_content:
            return "No course content available in S3 bucket."

        context_parts = []
        context_parts.append(f"Course ID: {course_id}")
        context_parts.append(f"Available files: {len(course_content)}")
        context_parts.append("\nCourse Content:")

        for item in course_content:
            context_parts.append(f"\n--- {item['filename']} ---")
            context_parts.append(f"Type: {item['file_type']}")
            context_parts.append(f"Size: {item['size']} bytes")
            context_parts.append(f"Last Modified: {item['last_modified']}")
            if item['content']:
                # Truncate content if too long
                content = item['content'][:2000] + \
                    "..." if len(item['content']) > 2000 else item['content']
                context_parts.append(f"Content Preview:\n{content}")

        return "\n".join(context_parts)

    def chat_with_context(self, message: str, course_id: Optional[int] = None, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """Chat with ECHO using course context"""
        try:
            # Check if model is available
            if not self.model:
                return {
                    "response": "I apologize, but the AI service is currently unavailable. Please try again later or contact support.\n\n— ECHO",
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
            if course_id:
                course_context = self.get_course_context(course_id)
                conversation.append({
                    "role": "user",
                    "parts": [f"Course Context:\n{course_context}"]
                })

            # Add conversation history
            if conversation_history:
                # Limit to last 10 messages
                for msg in conversation_history[-10:]:
                    conversation.append({
                        "role": msg.get("role", "user"),
                        "parts": [msg.get("content", "")]
                    })

            # Add current message
            conversation.append({
                "role": "user",
                "parts": [message]
            })

            # Generate response
            response = self.model.generate_content(conversation)

            # Extract course content info
            course_content_used = course_id is not None
            content_files_count = len(
                self.get_s3_course_content(course_id)) if course_id else 0

            return {
                "response": response.text + "\n\n— ECHO",
                "success": True,
                "course_content_used": course_content_used,
                "content_files_count": content_files_count,
                "model_used": "gemini-pro"
            }

        except Exception as e:
            return {
                "response": f"I apologize, but I encountered an error while processing your request: {str(e)}. Please try again or contact support if the issue persists.\n\n— ECHO",
                "success": False,
                "error": str(e),
                "course_content_used": False,
                "content_files_count": 0
            }

    def analyze_course_content(self, course_id: int) -> Dict[str, Any]:
        """Analyze course content and provide insights"""
        try:
            course_content = self.get_s3_course_content(course_id)

            if not course_content:
                return {
                    "success": False,
                    "analysis": "No course content found in S3 bucket",
                    "content_count": 0,
                    "file_types": []
                }

            # Create analysis prompt
            analysis_prompt = f"""
Analyze the following course content and provide insights:

Course ID: {course_id}
Number of files: {len(course_content)}

Content Summary:
"""

            for item in course_content:
                analysis_prompt += f"\n- {item['filename']} ({item['file_type']}, {item['size']} bytes)"
                if item['content']:
                    content_preview = item['content'][:500] + \
                        "..." if len(item['content']
                                     ) > 500 else item['content']
                    analysis_prompt += f"\n  Preview: {content_preview}"

            analysis_prompt += "\n\nPlease provide:\n1. Content overview\n2. Key topics covered\n3. Learning objectives\n4. Suggested study approach"

            # Generate analysis
            if self.model:
                response = self.model.generate_content(analysis_prompt)
                analysis_text = response.text
            else:
                analysis_text = "AI model not available for analysis"

            # Extract file types
            file_types = list(set([item['file_type']
                              for item in course_content]))

            return {
                "success": True,
                "analysis": analysis_text,
                "content_count": len(course_content),
                "file_types": file_types
            }

        except Exception as e:
            return {
                "success": False,
                "analysis": f"Error analyzing course content: {str(e)}",
                "content_count": 0,
                "file_types": []
            }


# Global instance
gemini_service = GeminiService()
