import { expect, test } from './fixtures';

test.describe('location search', () => {
  test('finds a city by typing and shows the Indian AQI with a text label', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Search a city').fill('Delhi');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Delhi, Delhi, India', exact: true }).click();
    await expect(page.getByTestId('indian-aqi')).toHaveText(/\d+/);
    await expect(page.getByText('Very Poor').first()).toBeVisible();
    await expect(
      page.getByText('Modelled data (CAMS via Open-Meteo)', { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole('img', { name: 'PM2.5 forecast, next 72 hours' })).toBeVisible();
  });

  test('explains what went wrong for bad input', async ({ page }) => {
    await page.goto('/');
    const box = page.getByLabel('Search a city');
    await box.fill('xyzqq');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.locator('main').getByRole('alert')).toContainText(
      'No place found for "xyzqq"',
    );

    await box.fill('a');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.locator('main').getByRole('alert')).toContainText('at least 2 letters');

    await box.fill('<script>');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.locator('main').getByRole('alert')).toContainText('Use letters only');
  });

  test('a clean city looks different from a smoggy one', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Bengaluru', exact: true }).click();
    await expect(page.getByText('Satisfactory').first()).toBeVisible();
  });
});
