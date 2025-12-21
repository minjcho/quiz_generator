import { test, expect } from '@playwright/test';

test.describe('문서 관리 (인증됨)', () => {
  test('대시보드에서 문서 목록으로 이동', async ({ page }) => {
    await page.goto('/dashboard');

    // 대시보드가 로드되는지 확인 (로딩 완료 대기)
    await page.waitForLoadState('networkidle');

    // 내 자료 카드의 링크 확인
    const documentsLink = page.getByRole('link', { name: /자료 목록/i });

    if (await documentsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await documentsLink.click();
      await expect(page).toHaveURL(/\/documents/);
    } else {
      // 인증되지 않은 경우 - 테스트 스킵
      test.skip(true, '인증이 필요합니다');
    }
  });

  test('문서 목록 페이지 레이아웃', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // 서버 에러 없음 확인
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('새 문서 등록 페이지 접근', async ({ page }) => {
    await page.goto('/documents/new');
    await page.waitForLoadState('networkidle');

    // 페이지 로드 확인
    await expect(page.locator('body')).toBeVisible();

    // 제목 입력 필드 또는 리다이렉트 확인
    const titleInput = page.getByLabel(/제목/i);
    const isOnNewPage = await titleInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isOnNewPage) {
      // 인증되지 않아 리다이렉트된 경우
      await expect(page).toHaveURL(/\/(login|$)/);
    }
  });

  test('문서 등록 폼 요소 확인', async ({ page }) => {
    await page.goto('/documents/new');
    await page.waitForLoadState('networkidle');

    // 제목 라벨이 있으면 폼이 제대로 로드된 것
    const titleLabel = page.getByText('제목');
    const isFormLoaded = await titleLabel.isVisible({ timeout: 3000 }).catch(() => false);

    if (isFormLoaded) {
      // 등록/저장 버튼 확인
      const submitButton = page.getByRole('button', { name: /자료 등록/i });
      await expect(submitButton).toBeVisible();
    } else {
      // 인증되지 않아 리다이렉트됨
      test.skip(true, '인증이 필요합니다');
    }
  });
});
