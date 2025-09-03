import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText
} from '../components/ui/design-system';
import { 
  Brain, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Trophy,
  Medal,
  Target,
  AlertCircle,
  Timer,
  Flag
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Question {
  question: string;
  options: string[];
  answer: string;
}

interface QuizSession {
  id: number;
  session_id: string;
  topic_name: string;
  difficulty: string;
  num_questions: number;
  time_limit: number;
  status: string;
  current_question_index: number;
  questions_json?: {
    questions: Question[];
  };
  score: number;
  total_questions: number;
  started_at: string;
}

interface QuizResults {
  session_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken: number;
  qv_coins_earned: number;
  questions_breakdown: Array<{
    question: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    time_taken: number;
  }>;
  difficulty: string;
  topic_name: string;
  completed_at: string;
}

const QuizSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && session?.status === 'active' && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && session?.status === 'active' && !showResults) {
      // Time's up - auto submit
      handleCompleteQuiz();
    }
  }, [timeLeft, session?.status, showResults]);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await apiClient.request(`/enhanced-quiz/session/${sessionId}`);
      if (response.error) {
        toast.error(response.error);
        navigate('/quiz');
        return;
      }
      
      const sessionData: QuizSession = response.data;
      setSession(sessionData);
      
      // Calculate time left
      const startTime = new Date(sessionData.started_at).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, sessionData.time_limit - elapsed);
      setTimeLeft(remaining);
      
      // If quiz is completed, show results
      if (sessionData.status === 'completed') {
        setShowResults(true);
      } else {
        setCurrentQuestionIndex(sessionData.current_question_index);
      }
      
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load quiz session');
      navigate('/quiz');
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    // Load selected answer for current question
    if (userAnswers[currentQuestionIndex]) {
      setSelectedAnswer(userAnswers[currentQuestionIndex]);
    } else {
      setSelectedAnswer('');
    }
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex, userAnswers]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !session) return;
    
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    
    try {
      const response = await apiClient.request('/enhanced-quiz/answer', {
        method: 'POST',
        body: JSON.stringify({
          session_id: session.session_id,
          question_index: currentQuestionIndex,
          user_answer: selectedAnswer,
          time_taken: timeTaken
        })
      });
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      // Save answer locally
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: selectedAnswer
      }));
      
      // Show feedback
      if (response.data.is_correct) {
        toast.success('Correct! 🎉');
      } else {
        toast.error(`Incorrect. The answer was: ${response.data.correct_answer}`);
      }
      
      // Auto advance after short delay
      setTimeout(() => {
        if (currentQuestionIndex < (session.questions_json?.questions.length || 0) - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          handleCompleteQuiz();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (session?.questions_json?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleCompleteQuiz = async () => {
    if (!session) return;
    
    setSubmitting(true);
    const totalTimeTaken = session.time_limit - timeLeft;
    
    try {
      const response = await apiClient.request('/enhanced-quiz/complete', {
        method: 'POST',
        body: JSON.stringify({
          session_id: session.session_id,
          total_time_taken: totalTimeTaken
        })
      });
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      setResults(response.data);
      setShowResults(true);
      toast.success('Quiz completed! 🎊');
      
    } catch (error) {
      console.error('Error completing quiz:', error);
      toast.error('Failed to complete quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return { message: "Outstanding! 🌟", color: "text-green-600" };
    if (percentage >= 80) return { message: "Excellent! 🎉", color: "text-green-600" };
    if (percentage >= 70) return { message: "Good job! 👏", color: "text-blue-600" };
    if (percentage >= 60) return { message: "Not bad! 👍", color: "text-yellow-600" };
    return { message: "Keep practicing! 💪", color: "text-red-600" };
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quiz session...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <H2 className="text-gray-900 mb-2">Quiz Session Not Found</H2>
            <p className="text-gray-600 mb-4">The quiz session could not be loaded.</p>
            <Button onClick={() => navigate('/quiz')}>
              Back to Quiz Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Results View
  if (showResults && results) {
    const performance = getPerformanceMessage(results.percentage);
    
    return (
      <Layout>
        <div className="container mx-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            <div className="text-center mb-8">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg mb-6">
                <Trophy className="h-16 w-16 text-white mx-auto mb-4" />
                <H1 className="text-white mb-2">Quiz Completed!</H1>
                <LargeText className="text-white opacity-90">{results.topic_name}</LargeText>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{results.score}</div>
                    <div className="text-sm text-gray-600">Correct Answers</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{results.percentage.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{results.qv_coins_earned}</div>
                    <div className="text-sm text-gray-600">QV Coins</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-1">{formatTime(results.time_taken)}</div>
                    <div className="text-sm text-gray-600">Time Taken</div>
                  </CardContent>
                </Card>
              </div>

              <div className={`text-2xl font-bold mb-4 ${performance.color}`}>
                {performance.message}
              </div>
            </div>

            {/* Question Breakdown */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Question Breakdown</CardTitle>
                <CardDescription>Review your answers and see the correct solutions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.questions_breakdown.map((q, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-1 rounded-full ${q.is_correct ? 'bg-green-100' : 'bg-red-100'}`}>
                          {q.is_correct ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">Question {index + 1}</h4>
                          <p className="text-gray-700 mb-3">{q.question}</p>
                          
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">Your answer:</span>
                              <span className={`text-sm px-2 py-1 rounded ${
                                q.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {q.user_answer || 'No answer'}
                              </span>
                            </div>
                            {!q.is_correct && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">Correct answer:</span>
                                <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800">
                                  {q.correct_answer}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(q.time_taken)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => navigate('/quiz')}
                variant="outline"
                size="lg"
              >
                Back to Dashboard
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                size="lg"
              >
                <Brain className="w-4 h-4 mr-2" />
                Take Another Quiz
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Quiz Taking View
  const questions = session.questions_json?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!currentQuestion) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <H2 className="text-gray-900 mb-2">No Questions Available</H2>
            <p className="text-gray-600 mb-4">There was an issue loading the quiz questions.</p>
            <Button onClick={() => navigate('/quiz')}>
              Back to Quiz Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Quiz Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <H2 className="text-gray-900">{session.topic_name}</H2>
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(session.difficulty)}>
                      {session.difficulty}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-lg font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                  <Timer className="w-4 h-4 inline mr-1" />
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-600">Time remaining</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAnswer === option
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedAnswer === option
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === option && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                        )}
                      </div>
                      <span className="text-gray-900">{option}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex gap-2">
              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleCompleteQuiz}
                  disabled={submitting}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {submitting ? 'Finishing...' : 'Complete Quiz'}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || submitting}
                  size="lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              )}
            </div>
          </div>

          {/* Question Overview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Question Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer ${
                      index === currentQuestionIndex
                        ? 'bg-purple-600 text-white'
                        : userAnswers[index]
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default QuizSession;