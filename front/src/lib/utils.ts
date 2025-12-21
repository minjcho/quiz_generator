import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Auth validation utilities
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_EMAIL_LENGTH = 320; // RFC 5321

export function validateEmail(email: string): string | null {
  const trimmed = email?.trim();
  if (!trimmed) {
    return '이메일을 입력해주세요.';
  }
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return '이메일이 너무 깁니다.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  return null;
}

export function validatePassword(password: string, isSignUp = false): string | null {
  if (!password) {
    return '비밀번호를 입력해주세요.';
  }
  if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
    return `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`;
  }
  return null;
}

export function validateAuthInput(email: string, password: string, isSignUp = false): string | null {
  return validateEmail(email) || validatePassword(password, isSignUp);
}
