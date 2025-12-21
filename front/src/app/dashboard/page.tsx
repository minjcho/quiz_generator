'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { documentApi, quizApi } from '@/lib/api';
import { FileText, BookOpen, Plus, TrendingUp, Loader2 } from 'lucide-react';

interface DashboardStats {
  documentCount: number;
  quizCount: number;
  averageScore: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    documentCount: 0,
    quizCount: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [documents, quizzesResponse] = await Promise.all([
          documentApi.getAll(),
          quizApi.getAll(),
        ]);

        setStats({
          documentCount: documents.length,
          quizCount: quizzesResponse.quizzes.length,
          averageScore: 0, // TODO: Calculate from attempts
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            안녕하세요, {user?.user_metadata?.full_name || '사용자'}님!
          </h1>
          <p className="text-gray-600 mt-1">
            오늘도 효과적인 학습을 시작해보세요.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2 text-primary" />
                새 자료 등록
              </CardTitle>
              <CardDescription>
                학습할 자료를 등록하고 퀴즈를 생성하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/documents/new">자료 등록하기</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                내 자료
              </CardTitle>
              <CardDescription>
                등록된 자료를 관리하고 퀴즈를 생성하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/documents">자료 목록 보기</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                내 퀴즈
              </CardTitle>
              <CardDescription>
                생성된 퀴즈를 풀고 학습 현황을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/quizzes">퀴즈 목록 보기</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              학습 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{stats.documentCount}</p>
                  <p className="text-sm text-gray-600">등록된 자료</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{stats.quizCount}</p>
                  <p className="text-sm text-gray-600">완료한 퀴즈</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{stats.averageScore}%</p>
                  <p className="text-sm text-gray-600">평균 정답률</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
