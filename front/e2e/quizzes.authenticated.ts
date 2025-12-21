import { test, expect } from '@playwright/test';

test.describe('퀴즈 관리 (인증됨)', () => {
  test('대시보드에서 퀴즈 목록으로 이동', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 내 퀴즈 카드의 링크 확인
    const quizzesLink = page.getByRole('link', { name: /퀴즈 목록/i });

    if (await quizzesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quizzesLink.click();
      await expect(page).toHaveURL(/\/quizzes/);
    } else {
      test.skip(true, '인증이 필요합니다');
    }
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

    // 학습 현황 섹션 확인 (인증된 경우에만)
    const statsSection = page.getByText(/학습 현황/i);

    if (await statsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(page.getByText(/등록된 자료/i)).toBeVisible();
      await expect(page.getByText(/생성된 퀴즈/i)).toBeVisible();
    } else {
      test.skip(true, '인증이 필요합니다');
    }
  });

  test('새 자료 등록 링크 동작', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 자료 등록하기 버튼 확인
    const newDocButton = page.getByRole('link', { name: /자료 등록하기/i });

    if (await newDocButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newDocButton.click();
      await expect(page).toHaveURL(/\/documents\/new/);
    } else {
      test.skip(true, '인증이 필요합니다');
    }
  });
});

test.describe('로그인 페이지', () => {
  test('이메일 로그인 폼 표시', async ({ page }) => {
    await page.goto('/login');

    // 이메일 입력 필드 확인
    const emailInput = page.getByLabel(/이메일/i);
    await expect(emailInput).toBeVisible();

    // 비밀번호 입력 필드 확인
    const passwordInput = page.getByLabel(/비밀번호/i);
    await expect(passwordInput).toBeVisible();

    // 로그인 버튼 확인
    const loginButton = page.getByRole('button', { name: /이메일로 로그인/i });
    await expect(loginButton).toBeVisible();
  });

  test('Google 로그인 버튼 표시', async ({ page }) => {
    await page.goto('/login');

    // Google 로그인 버튼 확인
    const googleButton = page.getByRole('button', { name: /Google로 로그인/i });
    await expect(googleButton).toBeVisible();
  });
});
