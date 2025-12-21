'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { documentApi, quizApi, Difficulty } from '@/lib/api';
import { Document } from '@/types/document';
import { Brain, Loader2, FileText, Sparkles } from 'lucide-react';

export default function GenerateQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentIdParam = searchParams.get('document_id');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(documentIdParam || '');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const data = await documentApi.getAll();
      setDocuments(data);
      if (documentIdParam && data.some((d) => d.id === documentIdParam)) {
        setSelectedDocumentId(documentIdParam);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '문서를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [documentIdParam]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleGenerate = async () => {
    if (!selectedDocumentId) {
      setError('문서를 선택해주세요.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const result = await quizApi.generate({
        document_id: selectedDocumentId,
        question_count: questionCount,
        difficulty,
      });

      router.push(`/quizzes/${result.quiz_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '퀴즈 생성에 실패했습니다.');
      setIsGenerating(false);
    }
  };

  const selectedDocument = documents.find((d) => d.id === selectedDocumentId);

  if (isLoading) {
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6" />
              퀴즈 생성
            </CardTitle>
            <CardDescription>
              AI가 학습 자료를 분석하여 퀴즈를 자동으로 생성합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 문서 선택 */}
            <div className="space-y-2">
              <Label>학습 자료 선택</Label>
              {documents.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-md text-center">
                  <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">등록된 자료가 없습니다.</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => router.push('/documents/new')}
                  >
                    자료 등록하러 가기
                  </Button>
                </div>
              ) : (
                <Select
                  value={selectedDocumentId}
                  onValueChange={setSelectedDocumentId}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="자료를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 선택된 문서 미리보기 */}
            {selectedDocument && (
              <div className="p-4 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-900 mb-1">{selectedDocument.title}</h4>
                <p className="text-sm text-blue-700 line-clamp-3">
                  {selectedDocument.content_text.slice(0, 300)}
                  {selectedDocument.content_text.length > 300 && '...'}
                </p>
              </div>
            )}

            {/* 문항 수 */}
            <div className="space-y-2">
              <Label>문항 수</Label>
              <Select
                value={questionCount.toString()}
                onValueChange={(value) => setQuestionCount(parseInt(value))}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 10, 15, 20].map((count) => (
                    <SelectItem key={count} value={count.toString()}>
                      {count}문항
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 난이도 */}
            <div className="space-y-2">
              <Label>난이도</Label>
              <Select
                value={difficulty}
                onValueChange={(value: Difficulty) => setDifficulty(value)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">쉬움 - 기본 개념 위주</SelectItem>
                  <SelectItem value="medium">보통 - 이해력 테스트</SelectItem>
                  <SelectItem value="hard">어려움 - 응용 및 추론</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 생성 버튼 */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isGenerating}
              >
                취소
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || documents.length === 0 || !selectedDocumentId}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI가 퀴즈를 생성하고 있습니다...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    퀴즈 생성하기
                  </>
                )}
              </Button>
            </div>

            {isGenerating && (
              <div className="text-center text-sm text-gray-500">
                퀴즈 생성에는 약 10-30초가 소요될 수 있습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
