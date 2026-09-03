import { expect, test } from '@playwright/test'

test.describe('Search Suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // 等待搜索框挂载与水合
    await expect(page.locator('input[name="search-input"]')).toBeVisible()
  })

  test('should display search suggestions when typing English text', async ({ page }) => {
    const input = page.locator('input[name="search-input"]')
    await input.focus()
    await input.fill('weather')

    // 建议项应当存在且大于 0
    const items = page.locator('.search-suggestion-area [role="option"]')
    await expect(items.first()).toBeVisible({ timeout: 10000 })
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display search suggestions when typing Chinese text', async ({ page }) => {
    const input = page.locator('input[name="search-input"]')
    await input.focus()
    await input.fill('天气')

    const items = page.locator('.search-suggestion-area [role="option"]')
    await expect(items.first()).toBeVisible({ timeout: 10000 })
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should support keyboard arrow navigation in suggestions', async ({ page }) => {
    const input = page.locator('input[name="search-input"]')
    await input.focus()
    await input.fill('github')

    const items = page.locator('.search-suggestion-area [role="option"]')
    await expect(items.first()).toBeVisible({ timeout: 10000 })

    // 按向下箭头
    await page.keyboard.press('ArrowDown')
    const activeItem = page.locator('.search-suggestion-area__item--active')
    await expect(activeItem).toBeVisible()

    // 输入框内容应同步为当前激活建议项
    const activeText = await activeItem.textContent()
    const inputValue = await input.inputValue()
    expect(inputValue.trim()).toBe(activeText?.trim())
  })

  test('should handle clearing text gracefully', async ({ page }) => {
    const input = page.locator('input[name="search-input"]')
    await input.focus()
    await input.fill('test')

    const items = page.locator('.search-suggestion-area [role="option"]')
    await expect(items.first()).toBeVisible({ timeout: 10000 })

    // 清空输入框
    await input.fill('')
    // 清空后不应崩溃，且不会展示过期的 'test' 联想项
    const staleItems = page.locator('.search-suggestion-area [role="option"]', { hasText: 'testflight' })
    await expect(staleItems).toHaveCount(0)
  })
})
