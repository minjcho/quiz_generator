'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { quizApi, Quiz, QuizQuestion, QuizSubmitResponse, QuestionResult, Difficulty } from '@/lib/api';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  Home,
} from 'lucide-react';

type ViewMode = 'quiz' | 'result';

export default function QuizPlayPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [viewMode, setViewMode] = useState<ViewMode>('quiz');
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const data = await quizApi.getById(quizId);
      setQuiz(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '퀴즈를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, choiceIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz?.questions) return;

    const unanswered = quiz.questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      if (!confirm(`${unanswered.length}개의 문제가 답변되지 않았습니다. 제출하시겠습니까?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const submitResult = await quizApi.submit(quizId, answers);
      setResult(submitResult);
      setViewMode('result');
      setCurrentIndex(0);
    } catch (err) {
      alert(err instanceof Error ? err.message : '제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setViewMode('quiz');
    setCurrentIndex(0);
  };

  const getDifficultyLabel = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !quiz || !quiz.questions) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-red-600 mb-4">{error || '퀴즈를 찾을 수 없습니다.'}</p>
              <Button asChild>
                <Link href="/quizzes">퀴즈 목록으로</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  // Result view
  if (viewMode === 'result' && result) {
    const currentResult = result.results[currentIndex];
    const currentQ = questions[currentIndex];

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Result Header */}
          <Card className="mb-6">
            <CardContent className="py-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">퀴즈 결과</h2>
                <div className="text-5xl font-bold text-primary mb-2">
                  {result.percentage}%
                </div>
                <p className="text-gray-600">
                  {result.total}문제 중 {result.score}문제 정답
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Question Review */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  문제 {currentIndex + 1} / {questions.length}
                </CardTitle>
                {currentResult.correct ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    정답
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700">
                    <XCircle className="w-4 h-4 mr-1" />
                    오답
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg font-medium">{currentQ.question}</p>

              <div className="space-y-2">
                {currentQ.choices.map((choice, idx) => {
                  const isSelected = currentResult.selected_index === idx;
                  const isCorrect = currentResult.correct_index === idx;

                  let className = 'p-3 rounded-md border ';
                  if (isCorrect) {
                    className += 'bg-green-50 border-green-300 text-green-800';
                  } else if (isSelected && !isCorrect) {
                    className += 'bg-red-50 border-red-300 text-red-800';
                  } else {
                    className += 'bg-gray-50 border-gray-200';
                  }

                  return (
                    <div key={idx} className={className}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{idx + 1}.</span>
                        <span>{choice}</span>
                        {isCorrect && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                        {isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="p-4 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">해설</h4>
                <p className="text-blue-800">{currentResult.explanation}</p>
              </div>

              {/* Source Excerpt */}
              {currentResult.source_excerpt && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-700 mb-2">관련 내용</h4>
                  <p className="text-gray-600 text-sm">{currentResult.source_excerpt}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  이전
                </Button>

                <div className="flex gap-1">
                  {questions.map((_, idx) => {
                    const r = result.results[idx];
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-8 h-8 rounded-full text-sm font-medium ${
                          idx === currentIndex
                            ? 'ring-2 ring-primary ring-offset-2'
                            : ''
                        } ${
                          r.correct
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  disabled={currentIndex === questions.length - 1}
                >
                  다음
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={handleRetry}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  다시 풀기
                </Button>
                <Button asChild>
                  <Link href="/quizzes">
                    <Home className="w-4 h-4 mr-2" />
                    목록으로
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Quiz view
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">{quiz.title}</h1>
            <Badge variant="outline">{getDifficultyLabel(quiz.difficulty)}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span>|</span>
            <span>답변 완료: {answeredCount}개</span>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Q{currentIndex + 1}.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg">{currentQuestion.question}</p>

            <RadioGroup
              value={answers[currentQuestion.id]?.toString() || ''}
              onValueChange={(value) => handleAnswer(currentQuestion.id, parseInt(value))}
            >
              {currentQuestion.choices.map((choice, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-3 rounded-md border hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAnswer(currentQuestion.id, idx)}
                >
                  <RadioGroupItem value={idx.toString()} id={`choice-${idx}`} />
                  <Label htmlFor={`choice-${idx}`} className="flex-1 cursor-pointer">
                    {choice}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </Button>

              <div className="flex gap-1">
                {questions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      idx === currentIndex
                        ? 'bg-primary text-white'
                        : answers[q.id] !== undefined
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentIndex === questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      제출 중...
                    </>
                  ) : (
                    '제출하기'
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                >
                  다음
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
