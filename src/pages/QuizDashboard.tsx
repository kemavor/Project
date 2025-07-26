import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useQuizzes } from '@/hooks/useQuizzes'
import { CourseCardSkeleton, StatsCardSkeleton } from '@/components/EnhancedSkeleton'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import {
  Play,
  Clock,
  Trophy,
  Target,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Calendar,
  User,
  Star,
  Award,
  Brain,
  Zap,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  RotateCcw
} from 'lucide-react'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: "Easy" | "Medium" | "Hard"
  topic: string
  userAnswer?: number
}

interface Quiz {
  id: number
  title: string
  description: string
  questions: QuizQuestion[]
  timeLimit: number // in minutes
  difficulty: "Easy" | "Medium" | "Hard"
  subject: string
  status: "Available" | "In Progress" | "Completed"
  score?: number
  completedAt?: string
}

const QuizDashboard = () => {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: number }>({})
  const [showResults, setShowResults] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  // Sample quiz data
  const quizzes: Quiz[] = [
    {
      id: 1,
      title: "Statistical Analysis Fundamentals",
      description: "Test your understanding of basic statistical concepts",
      questions: [
        {
          id: 1,
          question: "What is the primary goal of statistical analysis?",
          options: [
            "To find hidden patterns in unlabeled data",
            "To analyze relationships between variables using data",
            "To reduce the dimensionality of data",
            "To cluster similar data points together"
          ],
          correctAnswer: 1,
          explanation: "Statistical analysis uses data to examine relationships between variables, enabling insights and informed decision-making.",
          difficulty: "Easy",
          topic: "Statistical Analysis"
        },
        {
          id: 2,
          question: "Which method is commonly used for hypothesis testing?",
          options: [
            "K-means clustering",
            "Linear regression",
            "T-test",
            "Principal Component Analysis"
          ],
          correctAnswer: 2,
          explanation: "T-test is specifically designed for comparing means between groups, using statistical methods to determine significance.",
          difficulty: "Medium",
          topic: "Hypothesis Testing"
        },
        {
          id: 3,
          question: "What happens when a study has low statistical power?",
          options: [
            "It detects effects well in both groups",
            "It fails to detect effects that actually exist",
            "It detects effects in one group but not another",
            "It performs poorly in all conditions"
          ],
          correctAnswer: 1,
          explanation: "Low statistical power occurs when a study lacks sufficient sample size or precision, resulting in failure to detect real effects.",
          difficulty: "Medium",
          topic: "Statistical Power"
        }
      ],
      timeLimit: 15,
      difficulty: "Medium",
      subject: "Statistics",
      status: "Available"
    },
    {
      id: 2,
      title: "Advanced Statistical Methods",
      description: "Advanced concepts in statistical modeling and analysis",
      questions: [],
      timeLimit: 30,
      difficulty: "Hard",
      subject: "Advanced Statistics",
      status: "Available"
    },
    {
      id: 3,
      title: "Research Methods Quiz",
      description: "Essential research design and methodology techniques",
      questions: [],
      timeLimit: 20,
      difficulty: "Easy",
      subject: "Research Methods",
      status: "Completed",
      score: 85,
      completedAt: "2 days ago"
    }
  ]

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResults(false)
    setTimeRemaining(quiz.timeLimit * 60) // Convert to seconds
  }

  const selectAnswer = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const nextQuestion = () => {
    if (selectedQuiz && currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const submitQuiz = () => {
    setShowResults(true)
  }

  const calculateScore = () => {
    if (!selectedQuiz) return 0
    const correctAnswers = selectedQuiz.questions.filter(
      q => answers[q.id] === q.correctAnswer
    ).length
    return Math.round((correctAnswers / selectedQuiz.questions.length) * 100)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 border-green-200"
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Hard": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentQuestion = selectedQuiz?.questions[currentQuestionIndex]

  if (showResults && selectedQuiz) {
    const score = calculateScore()
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {score >= 80 ? (
                <Trophy className="h-16 w-16 text-yellow-500" />
              ) : score >= 60 ? (
                <Target className="h-16 w-16 text-blue-500" />
              ) : (
                <AlertCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            <CardDescription>
              {selectedQuiz.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {score}%
              </div>
              <p className="text-muted-foreground">
                You got {selectedQuiz.questions.filter(q => answers[q.id] === q.correctAnswer).length} out of {selectedQuiz.questions.length} questions correct
              </p>
            </div>

            <Progress value={score} className="h-4" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-xl font-bold">
                  {selectedQuiz.questions.filter(q => answers[q.id] === q.correctAnswer).length}
                </div>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-xl font-bold">
                  {selectedQuiz.questions.filter(q => answers[q.id] !== q.correctAnswer).length}
                </div>
                <p className="text-sm text-muted-foreground">Incorrect</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-xl font-bold">
                  {selectedQuiz.timeLimit}m
                </div>
                <p className="text-sm text-muted-foreground">Time Limit</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review Answers</h3>
              {selectedQuiz.questions.map((question, index) => {
                const userAnswer = answers[question.id]
                const isCorrect = userAnswer === question.correctAnswer
                return (
                  <Card key={question.id} className={`border-l-4 ${
                    isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">Question {index + 1}</h4>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <p className="mb-3">{question.question}</p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Your answer:</span> {question.options[userAnswer] || "Not answered"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Correct answer:</span> {question.options[question.correctAnswer]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {question.explanation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={() => setSelectedQuiz(null)}>
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={() => {
                setShowResults(false)
                setCurrentQuestionIndex(0)
                setAnswers({})
              }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedQuiz && !showResults) {
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100

    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* Quiz Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{selectedQuiz.title}</h1>
            <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Time Remaining</div>
              <div className="text-xl font-mono">{formatTime(timeRemaining)}</div>
            </div>
            <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
              Exit Quiz
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        {currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                  {currentQuestion.difficulty}
                </Badge>
                <Badge variant="outline">{currentQuestion.topic}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  {currentQuestion.question}
                </h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={`${currentQuestion.id}-option-${index}`}
                      onClick={() => selectAnswer(currentQuestion.id, index)}
                      className={`w-full p-4 text-left border rounded-lg transition-colors hover:bg-gray-50 ${
                        answers[currentQuestion.id] === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          answers[currentQuestion.id] === index
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300'
                        }`}>
                          {answers[currentQuestion.id] === index && '✓'}
                        </div>
                        <span>{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>

                <div className="space-x-2">
                  {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
                    <Button
                      onClick={submitQuiz}
                      disabled={Object.keys(answers).length !== selectedQuiz.questions.length}
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <Button
                      onClick={nextQuestion}
                      disabled={!answers[currentQuestion.id]}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quiz Dashboard
        </h1>
        <p className="text-gray-600">
          Test your knowledge with comprehensive quizzes
        </p>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList>
          <TabsTrigger value="available">Available Quizzes</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.filter(q => q.status === "Available").map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {quiz.difficulty}
                    </Badge>
                    <Badge variant="outline">{quiz.subject}</Badge>
                  </div>
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <CardDescription>{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Brain className="h-4 w-4" />
                        <span>{quiz.questions.length} questions</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{quiz.timeLimit} min</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => startQuiz(quiz)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.filter(q => q.status === "Completed").map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {quiz.difficulty}
                    </Badge>
                    <Badge variant="default">{quiz.score}%</Badge>
                  </div>
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <CardDescription>
                    Completed {quiz.completedAt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={quiz.score} />
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Review
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Retake
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold">85%</div>
                    <p className="text-sm text-muted-foreground">Avg Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">18m</div>
                    <p className="text-sm text-muted-foreground">Avg Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Brain className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">7</div>
                    <p className="text-sm text-muted-foreground">Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Machine Learning", "Deep Learning", "Data Science"].map((subject) => (
                  <div key={subject} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{subject}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.floor(Math.random() * 20) + 80}%
                      </span>
                    </div>
                    <Progress value={Math.floor(Math.random() * 20) + 80} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </Layout>
  )
}

export default QuizDashboard