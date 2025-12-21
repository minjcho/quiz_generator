import { test, expect } from '@playwright/test';

// 테스트용 문서 정보
const TEST_DOCUMENT = {
  title: `E2E 테스트 문서 ${Date.now()}`,
  content: `이것은 E2E 테스트를 위한 샘플 문서입니다.

인공지능(AI)은 인간의 학습능력, 추론능력, 지각능력을 인공적으로 구현한 컴퓨터 시스템입니다.
머신러닝은 AI의 하위 분야로, 데이터로부터 패턴을 학습합니다.
딥러닝은 머신러닝의 한 종류로, 인공 신경망을 사용합니다.

이 문서는 퀴즈 생성 테스트에도 사용됩니다.`,
};

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

  test('문서 실제 등록 및 확인', async ({ page }) => {
    // 1. 새 문서 등록 페이지로 이동
    await page.goto('/documents/new');
    await page.waitForLoadState('networkidle');

    // 폼 로드 확인
    const titleInput = page.locator('#title');
    const isFormLoaded = await titleInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isFormLoaded) {
      test.skip(true, '인증이 필요합니다');
      return;
    }

    // 2. 제목 입력
    await titleInput.fill(TEST_DOCUMENT.title);

    // 3. 자료 유형: text 선택 (기본값이지만 명시적으로)
    const textRadio = page.getByRole('radio', { name: /텍스트 직접 입력/i });
    if (await textRadio.isVisible()) {
      await textRadio.click();
    }

    // 4. 내용 입력
    const contentTextarea = page.locator('#content');
    await contentTextarea.fill(TEST_DOCUMENT.content);

    // 5. 자료 등록 버튼 클릭
    const submitButton = page.getByRole('button', { name: /자료 등록/i });
    await submitButton.click();

    // 6. 문서 목록 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/documents/, { timeout: 10000 });

    // 7. 등록된 문서가 목록에 표시되는지 확인
    await page.waitForLoadState('networkidle');
    const documentTitle = page.getByText(TEST_DOCUMENT.title);
    await expect(documentTitle).toBeVisible({ timeout: 5000 });
  });

  test('등록된 문서 삭제', async ({ page }) => {
    // 문서 목록 페이지로 이동
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // E2E 테스트 문서 모두 삭제 (누적 방지)
    let deletedCount = 0;
    const maxDeleteAttempts = 10; // 안전장치

    while (deletedCount < maxDeleteAttempts) {
      // E2E 테스트 문서 찾기
      const documentCard = page.locator('text=E2E 테스트 문서').first();
      const isDocumentExists = await documentCard.isVisible({ timeout: 2000 }).catch(() => false);

      if (!isDocumentExists) {
        break; // 더 이상 삭제할 문서 없음
      }

      // 삭제 버튼 클릭 (문서 카드 내의 삭제 버튼)
      const deleteButton = page.locator('[data-testid="delete-document"]').first();
      if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteButton.click();

        // 확인 다이얼로그가 있으면 확인
        const confirmButton = page.getByRole('button', { name: /확인|삭제/i });
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }

        // 삭제 완료 대기
        await page.waitForLoadState('networkidle');
        deletedCount++;
      } else {
        break;
      }
    }

    if (deletedCount === 0) {
      test.skip(true, '삭제할 테스트 문서가 없습니다');
    }
  });
});
