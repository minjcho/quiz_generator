import { test, expect } from '@playwright/test';

test.describe('퀴즈 관리 (인증됨)', () => {
  test('대시보드에서 퀴즈 목록으로 이동', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 내 퀴즈 카드의 링크 확인 (실제 텍스트: "퀴즈 목록 보기")
    const quizzesLink = page.getByRole('link', { name: /퀴즈 목록 보기/i });
    await expect(quizzesLink).toBeVisible({ timeout: 5000 });
    await quizzesLink.click();
    await expect(page).toHaveURL(/\/quizzes/);
  });

  test('퀴즈 목록 페이지 레이아웃', async ({ page }) => {
    await page.goto('/quizzes');
    await page.waitForLoadState('networkidle');

    // 서버 에러 없음 확인
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('대시보드 통계 카드 표시', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 학습 현황 섹션 확인
    await expect(page.getByText('학습 현황', { exact: true })).toBeVisible({ timeout: 10000 });

    // 통계 항목 확인 (exact match로 중복 방지)
    await expect(page.getByText('등록된 자료', { exact: true })).toBeVisible();
    await expect(page.getByText('생성된 퀴즈', { exact: true })).toBeVisible();
  });

  test('새 자료 등록 링크 동작', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 자료 등록하기 버튼 확인
    const newDocButton = page.getByRole('link', { name: /자료 등록하기/i });
    await expect(newDocButton).toBeVisible({ timeout: 5000 });
    await newDocButton.click();
    await expect(page).toHaveURL(/\/documents\/new/);
  });
});
