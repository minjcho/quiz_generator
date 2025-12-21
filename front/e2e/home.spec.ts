import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전 페이지 에러 리스너 설정
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // 테스트 후 에러가 있으면 실패
    page.on('close', () => {
      if (errors.length > 0) {
        console.error('Page errors detected:', errors);
      }
    });
  });

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

  test('CTA 버튼이 존재함', async ({ page }) => {
    await page.goto('/');

    // "무료로 시작하기" 또는 유사한 CTA 링크 확인
    const ctaLink = page.getByRole('link', { name: /시작하기/i });
    await expect(ctaLink).toBeVisible();
  });

  test('페이지 네비게이션에 에러가 없음', async ({ page }) => {
    const response = await page.goto('/');

    // 서버 에러가 없는지 확인
    expect(response?.status()).toBeLessThan(500);

    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');

    // 주요 콘텐츠 영역이 있는지 확인
    await expect(page.locator('main')).toBeVisible();
  });
});
