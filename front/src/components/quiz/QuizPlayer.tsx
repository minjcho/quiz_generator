'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Question, QuizAnswer } from '@/types/quiz';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

interface QuizPlayerProps {
  title: string;
  questions: Question[];
  onSubmit: (answers: QuizAnswer[]) => void;
}

export function QuizPlayer({ title, questions, onSubmit }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>(
    questions.map((q) => ({ questionId: q.id, selectedIndex: null }))
  );

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = answers.filter((a) => a.selectedIndex !== null).length;
  const allAnswered = answeredCount === questions.length;

  const handleSelect = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = {
      ...newAnswers[currentIndex],
      selectedIndex: parseInt(value),
    };
    setAnswers(newAnswers);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            문제 {currentIndex + 1} / {questions.length}
          </span>
          <span>{answeredCount}개 답변 완료</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Q{currentIndex + 1}</Badge>
          </div>
          <CardTitle className="text-lg leading-relaxed mt-2">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentIndex].selectedIndex?.toString() ?? ''}
            onValueChange={handleSelect}
            className="space-y-3"
          >
            {currentQuestion.choices.map((choice, index) => (
              <label
                key={index}
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  answers[currentIndex].selectedIndex === index
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value={index.toString()} />
                <span className="flex-1">{choice}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={!allAnswered}>
              <Send className="w-4 h-4 mr-1" />
              제출하기
            </Button>
          ) : (
            <Button onClick={goToNext}>
              다음
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              currentIndex === index
                ? 'bg-primary text-primary-foreground'
                : answers[index].selectedIndex !== null
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
