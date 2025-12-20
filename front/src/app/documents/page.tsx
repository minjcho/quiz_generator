'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { documentApi } from '@/lib/api';
import { Document } from '@/types/document';
import { Plus, FileText, Link as LinkIcon, File, Trash2, Brain, Loader2 } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentApi.getAll();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setDeletingId(id);
    try {
      await documentApi.delete(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'url':
        return <LinkIcon className="w-4 h-4" />;
      case 'pdf':
        return <File className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'url':
        return 'URL';
      case 'pdf':
        return 'PDF';
      default:
        return '텍스트';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
            <h1 className="text-2xl font-bold text-gray-900">내 자료</h1>
            <p className="text-gray-600 mt-1">
              등록된 학습 자료를 관리하고 퀴즈를 생성하세요.
            </p>
          </div>
          <Button asChild>
            <Link href="/documents/new">
              <Plus className="w-4 h-4 mr-2" />
              새 자료 등록
            </Link>
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 mb-6">
            {error}
          </div>
        )}

        {/* Document List */}
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 자료가 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                학습 자료를 등록하고 AI 퀴즈를 생성해보세요.
              </p>
              <Button asChild>
                <Link href="/documents/new">
                  <Plus className="w-4 h-4 mr-2" />
                  첫 자료 등록하기
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatDate(doc.created_at)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getSourceIcon(doc.source_type)}
                      {getSourceLabel(doc.source_type)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {doc.content_text.slice(0, 200)}
                    {doc.content_text.length > 200 && '...'}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href={`/quizzes/generate?document_id=${doc.id}`}>
                        <Brain className="w-4 h-4 mr-2" />
                        퀴즈 생성
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === doc.id ? (
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
