import { expect, test } from '@playwright/test'

test.describe('Wallpaper Switcher', () => {
  test('should open background switcher dialog and swap wallpaper', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.action-btn.setting-btn')).toBeVisible()

    // 打开下拉菜单并点击壁纸偏好
    await page.locator('.action-btn.setting-btn').click()
    const bgPreferenceItem = page.locator('.el-dropdown-menu__item', {
      hasText: /壁纸偏好|Background/i,
    })
    await expect(bgPreferenceItem).toBeVisible()
    await bgPreferenceItem.click()

    // 验证壁纸切换弹窗打开
    const dialog = page.locator('.bg-switcher__dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 验证标签栏包含精选壁纸并点击切换到在线精选
    const onlineTab = dialog.locator('.bg-switcher__tab', {
      hasText: /在线精选|Curated/i,
    })
    await expect(onlineTab).toBeVisible()
    await onlineTab.click()

    // 验证“换一张”按钮存在
    const swapButton = dialog.locator('.bg-switcher__preview-action', {
      hasText: /换一张|Swap/i,
    })
    await expect(swapButton).toBeVisible({ timeout: 5000 })
  })
})
