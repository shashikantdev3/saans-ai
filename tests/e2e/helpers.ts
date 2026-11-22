import type { Page } from '@playwright/test';

export async function pickDelhi(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Delhi', exact: true }).click();
  await page.getByTestId('indian-aqi').waitFor();
}

/** Fill the household form by typing, the way a user would. */
export async function fillHousehold(page: Page) {
  await page.getByLabel('People at home').fill('4');
  await page.getByLabel('A child').check();
  await page.getByLabel('Main commute').selectOption('car');
  await page.getByLabel('Commute distance, one way (km)').fill('12');
  await page.getByLabel('Main room size (m²)').fill('14');
  await page.getByLabel('Usual time for a walk, exercise or play (hour, 24h)').fill('7');
  await page.getByRole('button', { name: 'Make my plan' }).click();
  await page.getByTestId('plan-source').waitFor();
}
