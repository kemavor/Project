"""
User Statistics Calculation Service
Provides real-time, accurate user statistics based on actual quiz performance and activity
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, distinct
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
from collections import defaultdict

from models import (
    User, QuizSession, QuestionAnswer, GeneratedQuestion, 
    LiveStream, Course, Enrollment, LectureTranscription
)
from database import SessionLocal

logger = logging.getLogger(__name__)


class UserStatisticsService:
    """Service for calculating real user statistics"""
    
    def __init__(self):
        self.db = SessionLocal()
    
    def __del__(self):
        self.db.close()
    
    def get_comprehensive_student_progress(self, user_id: int, course_id: Optional[int] = None) -> Dict[str, Any]:
        """Get comprehensive student progress statistics"""
        try:
            # Base query for quiz sessions
            sessions_query = self.db.query(QuizSession).filter(
                QuizSession.user_id == user_id,
                QuizSession.is_completed == True
            )
            
            # Filter by course if specified
            if course_id:
                sessions_query = sessions_query.join(LiveStream).filter(
                    LiveStream.course_id == course_id
                )
            
            completed_sessions = sessions_query.all()
            
            # Calculate core statistics
            stats = self._calculate_core_quiz_stats(user_id, completed_sessions, course_id)
            
            # Calculate learning patterns
            learning_stats = self._calculate_learning_patterns(user_id, completed_sessions)
            
            # Calculate subject analysis
            subject_stats = self._calculate_subject_performance(user_id, course_id)
            
            # Calculate time-based statistics
            time_stats = self._calculate_time_based_stats(user_id, completed_sessions)
            
            # Calculate streaks and engagement
            engagement_stats = self._calculate_engagement_stats(user_id)
            
            # Calculate difficulty progression
            difficulty_stats = self._calculate_difficulty_progression(user_id)
            
            # Combine all statistics
            comprehensive_stats = {
                **stats,
                **learning_stats,
                **subject_stats,
                **time_stats,
                **engagement_stats,
                **difficulty_stats,
                "last_updated": datetime.utcnow().isoformat(),
                "calculation_method": "real_time_database_analysis"
            }
            
            logger.info(f"Calculated comprehensive statistics for user {user_id}")
            return comprehensive_stats
            
        except Exception as e:
            logger.error(f"Error calculating student progress for user {user_id}: {e}")
            return self._get_default_stats()
    
    def _calculate_core_quiz_stats(self, user_id: int, sessions: List[QuizSession], course_id: Optional[int] = None) -> Dict[str, Any]:
        """Calculate core quiz performance statistics"""
        if not sessions:
            return {
                "total_quizzes_taken": 0,
                "average_score": 0.0,
                "total_questions_answered": 0,
                "correct_answers": 0,
                "accuracy_rate": 0.0,
                "pass_rate": 0.0
            }
        
        # Basic counts
        total_sessions = len(sessions)
        total_questions = sum(s.total_questions for s in sessions)
        total_correct = sum(s.correct_answers for s in sessions)
        
        # Calculate average score (weighted by questions)
        weighted_scores = [(s.score_percentage * s.total_questions) for s in sessions if s.score_percentage is not None]
        average_score = sum(weighted_scores) / total_questions if total_questions > 0 else 0.0
        
        # Calculate pass rate (assuming 60% is passing)
        passing_threshold = 60.0
        passed_sessions = len([s for s in sessions if s.score_percentage and s.score_percentage >= passing_threshold])
        pass_rate = (passed_sessions / total_sessions) * 100 if total_sessions > 0 else 0.0
        
        # Calculate accuracy rate
        accuracy_rate = (total_correct / total_questions) * 100 if total_questions > 0 else 0.0
        
        return {
            "total_quizzes_taken": total_sessions,
            "average_score": round(average_score, 2),
            "total_questions_answered": total_questions,
            "correct_answers": total_correct,
            "accuracy_rate": round(accuracy_rate, 2),
            "pass_rate": round(pass_rate, 2)
        }
    
    def _calculate_learning_patterns(self, user_id: int, sessions: List[QuizSession]) -> Dict[str, Any]:
        """Calculate learning patterns and trends"""
        if not sessions:
            return {
                "recent_quiz_scores": [],
                "performance_trend": "stable",
                "improvement_rate": 0.0,
                "consistency_score": 0.0
            }
        
        # Get recent quiz scores (last 10 sessions)
        recent_sessions = sorted(sessions, key=lambda x: x.started_at, reverse=True)[:10]
        recent_scores = [s.score_percentage for s in recent_sessions if s.score_percentage is not None]
        
        # Calculate performance trend
        trend = self._calculate_performance_trend(recent_scores)
        
        # Calculate improvement rate (compare first half vs second half of recent scores)
        improvement_rate = self._calculate_improvement_rate(recent_scores)
        
        # Calculate consistency score (lower standard deviation = more consistent)
        consistency = self._calculate_consistency_score(recent_scores)
        
        return {
            "recent_quiz_scores": recent_scores,
            "performance_trend": trend,
            "improvement_rate": round(improvement_rate, 2),
            "consistency_score": round(consistency, 2)
        }
    
    def _calculate_subject_performance(self, user_id: int, course_id: Optional[int] = None) -> Dict[str, Any]:
        """Calculate performance by subject/topic"""
        try:
            # Get question answers with topic information
            query = self.db.query(QuestionAnswer, GeneratedQuestion, LiveStream, Course).join(
                GeneratedQuestion, QuestionAnswer.question_id == GeneratedQuestion.id
            ).join(
                LiveStream, GeneratedQuestion.stream_id == LiveStream.id
            ).join(
                Course, LiveStream.course_id == Course.id
            ).filter(
                QuestionAnswer.user_id == user_id
            )
            
            if course_id:
                query = query.filter(Course.id == course_id)
            
            answers_data = query.all()
            
            # Analyze by subject (course)
            subject_performance = defaultdict(lambda: {"correct": 0, "total": 0})
            subjects_studied = set()
            
            # Analyze by topic tags
            topic_performance = defaultdict(lambda: {"correct": 0, "total": 0})
            
            for answer, question, stream, course in answers_data:
                # Subject analysis
                subject_name = course.title
                subjects_studied.add(subject_name)
                subject_performance[subject_name]["total"] += 1
                if answer.is_correct:
                    subject_performance[subject_name]["correct"] += 1
                
                # Topic analysis
                if question.topic_tags:
                    for topic in question.topic_tags:
                        topic_performance[topic]["total"] += 1
                        if answer.is_correct:
                            topic_performance[topic]["correct"] += 1
            
            # Calculate subject percentages
            subject_stats = {}
            for subject, stats in subject_performance.items():
                if stats["total"] > 0:
                    subject_stats[subject] = {
                        "accuracy": round((stats["correct"] / stats["total"]) * 100, 2),
                        "questions_answered": stats["total"],
                        "correct_answers": stats["correct"]
                    }
            
            # Calculate topic percentages
            topic_stats = {}
            for topic, stats in topic_performance.items():
                if stats["total"] > 2:  # Only include topics with enough data
                    topic_stats[topic] = {
                        "accuracy": round((stats["correct"] / stats["total"]) * 100, 2),
                        "questions_answered": stats["total"]
                    }
            
            # Find strongest and weakest areas
            strongest_subject = max(subject_stats.items(), key=lambda x: x[1]["accuracy"])[0] if subject_stats else None
            weakest_subject = min(subject_stats.items(), key=lambda x: x[1]["accuracy"])[0] if subject_stats else None
            
            return {
                "subjects_studied": list(subjects_studied),
                "subject_performance": subject_stats,
                "topic_performance": topic_stats,
                "strongest_subject": strongest_subject,
                "weakest_subject": weakest_subject,
                "subjects_count": len(subjects_studied)
            }
            
        except Exception as e:
            logger.error(f"Error calculating subject performance: {e}")
            return {
                "subjects_studied": [],
                "subject_performance": {},
                "topic_performance": {},
                "strongest_subject": None,
                "weakest_subject": None,
                "subjects_count": 0
            }
    
    def _calculate_time_based_stats(self, user_id: int, sessions: List[QuizSession]) -> Dict[str, Any]:
        """Calculate time-based statistics"""
        if not sessions:
            return {
                "time_spent_learning": 0,
                "average_quiz_duration": 0.0,
                "total_study_sessions": 0,
                "study_efficiency": 0.0
            }
        
        # Calculate total time spent
        total_time_minutes = 0
        valid_sessions = []
        
        for session in sessions:
            if session.completed_at and session.started_at:
                duration = (session.completed_at - session.started_at).total_seconds() / 60
                if 0 < duration <= 180:  # Reasonable quiz duration (0-3 hours)
                    total_time_minutes += duration
                    valid_sessions.append((session, duration))
        
        # Calculate average quiz duration
        avg_duration = total_time_minutes / len(valid_sessions) if valid_sessions else 0.0
        
        # Calculate study efficiency (score per minute)
        efficiency_scores = []
        for session, duration in valid_sessions:
            if duration > 0 and session.score_percentage is not None:
                efficiency = session.score_percentage / duration
                efficiency_scores.append(efficiency)
        
        avg_efficiency = sum(efficiency_scores) / len(efficiency_scores) if efficiency_scores else 0.0
        
        return {
            "time_spent_learning": int(total_time_minutes * 60),  # Convert to seconds
            "average_quiz_duration": round(avg_duration, 2),
            "total_study_sessions": len(valid_sessions),
            "study_efficiency": round(avg_efficiency, 2)
        }
    
    def _calculate_engagement_stats(self, user_id: int) -> Dict[str, Any]:
        """Calculate engagement and streak statistics"""
        try:
            # Get all quiz sessions ordered by date
            all_sessions = self.db.query(QuizSession).filter(
                QuizSession.user_id == user_id,
                QuizSession.is_completed == True
            ).order_by(QuizSession.started_at).all()
            
            if not all_sessions:
                return {
                    "learning_streak": 0,
                    "longest_streak": 0,
                    "days_active": 0,
                    "weekly_activity": 0.0,
                    "last_activity": None
                }
            
            # Calculate current learning streak
            current_streak, longest_streak = self._calculate_learning_streaks(all_sessions)
            
            # Calculate days active
            unique_days = set()
            for session in all_sessions:
                day = session.started_at.date()
                unique_days.add(day)
            
            days_active = len(unique_days)
            
            # Calculate weekly activity (sessions per week over last 4 weeks)
            four_weeks_ago = datetime.utcnow() - timedelta(weeks=4)
            recent_sessions = [s for s in all_sessions if s.started_at >= four_weeks_ago]
            weekly_activity = len(recent_sessions) / 4.0
            
            # Last activity
            last_activity = all_sessions[-1].started_at.isoformat() if all_sessions else None
            
            return {
                "learning_streak": current_streak,
                "longest_streak": longest_streak,
                "days_active": days_active,
                "weekly_activity": round(weekly_activity, 2),
                "last_activity": last_activity
            }
            
        except Exception as e:
            logger.error(f"Error calculating engagement stats: {e}")
            return {
                "learning_streak": 0,
                "longest_streak": 0,
                "days_active": 0,
                "weekly_activity": 0.0,
                "last_activity": None
            }
    
    def _calculate_difficulty_progression(self, user_id: int) -> Dict[str, Any]:
        """Calculate performance across difficulty levels"""
        try:
            # Get question answers with difficulty information
            query = self.db.query(QuestionAnswer, GeneratedQuestion).join(
                GeneratedQuestion, QuestionAnswer.question_id == GeneratedQuestion.id
            ).filter(
                QuestionAnswer.user_id == user_id
            )
            
            answers_data = query.all()
            
            difficulty_stats = defaultdict(lambda: {"correct": 0, "total": 0})
            
            for answer, question in answers_data:
                difficulty = question.difficulty_level or "medium"
                difficulty_stats[difficulty]["total"] += 1
                if answer.is_correct:
                    difficulty_stats[difficulty]["correct"] += 1
            
            # Calculate percentages for each difficulty
            difficulty_performance = {}
            for difficulty, stats in difficulty_stats.items():
                if stats["total"] > 0:
                    accuracy = (stats["correct"] / stats["total"]) * 100
                    difficulty_performance[difficulty] = {
                        "accuracy": round(accuracy, 2),
                        "questions_answered": stats["total"],
                        "correct_answers": stats["correct"]
                    }
            
            # Determine readiness for harder questions
            easy_accuracy = difficulty_performance.get("easy", {}).get("accuracy", 0)
            medium_accuracy = difficulty_performance.get("medium", {}).get("accuracy", 0)
            hard_accuracy = difficulty_performance.get("hard", {}).get("accuracy", 0)
            
            # Progression recommendations
            recommendations = []
            if easy_accuracy >= 80 and medium_accuracy < 70:
                recommendations.append("Focus on medium difficulty questions")
            elif medium_accuracy >= 80 and hard_accuracy < 60:
                recommendations.append("Ready for hard difficulty questions")
            elif easy_accuracy < 70:
                recommendations.append("Continue practicing easy questions")
            
            return {
                "difficulty_performance": difficulty_performance,
                "progression_recommendations": recommendations,
                "ready_for_harder": easy_accuracy >= 80 and medium_accuracy >= 70
            }
            
        except Exception as e:
            logger.error(f"Error calculating difficulty progression: {e}")
            return {
                "difficulty_performance": {},
                "progression_recommendations": [],
                "ready_for_harder": False
            }
    
    def _calculate_performance_trend(self, scores: List[float]) -> str:
        """Calculate if performance is improving, declining, or stable"""
        if len(scores) < 3:
            return "insufficient_data"
        
        # Compare first third vs last third
        third = len(scores) // 3
        if third == 0:
            third = 1
        
        early_avg = sum(scores[-third*3:-third*2]) / third
        recent_avg = sum(scores[-third:]) / third
        
        difference = recent_avg - early_avg
        
        if difference > 5:
            return "improving"
        elif difference < -5:
            return "declining"
        else:
            return "stable"
    
    def _calculate_improvement_rate(self, scores: List[float]) -> float:
        """Calculate rate of improvement as percentage points per quiz"""
        if len(scores) < 3:
            return 0.0
        
        # Simple linear regression slope
        n = len(scores)
        x_values = list(range(n))
        
        x_mean = sum(x_values) / n
        y_mean = sum(scores) / n
        
        numerator = sum((x_values[i] - x_mean) * (scores[i] - y_mean) for i in range(n))
        denominator = sum((x_values[i] - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return 0.0
        
        slope = numerator / denominator
        return slope  # Points per quiz
    
    def _calculate_consistency_score(self, scores: List[float]) -> float:
        """Calculate consistency score (100 - coefficient of variation)"""
        if len(scores) < 2:
            return 0.0
        
        mean_score = sum(scores) / len(scores)
        if mean_score == 0:
            return 0.0
        
        variance = sum((score - mean_score) ** 2 for score in scores) / len(scores)
        std_dev = variance ** 0.5
        
        # Coefficient of variation as percentage
        cv = (std_dev / mean_score) * 100
        
        # Consistency score (higher is more consistent)
        consistency = max(0, 100 - cv)
        return consistency
    
    def _calculate_learning_streaks(self, sessions: List[QuizSession]) -> tuple:
        """Calculate current and longest learning streaks"""
        if not sessions:
            return 0, 0
        
        # Group sessions by day
        daily_sessions = defaultdict(list)
        for session in sessions:
            day = session.started_at.date()
            daily_sessions[day].append(session)
        
        # Sort days
        sorted_days = sorted(daily_sessions.keys())
        
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        
        today = datetime.utcnow().date()
        
        # Calculate streaks (consecutive days with activity)
        for i, day in enumerate(sorted_days):
            if i == 0:
                temp_streak = 1
            else:
                prev_day = sorted_days[i - 1]
                if (day - prev_day).days == 1:
                    temp_streak += 1
                else:
                    temp_streak = 1
            
            longest_streak = max(longest_streak, temp_streak)
            
            # Update current streak if this extends to today or yesterday
            if day == today or day == (today - timedelta(days=1)):
                if i == len(sorted_days) - 1:  # Last day in sequence
                    current_streak = temp_streak
        
        # If last activity was more than 1 day ago, current streak is 0
        if sorted_days and (today - sorted_days[-1]).days > 1:
            current_streak = 0
        
        return current_streak, longest_streak
    
    def _get_default_stats(self) -> Dict[str, Any]:
        """Return default statistics structure"""
        return {
            "total_quizzes_taken": 0,
            "average_score": 0.0,
            "total_questions_answered": 0,
            "correct_answers": 0,
            "accuracy_rate": 0.0,
            "pass_rate": 0.0,
            "recent_quiz_scores": [],
            "performance_trend": "no_data",
            "improvement_rate": 0.0,
            "consistency_score": 0.0,
            "subjects_studied": [],
            "subject_performance": {},
            "topic_performance": {},
            "strongest_subject": None,
            "weakest_subject": None,
            "subjects_count": 0,
            "time_spent_learning": 0,
            "average_quiz_duration": 0.0,
            "total_study_sessions": 0,
            "study_efficiency": 0.0,
            "learning_streak": 0,
            "longest_streak": 0,
            "days_active": 0,
            "weekly_activity": 0.0,
            "last_activity": None,
            "difficulty_performance": {},
            "progression_recommendations": [],
            "ready_for_harder": False,
            "last_updated": datetime.utcnow().isoformat(),
            "calculation_method": "default_values"
        }


# Global service instance
user_statistics_service = UserStatisticsService()