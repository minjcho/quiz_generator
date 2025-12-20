'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { quizApi, Quiz, Difficulty } from '@/lib/api';
import { Plus, BookOpen, Trash2, Loader2, Play } from 'lucide-react';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await quizApi.getAll();
      setQuizzes(data.quizzes);
    } catch (err) {
      setError(err instanceof Error ? err.message : '퀴즈를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setDeletingId(id);
    try {
      await quizApi.delete(id);
      setQuizzes((prev) => prev.filter((quiz) => quiz.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">쉬움</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">보통</Badge>;
      case 'hard':
        return <Badge variant="secondary" className="bg-red-100 text-red-700">어려움</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">내 퀴즈</h1>
            <p className="text-gray-600 mt-1">
              생성된 퀴즈를 풀고 학습 현황을 확인하세요.
            </p>
          </div>
          <Button asChild>
            <Link href="/quizzes/generate">
              <Plus className="w-4 h-4 mr-2" />
              새 퀴즈 생성
            </Link>
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 mb-6">
            {error}
          </div>
        )}

        {/* Quiz List */}
        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                생성된 퀴즈가 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                학습 자료에서 AI 퀴즈를 생성해보세요.
              </p>
              <Button asChild>
                <Link href="/quizzes/generate">
                  <Plus className="w-4 h-4 mr-2" />
                  첫 퀴즈 생성하기
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {quiz.document_title && (
                          <span className="text-blue-600">{quiz.document_title}</span>
                        )}
                        {quiz.document_title && ' · '}
                        {formatDate(quiz.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(quiz.difficulty)}
                      <Badge variant="outline">{quiz.question_count}문항</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href={`/quizzes/${quiz.id}`}>
                        <Play className="w-4 h-4 mr-2" />
                        퀴즈 풀기
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(quiz.id)}
                      disabled={deletingId === quiz.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === quiz.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
