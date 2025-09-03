import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button as DSButton,
  Badge as DSBadge
} from '../components/ui/design-system';
import { 
  Brain, 
  Trophy, 
  Clock, 
  Star, 
  TrendingUp,
  PlayCircle,
  BarChart3,
  Target,
  Zap,
  Medal,
  BookOpen,
  RefreshCw,
  Timer,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface UserDetails {
  username: string;
  level: number;
  streak: number;
  total_qv_coins: number;
  master_topics: string[];
  sub_topics: string[];
  specific_topics: string[];
  quiz_stats: {
    total_quizzes: number;
    total_questions_attempted: number;
    total_questions_correct: number;
    overall_accuracy: number;
    total_qv_coins: number;
    current_streak: number;
    favorite_topics: string[];
    recent_performance: Array<{
      topic: string;
      score: number;
      total: number;
      percentage: number;
      date: string;
    }>;
  };
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
  score: number;
  total_questions: number;
  started_at: string;
}

const EnhancedQuiz: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [recentSessions, setRecentSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingQuiz, setStartingQuiz] = useState(false);

  // Quiz configuration
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(600);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  useEffect(() => {
    fetchUserDetails();
    fetchRecentSessions();
    
    // Check for topic parameter from URL
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      setTopic(topicParam);
    }
  }, [searchParams]);

  const fetchUserDetails = async () => {
    try {
      const response = await apiClient.request('/enhanced-quiz/user-details');
      if (response.error) {
        toast.error(response.error);
      } else {
        setUserDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to fetch user details');
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const response = await apiClient.request('/enhanced-quiz/my-sessions');
      if (response.error) {
        console.error('Error fetching sessions:', response.error);
      } else {
        setRecentSessions(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic for the quiz');
      return;
    }

    setStartingQuiz(true);
    try {
      const response = await apiClient.request('/enhanced-quiz/start', {
        method: 'POST',
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          num_questions: numQuestions,
          course_id: selectedCourseId,
          time_limit: timeLimit
        })
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Quiz started! Redirecting...');
        navigate(`/quiz/session/${response.data.session_id}`);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz');
    } finally {
      setStartingQuiz(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800"><Timer className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'abandoned':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Abandoned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  if (loading || !userDetails) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quiz dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-600 rounded-2xl shadow-lg">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <div>
                <H1 className="text-gray-900 dark:text-white mb-2">
                  Enhanced Quiz System
                </H1>
                <LargeText className="text-gray-600 dark:text-gray-400">
                  AI-powered quizzes with intelligent topic tracking
                </LargeText>
              </div>
            </div>

            {/* User Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Star className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{userDetails.level}</div>
                      <div className="text-sm text-gray-600">Current Level</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Zap className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{userDetails.streak}</div>
                      <div className="text-sm text-gray-600">Day Streak</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {userDetails.quiz_stats.overall_accuracy.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Medal className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{userDetails.total_qv_coins}</div>
                      <div className="text-sm text-gray-600">QV Coins</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="start" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="start">Start Quiz</TabsTrigger>
              <TabsTrigger value="recent">Recent Quizzes</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="start" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quiz Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-blue-600" />
                      Start New Quiz
                    </CardTitle>
                    <CardDescription>
                      Configure your AI-generated quiz
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="topic">Topic *</Label>
                      <Input
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., JavaScript, Physics, History..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="numQuestions">Questions</Label>
                        <Select value={numQuestions.toString()} onValueChange={(v) => setNumQuestions(parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 Questions</SelectItem>
                            <SelectItem value="10">10 Questions</SelectItem>
                            <SelectItem value="15">15 Questions</SelectItem>
                            <SelectItem value="20">20 Questions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                      <Select value={(timeLimit / 60).toString()} onValueChange={(v) => setTimeLimit(parseInt(v) * 60)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Minutes</SelectItem>
                          <SelectItem value="10">10 Minutes</SelectItem>
                          <SelectItem value="15">15 Minutes</SelectItem>
                          <SelectItem value="20">20 Minutes</SelectItem>
                          <SelectItem value="30">30 Minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleStartQuiz} 
                      disabled={startingQuiz || !topic.trim()}
                      className="w-full"
                      size="lg"
                    >
                      {startingQuiz ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating Questions...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Start Quiz
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Favorite Topics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      Your Favorite Topics
                    </CardTitle>
                    <CardDescription>
                      Based on your quiz history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userDetails.quiz_stats.favorite_topics.length > 0 ? (
                      <div className="space-y-2">
                        {userDetails.quiz_stats.favorite_topics.map((topic, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                            onClick={() => setTopic(topic)}
                          >
                            <span className="font-medium">{topic}</span>
                            <Button variant="ghost" size="sm">
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Take some quizzes to see your favorite topics here!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Quiz Sessions</CardTitle>
                  <CardDescription>
                    Your latest quiz attempts and results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentSessions.length > 0 ? (
                    <div className="space-y-4">
                      {recentSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{session.topic_name}</h4>
                              {getStatusBadge(session.status)}
                              <Badge className={getDifficultyColor(session.difficulty)}>
                                {session.difficulty}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {session.score}/{session.total_questions} questions correct
                              {session.status === 'completed' && (
                                <span className="ml-2">
                                  ({((session.score / session.total_questions) * 100).toFixed(1)}%)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(session.started_at)}
                            </div>
                          </div>
                          {session.status === 'active' && (
                            <Button 
                              onClick={() => navigate(`/quiz/session/${session.session_id}`)}
                              size="sm"
                            >
                              Continue
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No recent quizzes</h3>
                      <p className="text-gray-600 mb-4">Start your first AI-powered quiz!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overall Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Overall Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{userDetails.quiz_stats.total_quizzes}</div>
                        <div className="text-sm text-gray-600">Total Quizzes</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{userDetails.quiz_stats.total_questions_attempted}</div>
                        <div className="text-sm text-gray-600">Questions</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{userDetails.quiz_stats.current_streak}</div>
                        <div className="text-sm text-gray-600">Current Streak</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{userDetails.total_qv_coins}</div>
                        <div className="text-sm text-gray-600">QV Coins</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Recent Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetails.quiz_stats.recent_performance.length > 0 ? (
                      <div className="space-y-3">
                        {userDetails.quiz_stats.recent_performance.slice(0, 5).map((perf, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium text-sm">{perf.topic}</div>
                              <div className="text-xs text-gray-600">{perf.score}/{perf.total}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-sm ${perf.percentage >= 70 ? 'text-green-600' : perf.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {perf.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Complete some quizzes to see your performance here!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Global Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Top performers across all topics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Leaderboard coming soon!</p>
                    <p className="text-sm mt-2">Compete with other learners and see where you rank.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default EnhancedQuiz;