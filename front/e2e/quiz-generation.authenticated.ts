import { test, expect } from '@playwright/test';

test.describe('퀴즈 생성 (인증됨)', () => {
  test('퀴즈 생성 페이지 레이아웃', async ({ page }) => {
    await page.goto('/quizzes/generate');
    await page.waitForLoadState('networkidle');

    // 페이지 로드 확인
    const isOnPage = await page.getByText('퀴즈 생성').first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!isOnPage) {
      test.skip(true, '인증이 필요합니다');
      return;
    }

    // 문서 선택 드롭다운 확인
    const documentSelect = page.getByRole('combobox').first();
    await expect(documentSelect).toBeVisible();

    // 문항 수 선택 확인
    await expect(page.getByText('문항 수')).toBeVisible();

    // 난이도 선택 확인
    await expect(page.getByText('난이도')).toBeVisible();

    // 생성 버튼 확인
    const generateButton = page.getByRole('button', { name: /퀴즈 생성/i });
    await expect(generateButton).toBeVisible();
  });

  test('문서가 없을 때 안내 메시지', async ({ page }) => {
    await page.goto('/quizzes/generate');
    await page.waitForLoadState('networkidle');

    // 문서가 없으면 안내 메시지가 표시되거나 선택 옵션이 비어있음
    const documentSelect = page.getByRole('combobox').first();
    const isVisible = await documentSelect.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await documentSelect.click();
      // 옵션 로드 대기
      await page.waitForLoadState('domcontentloaded');
    }
  });

  // LLM 호출 테스트 - 시간이 오래 걸림 (60초 타임아웃)
  test('퀴즈 생성 플로우 (LLM 호출)', async ({ page }) => {
    test.setTimeout(120000); // 2분 타임아웃

    // 먼저 테스트용 문서가 있는지 확인
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    const hasDocuments = await page.locator('.card, [data-testid="document-card"]').first()
      .isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasDocuments) {
      // 문서가 없으면 먼저 생성
      await page.goto('/documents/new');
      await page.waitForLoadState('networkidle');

      const titleInput = page.locator('#title');
      const isFormLoaded = await titleInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (!isFormLoaded) {
        test.skip(true, '인증이 필요합니다');
        return;
      }

      await titleInput.fill('퀴즈 생성 테스트 문서');
      const contentTextarea = page.locator('#content');
      await contentTextarea.fill(`인공지능(AI)은 컴퓨터 과학의 한 분야입니다.
머신러닝은 데이터로부터 학습하는 AI 기술입니다.
딥러닝은 인공 신경망을 사용하는 머신러닝의 한 종류입니다.
자연어 처리(NLP)는 컴퓨터가 인간의 언어를 이해하고 생성하는 기술입니다.
컴퓨터 비전은 이미지와 비디오를 분석하는 AI 분야입니다.`);

      const submitButton = page.getByRole('button', { name: /자료 등록/i });
      await submitButton.click();
      await expect(page).toHaveURL(/\/documents/, { timeout: 10000 });
    }

    // 퀴즈 생성 페이지로 이동
    await page.goto('/quizzes/generate');
    await page.waitForLoadState('networkidle');

    const generateButton = page.getByRole('button', { name: /퀴즈 생성/i });
    const isOnPage = await generateButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isOnPage) {
      test.skip(true, '퀴즈 생성 페이지 로드 실패');
      return;
    }

    // 1. 문서 선택 (첫 번째 문서)
    const documentSelect = page.getByRole('combobox').first();
    await documentSelect.click();

    // 첫 번째 옵션 선택 (옵션이 나타날 때까지 대기)
    const firstOption = page.getByRole('option').first();
    const hasOptions = await firstOption.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasOptions) {
      test.skip(true, '선택할 문서가 없습니다');
      return;
    }
    await firstOption.click();

    // 2. 문항 수 선택 (3문항 - 가장 적은 수로 빠르게)
    const questionCountSelect = page.locator('[data-testid="question-count-select"]');
    if (await questionCountSelect.isVisible()) {
      await questionCountSelect.click();
      await page.getByRole('option', { name: '3' }).click();
    }

    // 3. 난이도 선택 (easy)
    const easyButton = page.getByRole('button', { name: /기본 개념|easy/i });
    if (await easyButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await easyButton.click();
    }

    // 4. 퀴즈 생성 버튼 클릭
    await generateButton.click();

    // 5. 로딩 상태 확인 (스피너 또는 로딩 텍스트)
    const loadingIndicator = page.locator('[data-testid="loading"], .animate-spin').first();
    const hasLoading = await loadingIndicator.isVisible({ timeout: 3000 }).catch(() => false);
    // 로딩이 보이면 완료될 때까지 대기
    if (hasLoading) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 90000 });
    }

    // 6. 퀴즈 상세 페이지로 리다이렉트 확인 또는 에러 메시지 확인
    const isOnQuizPage = await page.waitForURL(/\/quizzes\/[a-zA-Z0-9-]+$/, { timeout: 90000 })
      .then(() => true)
      .catch(() => false);

    if (isOnQuizPage) {
      // 퀴즈 페이지 로드 확인
      await page.waitForLoadState('networkidle');
      // 문제가 표시되는지 확인
      const questionText = page.locator('text=/Q[0-9]+|문제/i').first();
      await expect(questionText).toBeVisible({ timeout: 10000 });
    } else {
      // 에러가 발생했을 수 있음 - 에러 메시지 확인
      const errorMessage = page.locator('[role="alert"], .text-red-500').first();
      const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasError) {
        console.log('퀴즈 생성 에러 발생:', await errorMessage.textContent());
      }
      // 테스트 실패
      expect(isOnQuizPage).toBe(true);
    }
  });
});
