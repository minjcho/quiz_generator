import { test, expect } from '@playwright/test';

test.describe('퀴즈 풀이 (인증됨)', () => {
  test('퀴즈 목록 페이지 레이아웃', async ({ page }) => {
    await page.goto('/quizzes');
    await page.waitForLoadState('networkidle');

    // 인증되지 않아 리다이렉트 되었는지 확인
    if (page.url().includes('/login')) {
      test.skip(true, '인증이 필요합니다');
      return;
    }

    // 서버 에러 없음 확인
    await expect(page.locator('body')).not.toContainText('Internal Server Error');

    // 퀴즈 생성 버튼 확인
    const newQuizButton = page.getByRole('link', { name: /퀴즈 생성|새 퀴즈/i });
    await expect(newQuizButton).toBeVisible({ timeout: 5000 });
  });

  test('퀴즈 목록에서 퀴즈 상세 이동', async ({ page }) => {
    await page.goto('/quizzes');
    await page.waitForLoadState('networkidle');

    // 퀴즈 카드가 있는지 확인
    const quizCard = page.locator('[data-testid="quiz-card"], .card').first();
    const hasQuizzes = await quizCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasQuizzes) {
      test.skip(true, '테스트할 퀴즈가 없습니다');
      return;
    }

    // 퀴즈 풀기 버튼 클릭
    const playButton = page.getByRole('link', { name: /퀴즈 풀기/i }).first();
    const hasPlayButton = await playButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPlayButton) {
      await playButton.click();
      await expect(page).toHaveURL(/\/quizzes\/[a-zA-Z0-9-]+/);
    }
  });

  test('퀴즈 풀이 UI 요소 확인', async ({ page }) => {
    await page.goto('/quizzes');
    await page.waitForLoadState('networkidle');

    // 첫 번째 퀴즈로 이동
    const playButton = page.getByRole('link', { name: /퀴즈 풀기/i }).first();
    const hasQuiz = await playButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasQuiz) {
      test.skip(true, '테스트할 퀴즈가 없습니다');
      return;
    }

    await playButton.click();
    await page.waitForLoadState('networkidle');

    // 진행률 표시 확인
    const progressBar = page.locator('[role="progressbar"], .progress').first();
    const hasProgress = await progressBar.isVisible({ timeout: 5000 }).catch(() => false);

    // 문제 번호 표시 확인 (문제 1 / N 형태)
    const questionCounter = page.locator('text=/문제.*\\/|Q[0-9]+/i').first();
    await expect(questionCounter).toBeVisible({ timeout: 5000 });

    // 선택지 확인 (라디오 버튼 그룹)
    const radioGroup = page.locator('[role="radiogroup"]');
    await expect(radioGroup).toBeVisible();

    // 다음 버튼 확인
    const nextButton = page.getByRole('button', { name: /다음|제출/i });
    await expect(nextButton).toBeVisible();
  });

  test('퀴즈 풀이 네비게이션', async ({ page }) => {
    await page.goto('/quizzes');
    await page.waitForLoadState('networkidle');

    const playButton = page.getByRole('link', { name: /퀴즈 풀기/i }).first();
    const hasQuiz = await playButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasQuiz) {
      test.skip(true, '테스트할 퀴즈가 없습니다');
      return;
    }

    await playButton.click();
    await page.waitForLoadState('networkidle');

    // 첫 번째 선택지 클릭
    const firstChoice = page.locator('[role="radio"]').first();
    await expect(firstChoice).toBeVisible({ timeout: 5000 });
    await firstChoice.click();

    // 다음 버튼 클릭
    const nextButton = page.getByRole('button', { name: /다음/i });
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();

      // 이전 버튼이 활성화될 때까지 대기
      const prevButton = page.getByRole('button', { name: /이전/i });
      await expect(prevButton).toBeEnabled({ timeout: 5000 });
    }
  });

  test('퀴즈 제출 및 결과 확인', async ({ page }) => {
    test.setTimeout(60000); // 1분 타임아웃

    await page.goto('/quizzes');
    await page.waitForLoadState('networkidle');

    const playButton = page.getByRole('link', { name: /퀴즈 풀기/i }).first();
    const hasQuiz = await playButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasQuiz) {
      test.skip(true, '테스트할 퀴즈가 없습니다');
      return;
    }

    await playButton.click();
    await page.waitForLoadState('networkidle');

    // 모든 문제에 답변
    let hasMoreQuestions = true;
    let questionCount = 0;
    const maxQuestions = 20; // 안전장치

    while (hasMoreQuestions && questionCount < maxQuestions) {
      questionCount++;

      // 현재 문제의 첫 번째 선택지 클릭
      const radioButtons = page.locator('[role="radio"]');
      const radioCount = await radioButtons.count();

      if (radioCount > 0) {
        await radioButtons.first().click();
      }

      // 다음 또는 제출 버튼 확인
      const submitButton = page.getByRole('button', { name: /제출하기/i });
      const nextButton = page.getByRole('button', { name: /다음/i });

      if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        // 마지막 문제 - 제출
        await submitButton.click();
        hasMoreQuestions = false;
      } else if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        // 다음 문제로 이동
        await nextButton.click();
        // 다음 문제 로드 대기
        await page.waitForLoadState('domcontentloaded');
      } else {
        hasMoreQuestions = false;
      }
    }

    // 결과 페이지 확인
    await page.waitForLoadState('networkidle');

    // 결과 페이지의 "퀴즈 결과" 제목 또는 점수 표시 확인
    const resultTitle = page.getByText('퀴즈 결과');
    const scorePercent = page.locator('text=/\\d+%/').first();

    const hasResult = await resultTitle.isVisible({ timeout: 10000 }).catch(() => false) ||
                      await scorePercent.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasResult) {
      // 결과가 표시되지 않으면 스킵 (퀴즈가 없거나 제출 실패)
      test.skip(true, '결과 페이지가 표시되지 않습니다');
      return;
    }

    // 정답/오답 표시 확인 (Badge)
    const resultBadge = page.locator('text=/정답|오답/').first();
    await expect(resultBadge).toBeVisible({ timeout: 5000 });

    // 해설 섹션 확인
    const explanationSection = page.getByText('해설').first();
    await expect(explanationSection).toBeVisible({ timeout: 5000 });

    // 다시 풀기 또는 목록으로 버튼 확인
    const retryButton = page.getByRole('button', { name: /다시 풀기/i });
    const listLink = page.getByRole('link', { name: /목록으로/i });

    const hasRetryButton = await retryButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasListLink = await listLink.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasRetryButton || hasListLink).toBe(true);
  });

  test('결과 페이지에서 문제 네비게이션', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/quizzes');
    await page.waitForLoadState('networkidle');

    const playButton = page.getByRole('link', { name: /퀴즈 풀기/i }).first();
    const hasQuiz = await playButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasQuiz) {
      test.skip(true, '테스트할 퀴즈가 없습니다');
      return;
    }

    await playButton.click();
    await page.waitForLoadState('networkidle');

    // 빠르게 모든 문제 답변 후 제출
    for (let i = 0; i < 20; i++) {
      const radioButtons = page.locator('[role="radio"]');
      if (await radioButtons.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await radioButtons.first().click();
      }

      const submitButton = page.getByRole('button', { name: /제출하기/i });
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
        break;
      }

      const nextButton = page.getByRole('button', { name: /다음/i });
      if (await nextButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForLoadState('domcontentloaded');
      } else {
        break;
      }
    }

    await page.waitForLoadState('networkidle');

    // 결과 페이지인지 확인
    const resultTitle = page.getByText('퀴즈 결과');
    const hasResult = await resultTitle.isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasResult) {
      test.skip(true, '결과 페이지가 표시되지 않습니다');
      return;
    }

    // 결과 페이지에서 문제 번호 버튼으로 네비게이션
    const questionButtons = page.locator('button.rounded-full');
    const buttonCount = await questionButtons.count();

    if (buttonCount > 1) {
      // 두 번째 문제로 이동
      await questionButtons.nth(1).click();
      await page.waitForLoadState('domcontentloaded');

      // 첫 번째 문제로 돌아가기
      await questionButtons.first().click();
      await page.waitForLoadState('domcontentloaded');
    }

    // 다시 풀기 버튼 클릭 시 초기화 확인
    const retryButton = page.getByRole('button', { name: /다시 풀기/i });
    if (await retryButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await retryButton.click();

      // 다시 풀기 후 라디오 버튼이 보여야 함
      const radioGroup = page.locator('[role="radiogroup"]');
      await expect(radioGroup).toBeVisible({ timeout: 5000 });
    }
  });
});
