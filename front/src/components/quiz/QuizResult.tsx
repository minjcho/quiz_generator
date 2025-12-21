'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Question, QuizAnswer } from '@/types/quiz';
import { CheckCircle, XCircle, Home, RotateCcw } from 'lucide-react';

interface QuizResultProps {
  title: string;
  questions: Question[];
  answers: QuizAnswer[];
  onRetry: () => void;
  onHome: () => void;
}

export function QuizResult({
  title,
  questions,
  answers,
  onRetry,
  onHome,
}: QuizResultProps) {
  const results = questions.map((question, index) => {
    const answer = answers[index];
    const isCorrect = answer.selectedIndex === question.correct_index;
    return {
      question,
      selectedIndex: answer.selectedIndex,
      isCorrect,
    };
  });

  const correctCount = results.filter((r) => r.isCorrect).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const wrongResults = results.filter((r) => !r.isCorrect);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Score Card */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${score * 2.83} 283`}
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
                className={score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500'}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{score}%</span>
            </div>
          </div>
          <p className="text-lg">
            {questions.length}문제 중 <span className="font-bold text-primary">{correctCount}개</span> 정답
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="w-4 h-4 mr-2" />
              다시 풀기
            </Button>
            <Button onClick={onHome}>
              <Home className="w-4 h-4 mr-2" />
              홈으로
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wrong Answers Review */}
      {wrongResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">오답 복습</h2>
          {wrongResults.map(({ question, selectedIndex }) => (
            <Card key={question.id} className="border-red-200">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">
                      Q{results.findIndex((r) => r.question.id === question.id) + 1}
                    </Badge>
                    <CardTitle className="text-base leading-relaxed">
                      {question.question}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {question.choices.map((choice, choiceIndex) => (
                    <div
                      key={choiceIndex}
                      className={`p-3 rounded-lg text-sm ${
                        choiceIndex === question.correct_index
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : choiceIndex === selectedIndex
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-muted'
                      }`}
                    >
                      <span className="font-medium mr-2">{choiceIndex + 1}.</span>
                      {choice}
                      {choiceIndex === question.correct_index && (
                        <CheckCircle className="w-4 h-4 inline ml-2" />
                      )}
                      {choiceIndex === selectedIndex && choiceIndex !== question.correct_index && (
                        <XCircle className="w-4 h-4 inline ml-2" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <p className="font-medium text-blue-900">해설</p>
                  <p className="text-sm text-blue-800">{question.explanation}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="font-medium text-gray-700">근거</p>
                  <p className="text-sm text-gray-600 italic">&ldquo;{question.source_excerpt}&rdquo;</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Correct */}
      {wrongResults.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-bold text-green-800">완벽합니다!</p>
            <p className="text-green-700">모든 문제를 맞혔습니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
