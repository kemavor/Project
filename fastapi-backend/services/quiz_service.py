import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from models import (
    User, Course, MCQ, EnhancedQuizSession, QuizAttemptMCQ,
    MasterTopic, SubMasterTopic, SpecificMasterTopic, UserTopicProgress
)
from services.gemini_service import gemini_service
from schemas import (
    QuizStartRequest, QuizResults, UserQuizStats, 
    MCQQuestion, UserTopicProgressResponse
)

class QuizService:
    def __init__(self):
        pass
    
    async def generate_quiz_questions(
        self, 
        topic: str, 
        num_questions: int, 
        difficulty: str,
        course_id: Optional[int] = None,
        user_id: Optional[int] = None,
        db: Session = None
    ) -> Dict[str, Any]:
        """Generate quiz questions using Gemini AI"""
        
        # Get course context if provided
        course_context = ""
        if course_id and db:
            course = db.query(Course).filter(Course.id == course_id).first()
            if course:
                course_context = f"Course: {course.title}\nDescription: {course.description}\n"
        
        # Get user's previous questions to avoid duplicates
        previous_questions = []
        if user_id and db:
            recent_mcqs = db.query(MCQ).join(QuizAttemptMCQ).join(EnhancedQuizSession).filter(
                EnhancedQuizSession.user_id == user_id
            ).order_by(desc(MCQ.created_at)).limit(50).all()
            
            for mcq in recent_mcqs:
                if isinstance(mcq.question_data, dict) and 'questions' in mcq.question_data:
                    for q in mcq.question_data['questions']:
                        if isinstance(q, dict) and 'question' in q:
                            previous_questions.append(q['question'])
        
        # Create prompt for Gemini
        avoid_questions_text = ""
        if previous_questions:
            avoid_questions_text = f"\\nAvoid generating questions similar to these recent ones:\\n{json.dumps(previous_questions[:10], indent=2)}"
        
        user_prompt = f"""
        Generate {num_questions} unique multiple-choice questions about {topic}.
        
        {course_context}
        
        Requirements:
        - Difficulty level: {difficulty}
        - Each question must have exactly 4 options (A, B, C, D)
        - Only one correct answer per question
        - Questions should be educational and test understanding
        - Make questions practical and applicable
        {avoid_questions_text}
        
        Return ONLY a valid JSON object in this exact format:
        {{
            "questions": [
                {{
                    "question": "What is...?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer": "Option A"
                }}
            ]
        }}
        
        Important: Ensure the "answer" field contains the exact text from one of the options.
        """
        
        try:
            # Call Gemini API via existing service
            response = gemini_service.chat_with_context(
                message=user_prompt,
                course_id=course_id,
                db_session=db
            )
            
            if not response.get('success') or not response.get('response'):
                return {
                    "success": False,
                    "error": "Failed to generate questions with AI",
                    "questions": []
                }
            
            # Parse the JSON response
            ai_response = response['response'].strip()
            
            # Clean up the response - remove markdown code blocks if present
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            
            ai_response = ai_response.strip()
            
            try:
                questions_data = json.loads(ai_response)
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                print(f"Response was: {ai_response}")
                return {
                    "success": False,
                    "error": "Invalid JSON format from AI",
                    "questions": []
                }
            
            # Validate the structure
            if not isinstance(questions_data, dict) or 'questions' not in questions_data:
                return {
                    "success": False,
                    "error": "Invalid response structure from AI",
                    "questions": []
                }
            
            questions = questions_data['questions']
            if not isinstance(questions, list):
                return {
                    "success": False,
                    "error": "Questions should be a list",
                    "questions": []
                }
            
            # Validate each question
            validated_questions = []
            for i, q in enumerate(questions):
                if not isinstance(q, dict):
                    continue
                
                if not all(key in q for key in ['question', 'options', 'answer']):
                    continue
                
                if not isinstance(q['options'], list) or len(q['options']) != 4:
                    continue
                
                if q['answer'] not in q['options']:
                    # Try to match the answer with an option
                    answer_text = q['answer'].strip()
                    matched = False
                    for option in q['options']:
                        if option.strip() == answer_text:
                            q['answer'] = option
                            matched = True
                            break
                    if not matched:
                        # Set the answer to the first option as fallback
                        q['answer'] = q['options'][0]
                
                validated_questions.append(q)
            
            if len(validated_questions) == 0:
                return {
                    "success": False,
                    "error": "No valid questions generated",
                    "questions": []
                }
            
            return {
                "success": True,
                "questions": validated_questions,
                "ai_model": response.get('model_used', 'gemini-1.5-flash'),
                "generation_prompt": user_prompt
            }
            
        except Exception as e:
            print(f"Error generating quiz questions: {e}")
            return {
                "success": False,
                "error": str(e),
                "questions": []
            }
    
    def create_quiz_session(
        self,
        user_id: int,
        quiz_request: QuizStartRequest,
        questions_data: Dict[str, Any],
        db: Session
    ) -> EnhancedQuizSession:
        """Create a new quiz session with generated questions"""
        
        # Get or create topic hierarchy
        specific_topic = self._get_or_create_topics(
            topic_name=quiz_request.topic,
            course_id=quiz_request.course_id,
            db=db
        )
        
        # Create quiz session
        session_id = str(uuid.uuid4())
        quiz_session = EnhancedQuizSession(
            session_id=session_id,
            user_id=user_id,
            course_id=quiz_request.course_id,
            specific_topic_id=specific_topic.id if specific_topic else None,
            topic_name=quiz_request.topic,
            difficulty=quiz_request.difficulty,
            num_questions=quiz_request.num_questions,
            time_limit=quiz_request.time_limit,
            questions_json=questions_data,
            total_questions=len(questions_data.get('questions', []))
        )
        
        db.add(quiz_session)
        db.commit()
        db.refresh(quiz_session)
        
        # Create MCQ record for future reference
        if questions_data.get('questions'):
            mcq = MCQ(
                question_data=questions_data,
                difficulty=quiz_request.difficulty,
                time_limit=quiz_request.time_limit,
                specific_topic_id=specific_topic.id if specific_topic else None,
                course_id=quiz_request.course_id,
                ai_generated=True,
                generation_prompt=questions_data.get('generation_prompt'),
                ai_model_used=questions_data.get('ai_model', 'gemini-1.5-flash')
            )
            db.add(mcq)
            db.commit()
        
        return quiz_session
    
    def submit_answer(
        self,
        session_id: str,
        question_index: int,
        user_answer: str,
        time_taken: int,
        user_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """Submit an answer for a specific question"""
        
        # Get quiz session
        quiz_session = db.query(EnhancedQuizSession).filter(
            EnhancedQuizSession.session_id == session_id,
            EnhancedQuizSession.user_id == user_id
        ).first()
        
        if not quiz_session:
            return {"success": False, "error": "Quiz session not found"}
        
        if quiz_session.status != 'active':
            return {"success": False, "error": "Quiz session is not active"}
        
        # Get question data
        questions = quiz_session.questions_json.get('questions', [])
        if question_index >= len(questions):
            return {"success": False, "error": "Invalid question index"}
        
        question = questions[question_index]
        correct_answer = question['answer']
        is_correct = user_answer.strip() == correct_answer.strip()
        
        # Check if answer already exists
        existing_attempt = db.query(QuizAttemptMCQ).filter(
            QuizAttemptMCQ.quiz_session_id == quiz_session.id,
            QuizAttemptMCQ.question_index == question_index
        ).first()
        
        if existing_attempt:
            # Update existing answer
            existing_attempt.user_answer = user_answer
            existing_attempt.is_correct = is_correct
            existing_attempt.time_taken = time_taken
            existing_attempt.answered_at = datetime.utcnow()
        else:
            # Create new attempt
            attempt = QuizAttemptMCQ(
                quiz_session_id=quiz_session.id,
                question_index=question_index,
                question_text=question['question'],
                options_json=question['options'],
                correct_answer=correct_answer,
                user_answer=user_answer,
                is_correct=is_correct,
                time_taken=time_taken,
                answered_at=datetime.utcnow()
            )
            db.add(attempt)
        
        # Update quiz session progress
        quiz_session.current_question_index = max(
            quiz_session.current_question_index,
            question_index + 1
        )
        
        db.commit()
        
        return {
            "success": True,
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "question_index": question_index
        }
    
    def complete_quiz(
        self,
        session_id: str,
        total_time_taken: int,
        user_id: int,
        db: Session
    ) -> QuizResults:
        """Complete quiz and calculate final results"""
        
        # Get quiz session
        quiz_session = db.query(EnhancedQuizSession).filter(
            EnhancedQuizSession.session_id == session_id,
            EnhancedQuizSession.user_id == user_id
        ).first()
        
        if not quiz_session:
            raise ValueError("Quiz session not found")
        
        # Calculate results
        attempts = db.query(QuizAttemptMCQ).filter(
            QuizAttemptMCQ.quiz_session_id == quiz_session.id
        ).all()
        
        correct_answers = sum(1 for attempt in attempts if attempt.is_correct)
        total_answered = len(attempts)
        
        # Calculate score and coins
        percentage = (correct_answers / quiz_session.total_questions * 100) if quiz_session.total_questions > 0 else 0
        qv_coins = self._calculate_qv_coins(correct_answers, quiz_session.difficulty, total_time_taken)
        
        # Update quiz session
        quiz_session.status = 'completed'
        quiz_session.score = correct_answers
        quiz_session.time_taken = total_time_taken
        quiz_session.qv_coins_earned = qv_coins
        quiz_session.completed_at = datetime.utcnow()
        
        # Update user progress
        self._update_user_progress(
            user_id=user_id,
            specific_topic_id=quiz_session.specific_topic_id,
            questions_attempted=total_answered,
            questions_correct=correct_answers,
            qv_coins=qv_coins,
            db=db
        )
        
        db.commit()
        
        # Prepare results
        questions_breakdown = []
        for attempt in attempts:
            questions_breakdown.append({
                "question": attempt.question_text,
                "user_answer": attempt.user_answer,
                "correct_answer": attempt.correct_answer,
                "is_correct": attempt.is_correct,
                "time_taken": attempt.time_taken
            })
        
        return QuizResults(
            session_id=session_id,
            score=correct_answers,
            total_questions=quiz_session.total_questions,
            percentage=round(percentage, 2),
            time_taken=total_time_taken,
            qv_coins_earned=qv_coins,
            questions_breakdown=questions_breakdown,
            difficulty=quiz_session.difficulty,
            topic_name=quiz_session.topic_name,
            completed_at=quiz_session.completed_at
        )
    
    def _get_or_create_topics(
        self, 
        topic_name: str, 
        course_id: Optional[int], 
        db: Session
    ) -> Optional[SpecificMasterTopic]:
        """Create topic hierarchy for quiz organization"""
        
        try:
            # For now, create a simple hierarchy
            master_topic_name = topic_name
            sub_topic_name = f"{topic_name} Basics"
            specific_topic_name = topic_name
            
            # Get or create master topic
            master_topic = db.query(MasterTopic).filter(
                MasterTopic.name == master_topic_name
            ).first()
            
            if not master_topic:
                master_topic = MasterTopic(
                    name=master_topic_name,
                    description=f"Questions related to {topic_name}"
                )
                db.add(master_topic)
                db.commit()
                db.refresh(master_topic)
            
            # Get or create sub topic
            sub_topic = db.query(SubMasterTopic).filter(
                SubMasterTopic.name == sub_topic_name,
                SubMasterTopic.master_topic_id == master_topic.id
            ).first()
            
            if not sub_topic:
                sub_topic = SubMasterTopic(
                    name=sub_topic_name,
                    master_topic_id=master_topic.id,
                    description=f"Basic concepts in {topic_name}"
                )
                db.add(sub_topic)
                db.commit()
                db.refresh(sub_topic)
            
            # Get or create specific topic
            specific_topic = db.query(SpecificMasterTopic).filter(
                SpecificMasterTopic.name == specific_topic_name,
                SpecificMasterTopic.sub_topic_id == sub_topic.id
            ).first()
            
            if not specific_topic:
                specific_topic = SpecificMasterTopic(
                    name=specific_topic_name,
                    sub_topic_id=sub_topic.id,
                    course_id=course_id,
                    description=f"Specific questions about {topic_name}"
                )
                db.add(specific_topic)
                db.commit()
                db.refresh(specific_topic)
            
            return specific_topic
            
        except Exception as e:
            print(f"Error creating topics: {e}")
            return None
    
    def _calculate_qv_coins(self, correct_answers: int, difficulty: str, time_taken: int) -> int:
        """Calculate QV coins based on performance"""
        base_coins = correct_answers * 10
        
        # Difficulty multiplier
        if difficulty.lower() == 'hard':
            base_coins *= 2
        elif difficulty.lower() == 'medium':
            base_coins *= 1.5
        
        # Time bonus (if completed quickly)
        if time_taken < 300:  # Less than 5 minutes
            base_coins *= 1.2
        elif time_taken < 600:  # Less than 10 minutes
            base_coins *= 1.1
        
        return int(base_coins)
    
    def _update_user_progress(
        self,
        user_id: int,
        specific_topic_id: Optional[int],
        questions_attempted: int,
        questions_correct: int,
        qv_coins: int,
        db: Session
    ):
        """Update user's topic progress and statistics"""
        
        if not specific_topic_id:
            return
        
        try:
            # Get or create user progress
            progress = db.query(UserTopicProgress).filter(
                UserTopicProgress.user_id == user_id,
                UserTopicProgress.specific_topic_id == specific_topic_id
            ).first()
            
            if not progress:
                # Get the topic relationships to set properly
                specific_topic = db.query(SpecificMasterTopic).filter(
                    SpecificMasterTopic.id == specific_topic_id
                ).first()
                
                # Get sub_topic and master_topic relationships safely
                sub_topic_id = None
                master_topic_id = None
                if specific_topic:
                    sub_topic_id = specific_topic.sub_topic_id
                    if specific_topic.sub_topic:
                        master_topic_id = specific_topic.sub_topic.master_topic_id
                
                progress = UserTopicProgress(
                    user_id=user_id,
                    specific_topic_id=specific_topic_id,
                    sub_topic_id=sub_topic_id,
                    master_topic_id=master_topic_id,
                    level=1,
                    streak=0,
                    total_qv_coins=0,
                    questions_attempted=0,
                    questions_correct=0,
                    last_activity=datetime.utcnow()
                )
                db.add(progress)
                db.flush()  # Ensure progress is saved before updating
            
            # Ensure all numeric fields have proper defaults before updating
            if progress.questions_attempted is None:
                progress.questions_attempted = 0
            if progress.questions_correct is None:
                progress.questions_correct = 0
            if progress.total_qv_coins is None:
                progress.total_qv_coins = 0
            if progress.streak is None:
                progress.streak = 0
            if progress.level is None:
                progress.level = 1
            
            # Update progress - now safe to use += operations
            progress.questions_attempted += questions_attempted
            progress.questions_correct += questions_correct
            progress.total_qv_coins += qv_coins
            progress.last_activity = datetime.utcnow()
            
            # Update streak (simplified logic)
            if questions_correct > questions_attempted * 0.7:  # 70% correct
                progress.streak += 1
            else:
                progress.streak = 0
            
            # Level up logic
            coins_needed = progress.level * 100  # 100 coins per level
            if progress.total_qv_coins >= coins_needed:
                progress.level += 1
            
            db.commit()
            
        except Exception as e:
            print(f"Error updating user progress: {e}")
            db.rollback()
            raise e

# Global instance
quiz_service = QuizService()