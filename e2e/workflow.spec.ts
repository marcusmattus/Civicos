import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * The priority vertical slice, end to end:
 * Login → Command Centre → @-references → industries and instruments →
 * model canvas → scenario configuration → agent run → results → evidence → export.
 */

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Government email').fill('j.delacroix@london.gov.uk')
  await page.getByLabel('Password', { exact: true }).fill('correct-horse-battery')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  // Two-factor step
  await expect(page.getByRole('heading', { name: 'Two-factor verification' })).toBeVisible()
  await page.getByLabel('Authentication code').fill('123456')
  await page.getByRole('button', { name: 'Verify and sign in' }).click()

  await expect(page.getByRole('heading', { name: /What public system/ })).toBeVisible()
}

test.describe('CivicOS workflow', () => {
  test('signs in, builds a simulation, runs it and exports the brief', async ({ page }) => {
    await signIn(page)

    /* --- Command Centre: structured @ references ------------------------- */

    const composer = page.getByLabel('Describe the public system you want to model')
    await composer.fill('Model autonomous mobility in London using ')
    await composer.pressSequentially('@industry/tra')

    const menu = page.getByRole('listbox', { name: 'Insert reference' })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('option').first()).toContainText('Transport')
    await page.keyboard.press('Enter')

    await expect(composer).toHaveValue(/@industry\/transport/)
    // Selecting a reference inserts a visible chip.
    await expect(page.getByText('Transport', { exact: false }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Create simulation' }).click()

    /* --- Industry and instrument selection -------------------------------- */

    await expect(
      page.getByRole('heading', { name: 'Select industries and policy instruments' }),
    ).toBeVisible()

    await page.getByRole('checkbox', { name: /Healthcare/ }).first().click()
    await page.getByRole('checkbox', { name: /Regulation/ }).first().click()

    await page.getByRole('button', { name: 'Continue to model canvas' }).click()

    /* --- Model canvas ----------------------------------------------------- */

    await expect(page.getByRole('heading', { name: 'Build the system model' })).toBeVisible()
    await page.getByRole('button', { name: 'Validate model' }).click()
    await expect(page.getByText(/No issues detected|warning/i).first()).toBeVisible()

    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Draft saved locally.')).toBeVisible()

    await page.getByRole('button', { name: 'Continue' }).click()

    /* --- Scenario configuration ------------------------------------------ */

    await expect(page.getByRole('heading', { name: 'Configure scenarios' })).toBeVisible()
    await page.getByRole('tab', { name: 'Intervention' }).click()
    await expect(page.getByRole('tab', { name: 'Intervention' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await page.getByRole('tab', { name: 'Expected' }).click()

    await page.getByRole('button', { name: 'Run simulation' }).click()

    /* --- Agent run -------------------------------------------------------- */

    await expect(page.getByRole('heading', { name: /Simulation/ })).toBeVisible()
    await expect(page.getByRole('progressbar', { name: 'Overall run progress' })).toBeVisible()

    // Agents advance and the run finishes.
    await expect(page.getByRole('button', { name: 'View results' })).toBeVisible({ timeout: 40_000 })
    await expect(page.getByText('Complete').first()).toBeVisible()

    /* --- Evidence --------------------------------------------------------- */

    await page.getByRole('button', { name: 'Open evidence drawer' }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer.getByRole('heading', { name: 'Evidence' })).toBeVisible()
    await expect(drawer.getByText(/Datasets/).first()).toBeVisible()
    await expect(drawer.getByText('SCENARIO_ASSUMPTION').first()).toBeVisible()
    await drawer.getByRole('button', { name: 'Close' }).click()

    /* --- Results ---------------------------------------------------------- */

    await page.getByRole('button', { name: 'View results' }).click()
    await expect(page.getByRole('heading', { name: /Transition|London/ })).toBeVisible()

    // Standing reminder that a person decides.
    await expect(page.getByText('Modelled outcomes — human decision required.')).toBeVisible()

    // Every KPI carries a provenance classification.
    await expect(page.getByText(/FORECAST|SCENARIO_ASSUMPTION|SYNTHETIC/).first()).toBeVisible()

    /* --- Export ----------------------------------------------------------- */

    await page.getByRole('button', { name: 'Export policy brief' }).click()
    const exportDialog = page.getByRole('dialog')
    await expect(exportDialog.getByRole('heading', { name: 'Export' })).toBeVisible()
    await exportDialog.getByRole('radio', { name: 'csv' }).check()

    const download = page.waitForEvent('download')
    await exportDialog.getByRole('button', { name: 'Export' }).click()
    const file = await download
    expect(file.suggestedFilename()).toContain('policy_brief')
  })

  test('records the run in the audit centre', async ({ page }) => {
    await signIn(page)
    await page.goto('/audit')
    await expect(page.getByRole('heading', { name: 'Audit Centre' })).toBeVisible()
    // The wide table and the stacked card list are both in the DOM; only one is
    // shown at a given breakpoint, so assert on whichever is visible.
    await expect(page.getByText('Run simulation').filter({ visible: true }).first()).toBeVisible()
  })

  test('compares scenarios side by side', async ({ page }) => {
    await signIn(page)
    await page.goto('/results')
    await page.getByRole('button', { name: 'Compare scenarios' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Compare scenarios' })).toBeVisible()
    await expect(dialog.getByRole('columnheader', { name: /Accelerated/ })).toBeVisible()
    await expect(dialog.getByRole('rowheader', { name: /UBI funding gap/ })).toBeVisible()
  })
})

test.describe('access control and states', () => {
  test('protects application routes behind sign-in', async ({ page }) => {
    await page.goto('/results')
    await expect(page).toHaveURL(/\/login/)
  })

  test('rejects a non-government email domain', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Government email').fill('someone@example.com')
    await page.getByLabel('Password', { exact: true }).fill('correct-horse-battery')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByText(/restricted to authorised/i)).toBeVisible()
  })

  test('rejects an invalid two-factor code', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Government email').fill('j.delacroix@london.gov.uk')
    await page.getByLabel('Password', { exact: true }).fill('correct-horse-battery')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.getByLabel('Authentication code').fill('000000')
    await page.getByRole('button', { name: 'Verify and sign in' }).click()
    await expect(page.getByText(/not recognised/i)).toBeVisible()
  })

  test('shows the locked-account state', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Government email').fill('locked@gov.uk')
    await page.getByLabel('Password', { exact: true }).fill('correct-horse-battery')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Account locked' })).toBeVisible()
  })
})
