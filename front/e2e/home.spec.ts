import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
  test('랜딩 페이지가 정상적으로 로드됨', async ({ page }) => {
    await page.goto('/');

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/Quiz Generator/);

    // 메인 헤딩 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('로그인 버튼이 존재함', async ({ page }) => {
    await page.goto('/');

    // 로그인 관련 링크 확인 (Button asChild로 Link를 감싸므로 role='link')
    const loginLink = page.getByRole('link', { name: /로그인/i });
    await expect(loginLink).toBeVisible();
  });

  test('네비게이션이 정상 동작함', async ({ page }) => {
    await page.goto('/');

    // 페이지가 에러 없이 로드되는지 확인
    await expect(page.locator('body')).not.toContainText('Error');
    await expect(page.locator('body')).not.toContainText('404');
  });
});
