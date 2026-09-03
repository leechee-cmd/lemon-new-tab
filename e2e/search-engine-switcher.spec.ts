import { expect, test } from '@playwright/test'

test.describe('Search Engine Switcher Dialog', () => {
  test('should open search engine preference dialog without dnd-kit errors', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => {
      pageErrors.push(err.message)
    })

    await page.goto('/')
    await expect(page.locator('.action-btn.setting-btn')).toBeVisible({ timeout: 15000 })

    // 点击设置动作按钮打开下拉菜单
    await page.locator('.action-btn.setting-btn').click()

    // 等待下拉菜单可见并点击搜索引擎偏好
    const preferenceItem = page.locator('.el-dropdown-menu__item', {
      hasText: /搜索引擎偏好|Search Engine/i,
    })
    await expect(preferenceItem).toBeVisible()
    await preferenceItem.click()

    // 验证搜索引擎偏好弹窗顺利打开
    const dialog = page.locator('.se-switcher__dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 验证内置搜索引擎项正常渲染
    const engineItems = dialog.locator('.se-switcher-item')
    await expect(engineItems.first()).toBeVisible()
    const count = await engineItems.count()
    expect(count).toBeGreaterThan(1)

    // 验证控制台没有抛出 DragDropRegistry / Invalid instance type 报错
    const dndErrors = pageErrors.filter(
      (msg) => msg.includes('Invalid instance type') || msg.includes('DragDropRegistry'),
    )
    expect(dndErrors).toEqual([])
  })
})
