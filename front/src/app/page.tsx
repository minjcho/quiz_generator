'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, FileText, Brain, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">Quiz Generator</h1>
          <Button asChild>
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            자료 기반 퀴즈 생성 도구
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            학습 자료를 업로드하면 AI가 자동으로 퀴즈를 생성합니다.
            <br />
            효과적인 복습으로 학습 효율을 높이세요.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/login">무료로 시작하기</Link>
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">자료 등록</h3>
            <p className="text-gray-600 text-sm">
              텍스트, PDF, URL 등 다양한 형식의 학습 자료를 등록하세요
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">AI 퀴즈 생성</h3>
            <p className="text-gray-600 text-sm">
              GPT-4 기반 AI가 자료를 분석하여 퀴즈를 자동 생성합니다
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">퀴즈 풀이</h3>
            <p className="text-gray-600 text-sm">
              생성된 퀴즈를 풀고 즉시 채점 결과를 확인하세요
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold mb-2">오답 복습</h3>
            <p className="text-gray-600 text-sm">
              틀린 문제는 해설과 근거를 확인하며 복습하세요
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
          &copy; 2024 Quiz Generator. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
