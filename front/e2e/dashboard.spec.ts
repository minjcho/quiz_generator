import { test, expect, Page } from '@playwright/test';

// 공통 헬퍼: 인증되지 않은 사용자 리다이렉트 확인
async function expectUnauthenticatedRedirect(page: Page) {
  // 홈페이지 또는 로그인 페이지로 리다이렉트 확인
  await expect(page).toHaveURL(/^\/$|\/login|\/auth/);
}

test.describe('대시보드', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전 콘솔 에러 리스너 설정
    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
    });
  });

  test('비로그인 시 홈페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/dashboard');
    await expectUnauthenticatedRedirect(page);
  });

  test('대시보드 접근 시 서버 에러 없음', async ({ page }) => {
    const response = await page.goto('/dashboard');

    // 서버 에러(5xx)가 아닌지 확인
    expect(response?.status()).toBeLessThan(500);
    // 리다이렉트(3xx) 또는 성공(2xx) 응답 확인
    expect(response?.status()).toBeLessThanOrEqual(399);
  });
});

test.describe('문서 페이지', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
    });
  });

  test('비로그인 시 접근 제한', async ({ page }) => {
    await page.goto('/documents');
    await expectUnauthenticatedRedirect(page);
  });

  test('새 문서 등록 페이지 접근 시 서버 에러 없음', async ({ page }) => {
    const response = await page.goto('/documents/new');

    // 서버 에러가 아닌지 확인
    expect(response?.status()).toBeLessThan(500);

    // 페이지에 치명적 에러 텍스트가 없는지 확인
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });
});

test.describe('퀴즈 페이지', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
    });
  });

  test('퀴즈 목록 페이지 접근 시 서버 에러 없음', async ({ page }) => {
    const response = await page.goto('/quizzes');

    // 서버 에러가 아닌지 확인
    expect(response?.status()).toBeLessThan(500);

    // 리다이렉트되거나 페이지가 정상 로드됨
    const status = response?.status() ?? 0;
    expect(status >= 200 && status < 400).toBeTruthy();
  });
});
