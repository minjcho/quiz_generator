import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.playwright/.auth/user.json');

/**
 * 테스트용 계정으로 실제 로그인 수행
 *
 * 필요한 환경변수:
 * - TEST_USER_EMAIL: 테스트 계정 이메일
 * - TEST_USER_PASSWORD: 테스트 계정 비밀번호
 *
 * Supabase에서 이메일/비밀번호 로그인을 활성화하거나
 * 테스트 전용 Magic Link를 사용할 수 있음
 */

setup('authenticate', async ({ page }) => {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    console.log('⚠️ TEST_USER_EMAIL/TEST_USER_PASSWORD 환경변수가 없습니다.');
    console.log('⚠️ 인증 테스트를 건너뜁니다.');

    // 빈 storage state 저장
    await page.goto('/');
    await page.context().storageState({ path: authFile });
    return;
  }

  // 로그인 페이지로 이동
  await page.goto('/login');

  // 이메일/비밀번호 로그인 폼이 있다면 사용
  const emailInput = page.getByLabel(/이메일|email/i);
  const passwordInput = page.getByLabel(/비밀번호|password/i);

  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);

    const loginButton = page.getByRole('button', { name: /로그인|sign in/i });
    await loginButton.click();

    // 로그인 성공 후 대시보드로 리다이렉트 대기
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  } else {
    console.log('⚠️ 이메일/비밀번호 로그인 폼을 찾을 수 없습니다.');
    console.log('⚠️ Google OAuth만 지원되는 경우 수동 설정이 필요합니다.');
  }

  // 인증 상태 저장
  await page.context().storageState({ path: authFile });
});
