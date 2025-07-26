import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useFlashcards } from '@/hooks/useFlashcards'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  BookOpen,
  Brain,
  Target,
  TrendingUp,
  Clock,
  Star,
  Shuffle,
  BarChart3,
  Play,
  BookmarkPlus,
  Eye,
  EyeOff,
  ExternalLink,
  Link
} from 'lucide-react'

interface FlashCard {
  id: number
  front: string
  back: string
  difficulty: "Easy" | "Medium" | "Hard"
  subject: string
  mastered: boolean
  lastReviewed?: string
}

const Flashcards = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set())

  // Sample flashcard data - in real implementation, this would come from API
  const flashcards: FlashCard[] = [
    {
      id: 1,
      front: "What is supervised learning?",
      back: "A type of machine learning where algorithms learn from labeled training data to make predictions or decisions on new, unseen data.",
      difficulty: "Easy",
      subject: "Machine Learning",
      mastered: false,
      lastReviewed: "2 days ago"
    },
    {
      id: 2,
      front: "Define overfitting in machine learning",
      back: "Overfitting occurs when a model learns the training data too well, including noise and random fluctuations, resulting in poor performance on new data.",
      difficulty: "Medium",
      subject: "Machine Learning",
      mastered: false,
      lastReviewed: "1 day ago"
    },
    {
      id: 3,
      front: "What is the purpose of backpropagation?",
      back: "Backpropagation is an algorithm used to train neural networks by calculating gradients and updating weights to minimize the error between predicted and actual outputs.",
      difficulty: "Hard",
      subject: "Neural Networks",
      mastered: false,
      lastReviewed: "3 days ago"
    },
    {
      id: 4,
      front: "What is the difference between classification and regression?",
      back: "Classification predicts discrete categories or classes, while regression predicts continuous numerical values.",
      difficulty: "Easy",
      subject: "Machine Learning",
      mastered: true,
      lastReviewed: "1 day ago"
    },
    {
      id: 5,
      front: "Explain gradient descent",
      back: "An optimization algorithm that iteratively adjusts model parameters in the direction of steepest descent to minimize a cost function.",
      difficulty: "Medium",
      subject: "Optimization",
      mastered: false,
      lastReviewed: "4 days ago"
    }
  ]

  const currentCard = flashcards[currentCardIndex]
  const progress = ((currentCardIndex + 1) / flashcards.length) * 100
  const masteredCount = flashcards.filter(card => masteredCards.has(card.id) || card.mastered).length

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setShowAnswer(false)
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setShowAnswer(false)
    }
  }

  const flipCard = () => {
    setShowAnswer(!showAnswer)
  }

  const markAsMastered = () => {
    setMasteredCards(prev => new Set(prev).add(currentCard.id))
  }

  const shuffleCards = () => {
    // In real implementation, this would shuffle the array
    setCurrentCardIndex(0)
    setShowAnswer(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "Medium": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      case "Hard": return "bg-red-500/10 text-red-600 dark:text-red-400"
      default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          AI-Generated Flashcards
        </h1>
          <p className="text-muted-foreground">
          Review key concepts from your lectures
        </p>
        </div>

      {/* Link Card */}
      <div className="mb-8">
        <Card className="bg-card border-border hover:shadow-md transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Link className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Related Resources
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Access additional learning materials and practice exercises
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-accent hover:text-accent-foreground"
                  onClick={() => window.open('https://www.khanacademy.org/computing/computer-science/ai', '_blank')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  AI Course
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-accent hover:text-accent-foreground"
                  onClick={() => window.open('https://www.coursera.org/learn/machine-learning', '_blank')}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  ML Course
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-accent hover:text-accent-foreground"
                  onClick={() => window.open('https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', '_blank')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Video Tutorials
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{currentCardIndex + 1}</div>
            <p className="text-sm text-muted-foreground">Current Card</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{masteredCount}</div>
            <p className="text-sm text-muted-foreground">Mastered</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{flashcards.length}</div>
            <p className="text-sm text-muted-foreground">Total Cards</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
        <Button variant="outline" onClick={shuffleCards}>
          <Shuffle className="h-4 w-4 mr-2" />
          Shuffle
        </Button>
        <Button variant="outline">
          <Play className="h-4 w-4 mr-2" />
          Auto Play
        </Button>
        <Button variant="outline">
          <BookmarkPlus className="h-4 w-4 mr-2" />
          Save Progress
        </Button>
      </div>

      {/* Main Flashcard */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-4 sm:px-0">
          <Card
            className={`min-h-[300px] sm:min-h-[400px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 ${
              showAnswer ? 'border-primary' : 'border-border'
            }`}
            onClick={flipCard}
          >
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getDifficultyColor(currentCard.difficulty)}>
                    {currentCard.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {currentCard.subject}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {(masteredCards.has(currentCard.id) || currentCard.mastered) && (
                    <Badge variant="default" className="bg-green-500">
                      ✓ Mastered
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      flipCard()
                    }}
                  >
                    {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex items-center justify-center p-4 sm:p-8">
              <div className="text-center">
                {!showAnswer ? (
                  <>
                    <div className="text-lg font-medium mb-4">Question</div>
                    <p className="text-lg sm:text-xl leading-relaxed">
                      {currentCard.front}
                    </p>
                    <p className="text-sm text-muted-foreground mt-6">
                      Click to reveal answer
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-medium mb-4 text-blue-600">Answer</div>
                    <p className="text-lg sm:text-xl leading-relaxed">
                      {currentCard.back}
                    </p>
                    <p className="text-sm text-muted-foreground mt-6">
                      Click to show question again
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <Button
          variant="outline"
          onClick={prevCard}
          disabled={currentCardIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex flex-wrap gap-2">
          {showAnswer && (
            <>
              <Button
                variant="outline"
                onClick={markAsMastered}
                disabled={masteredCards.has(currentCard.id) || currentCard.mastered}
              >
                ✓ Mark as Mastered
              </Button>
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Review Again
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          onClick={nextCard}
          disabled={currentCardIndex === flashcards.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Review Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Study Session Summary</CardTitle>
          <CardDescription>
            Track your learning progress for this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {flashcards.filter(c => c.lastReviewed === "1 day ago").length}
              </div>
              <p className="text-sm text-muted-foreground">Reviewed Today</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {masteredCount}
              </div>
              <p className="text-sm text-muted-foreground">Mastered Cards</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {flashcards.filter(c => c.difficulty === "Medium").length}
              </div>
              <p className="text-sm text-muted-foreground">Need Practice</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {flashcards.filter(c => c.difficulty === "Hard").length}
              </div>
              <p className="text-sm text-muted-foreground">Challenging</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </Layout>
  )
}

export default Flashcards