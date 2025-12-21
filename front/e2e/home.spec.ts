import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
  test('랜딩 페이지가 정상적으로 로드됨', async ({ page }) => {
    const response = await page.goto('/');

    // 200 OK 응답 확인
    expect(response?.status()).toBe(200);

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/Quiz Generator/);

    // 메인 헤딩 확인 (h1 또는 주요 헤딩)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('로그인 링크가 존재하고 클릭 가능함', async ({ page }) => {
    await page.goto('/');

    // 로그인 링크 확인
    const loginLink = page.getByRole('link', { name: /로그인/i });
    await expect(loginLink).toBeVisible();

    // 링크가 올바른 href를 가지는지 확인
    await expect(loginLink).toHaveAttribute('href', '/login');
  });

  test('CTA 링크 또는 대시보드 리다이렉트', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 로그인된 경우 대시보드로 리다이렉트되거나, 비로그인 시 로그인 링크 표시
    const url = page.url();

    if (url.includes('/dashboard')) {
      // 로그인된 상태 - 대시보드로 리다이렉트됨
      await expect(page).toHaveURL(/\/dashboard/);
    } else {
      // 비로그인 상태 - 로그인 링크 확인
      const loginLinks = page.locator('a[href="/login"]');
      const count = await loginLinks.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('페이지 로드 시 JavaScript 에러가 없음', async ({ page }) => {
    const pageErrors: string[] = [];

    // 페이지 에러 리스너 설정
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // JavaScript 에러가 없어야 함
    expect(pageErrors).toHaveLength(0);
  });

  test('페이지 네비게이션에 서버 에러가 없음', async ({ page }) => {
    const response = await page.goto('/');

    // 서버 에러가 없는지 확인
    expect(response?.status()).toBeLessThan(500);

    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');

    // 주요 콘텐츠 영역이 있는지 확인
    await expect(page.locator('main')).toBeVisible();
  });
});
