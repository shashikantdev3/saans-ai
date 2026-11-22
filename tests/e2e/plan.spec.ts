import { expect, test } from './fixtures';
import { fillHousehold, pickDelhi } from './helpers';

test.describe("today's plan and impact", () => {
  test('builds a plan from a typed-in household', async ({ page }) => {
    await pickDelhi(page);
    await fillHousehold(page);
    await expect(page.getByTestId('best-time')).toHaveText(/\d{2}:00/);
    await expect(page.getByTestId('plan-source')).toHaveText('Rule-based text');
    await expect(page.getByTestId('dose-headline')).toContainText('cuts today');
    await expect(page.getByText('Switch from Car (alone) to Metro')).toBeVisible();
  });

  test('impact changes when the household changes', async ({ page }) => {
    await pickDelhi(page);
    await fillHousehold(page);
    const before = await page.getByTestId('dose-headline').textContent();
    await page.getByLabel('We have an air purifier').check();
    await page.getByRole('button', { name: 'Make my plan' }).click();
    await expect(page.getByTestId('dose-headline')).not.toHaveText(before ?? '');
  });

  test('rejects out-of-range numbers', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('People at home').fill('0');
    await page.getByRole('button', { name: 'Make my plan' }).click();
    await expect(page.locator('main').getByRole('alert')).toContainText('People at home');
  });

  test('switches to Hindi', async ({ page }) => {
    await pickDelhi(page);
    await fillHousehold(page);
    await page.getByRole('button', { name: 'हिंदी' }).click();
    await expect(page.getByRole('heading', { name: '3. आज का प्लान' })).toBeVisible();
    await expect(page.getByTestId('dose-headline')).toContainText('डोज़');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  });

  test('remembers the household in this browser only', async ({ page }) => {
    await pickDelhi(page);
    await fillHousehold(page);
    await page.reload();
    await expect(page.getByLabel('People at home')).toHaveValue('4');
  });
});
