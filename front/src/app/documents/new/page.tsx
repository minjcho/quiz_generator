'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { documentApi } from '@/lib/api';
import { SourceType } from '@/types/document';
import { FileText, Link as LinkIcon, File, Loader2 } from 'lucide-react';

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('text');
  const [contentText, setContentText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (sourceType === 'text' && !contentText.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    if (sourceType === 'url' && !sourceUrl.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await documentApi.create({
        title: title.trim() || (sourceType === 'url' ? sourceUrl.trim() : ''),
        source_type: sourceType,
        content_text: sourceType === 'url' ? '' : contentText.trim(),
        source_url: sourceType === 'url' ? sourceUrl.trim() : undefined,
      });

      router.push('/documents');
    } catch (err) {
      setError(err instanceof Error ? err.message : '문서 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>새 자료 등록</CardTitle>
            <CardDescription>
              학습할 자료를 등록하면 AI가 퀴즈를 생성합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 제목 */}
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  placeholder="자료 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* 소스 타입 */}
              <div className="space-y-2">
                <Label>자료 유형</Label>
                <Select
                  value={sourceType}
                  onValueChange={(value: SourceType) => setSourceType(value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="자료 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        텍스트 직접 입력
                      </div>
                    </SelectItem>
                    <SelectItem value="url">
                      <div className="flex items-center">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        URL 입력
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf" disabled>
                      <div className="flex items-center">
                        <File className="w-4 h-4 mr-2" />
                        PDF 업로드 (준비중)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 텍스트 입력 */}
              {sourceType === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="content">내용</Label>
                  <Textarea
                    id="content"
                    placeholder="학습할 내용을 붙여넣기 하세요..."
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    disabled={isSubmitting}
                    className="min-h-[300px]"
                  />
                  <p className="text-sm text-gray-500">
                    {contentText.length.toLocaleString()}자 입력됨
                  </p>
                </div>
              )}

              {/* URL 입력 */}
              {sourceType === 'url' && (
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/article"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-gray-500">
                    웹 페이지의 내용을 자동으로 추출합니다.
                  </p>
                </div>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {sourceType === 'url' ? '웹 페이지 분석 중...' : '등록 중...'}
                    </>
                  ) : (
                    '자료 등록'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
