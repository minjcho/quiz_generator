'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { validateAuthInput } from '@/lib/utils';

// Supabase Auth 에러 코드 매핑
function getAuthErrorMessage(error: AuthError): string {
  // status 기반 에러 처리 (더 안정적)
  if (error.status === 400) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (error.status === 422) {
    return '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
  }
  if (error.status === 429) {
    return '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.';
  }
  return '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
}

function getSignUpErrorMessage(error: AuthError): string {
  if (error.status === 422) {
    return '이미 등록된 이메일입니다.';
  }
  if (error.status === 429) {
    return '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.';
  }
  return '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // 초기 세션 확인
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Auth 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Google 로그인 오류:', error.message);
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const validationError = validateAuthInput(email, password, false);
    if (validationError) {
      throw new Error(validationError);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('이메일 로그인 오류:', error.message);
      }
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const validationError = validateAuthInput(email, password, true);
    if (validationError) {
      throw new Error(validationError);
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('회원가입 오류:', error.message);
      }
      throw new Error(getSignUpErrorMessage(error));
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('로그아웃 오류:', error.message);
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
