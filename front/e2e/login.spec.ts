import { test, expect } from '@playwright/test';

test.describe('로그인 페이지', () => {
  test('이메일 로그인 폼 표시', async ({ page }) => {
    await page.goto('/login');

    // 이메일 입력 필드 확인
    const emailInput = page.getByTestId('email-input');
    await expect(emailInput).toBeVisible();

    // 비밀번호 입력 필드 확인
    const passwordInput = page.getByTestId('password-input');
    await expect(passwordInput).toBeVisible();

    // 로그인 버튼 확인
    const loginButton = page.getByTestId('email-login-button');
    await expect(loginButton).toBeVisible();
  });

  test('Google 로그인 버튼 표시', async ({ page }) => {
    await page.goto('/login');

    // Google 로그인 버튼 확인
    const googleButton = page.getByRole('button', { name: /Google로 로그인/i });
    await expect(googleButton).toBeVisible();
  });
});
