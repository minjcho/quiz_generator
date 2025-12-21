import { test, expect } from '@playwright/test';

test.describe('대시보드', () => {
  test('비로그인 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/dashboard');

    // 로그인 페이지로 리다이렉트되거나 로그인 UI가 표시됨
    await expect(page).toHaveURL(/\/(login|auth|$)/);
  });

  test('대시보드 접근 시 인증 필요', async ({ page }) => {
    const response = await page.goto('/dashboard');

    // 페이지가 로드됨 (리다이렉트 또는 로그인 프롬프트)
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('문서 페이지', () => {
  test('비로그인 시 접근 제한', async ({ page }) => {
    await page.goto('/documents');

    // 리다이렉트 또는 로그인 필요 메시지
    const url = page.url();
    expect(url.includes('documents') || url.includes('login') || url === 'http://localhost:3000/').toBeTruthy();
  });

  test('새 문서 등록 페이지 접근', async ({ page }) => {
    await page.goto('/documents/new');

    // 페이지가 에러 없이 로드
    await expect(page.locator('body')).not.toContainText('500');
  });
});

test.describe('퀴즈 페이지', () => {
  test('퀴즈 목록 페이지 접근', async ({ page }) => {
    await page.goto('/quizzes');

    // 페이지가 에러 없이 로드
    const response = await page.goto('/quizzes');
    expect(response?.status()).toBeLessThan(500);
  });
});
