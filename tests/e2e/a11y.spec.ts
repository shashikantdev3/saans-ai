import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';
import { fillHousehold, pickDelhi } from './helpers';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('accessibility (WCAG 2.1 AA)', () => {
  test('home page has no axe violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations).toEqual([]);
  });

  test('full flow with plan, impact and chat has no axe violations', async ({ page }) => {
    await pickDelhi(page);
    await fillHousehold(page);
    await page.getByLabel('Your question').fill('Should I wear a mask?');
    await page.getByRole('button', { name: 'Ask' }).click();
    await page.getByText('How Saans answered').click();
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations).toEqual([]);
  });

  test('works with the keyboard alone', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByLabel('Search a city').focus();
    await page.keyboard.type('Delhi');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Delhi, Delhi, India', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('indian-aqi')).toBeVisible();
  });

  test('large-text mode scales the page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Large text/ }).click();
    await expect(page.locator('html')).toHaveClass(/large-text/);
    const size = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    expect(size).toBe('20px');
  });
});
