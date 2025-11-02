import { test, expect } from '@playwright/test';

test.describe('Web UI', () => {
  test('should display the main page', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Zhi Lang Cop/);

    // Check main components are visible
    await expect(page.locator('text=Zhi Lang Cop - 中文語言檢查工具')).toBeVisible();
    await expect(page.locator('text=中文文字檢查')).toBeVisible();
    await expect(page.locator('text=詞庫統計')).toBeVisible();
  });

  test('should display statistics on load', async ({ page }) => {
    await page.goto('/');

    // Wait for stats to load
    await expect(page.locator('text=版本')).toBeVisible();
    await expect(page.locator('text=總規則數')).toBeVisible();
    await expect(page.locator('text=總詞彙數')).toBeVisible();
  });

  test('should check text and display results', async ({ page }) => {
    await page.goto('/');

    // Enter text to check
    const textarea = page.locator('textarea[label="輸入要檢查的中文文字"]').first();
    await textarea.fill('我需要優化數據庫的性能');

    // Click check button
    await page.locator('button:has-text("檢查")').click();

    // Wait for results
    await expect(page.locator('text=檢查結果')).toBeVisible();

    // Should show issues found
    await expect(page.locator('text=個問題')).toBeVisible();

    // Should show issue details with expansion panels
    await expect(page.locator('text=優化').or(page.locator('text=數據庫'))).toBeVisible();
  });

  test('should display no issues for clean text', async ({ page }) => {
    await page.goto('/');

    // Enter clean text
    const textarea = page.locator('textarea').first();
    await textarea.fill('這段文字很正常沒有問題');

    // Click check button
    await page.locator('button:has-text("檢查")').click();

    // Wait for results and success message
    await expect(page.locator('text=沒有發現問題')).toBeVisible();
  });

  test('should clear text when clear button is clicked', async ({ page }) => {
    await page.goto('/');

    // Enter text
    const textarea = page.locator('textarea').first();
    await textarea.fill('測試文字');

    // Click clear button
    await page.locator('button:has-text("清除")').click();

    // Textarea should be empty
    await expect(textarea).toHaveValue('');
  });

  test('should change minimum level', async ({ page }) => {
    await page.goto('/');

    // Enter text with error level issues
    const textarea = page.locator('textarea').first();
    await textarea.fill('優化性能');

    // Select hazard level (should filter out error level)
    await page.locator('label:has-text("最低檢查等級")').click();
    await page.locator('text=🔴 Hazard (最嚴重)').click();

    // Click check button
    await page.locator('button:has-text("檢查")').click();

    // Should show no issues (error level filtered out)
    await expect(page.locator('text=沒有發現問題')).toBeVisible();
  });

  test('should expand issue details', async ({ page }) => {
    await page.goto('/');

    // Enter text to check
    const textarea = page.locator('textarea').first();
    await textarea.fill('視頻');

    // Click check button
    await page.locator('button:has-text("檢查")').click();

    // Wait for results
    await expect(page.locator('text=檢查結果')).toBeVisible();

    // Click to expand first issue
    await page.locator('.v-expansion-panel').first().click();

    // Should show detailed information
    await expect(page.locator('text=說明：')).toBeVisible();
    await expect(page.locator('text=規則 ID：')).toBeVisible();
    await expect(page.locator('text=建議替換為：')).toBeVisible();
  });

  test('check button should be disabled when textarea is empty', async ({ page }) => {
    await page.goto('/');

    const checkButton = page.locator('button:has-text("檢查")');
    await expect(checkButton).toBeDisabled();

    // Enter text
    const textarea = page.locator('textarea').first();
    await textarea.fill('測試');

    // Button should be enabled
    await expect(checkButton).toBeEnabled();
  });
});
