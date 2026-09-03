import { expect, test } from '@playwright/test'

test.describe('Theme Settings', () => {
  test('should toggle follow wallpaper color and update controls', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.action-btn.setting-btn')).toBeVisible()

    // 打开设置弹窗
    await page.locator('.action-btn.setting-btn').click()
    const settingsItem = page.locator('.el-dropdown-menu__item', {
      hasText: /设置|Settings/i,
    })
    await expect(settingsItem).toBeVisible()
    await settingsItem.click()

    // 等待设置界面打开（桌面端默认展示主题设置）
    const settingsDialog = page.locator('.settings__dialog')
    await expect(settingsDialog).toBeVisible({ timeout: 5000 })

    // 找到跟随壁纸颜色开关
    const monetSection = page.locator('.settings__item', {
      hasText: /跟随壁纸颜色|Follow Wallpaper Color/i,
    })
    await expect(monetSection).toBeVisible()

    const switchBtn = monetSection.locator('.el-switch')
    await expect(switchBtn).toBeVisible()

    // 找到主色调选择区域
    const primaryColorSection = page.locator('.settings__item', {
      hasText: /主色调|Primary Color/i,
    })
    const colorSelect = primaryColorSection.locator('.el-select')
    await expect(colorSelect).toBeVisible()

    // 获取当前开关状态
    const isCheckedInitially = await switchBtn.evaluate((el) =>
      el.classList.contains('is-checked'),
    )

    // 点击开关切换状态
    await switchBtn.click()

    const selectWrapper = colorSelect.locator('.el-select__wrapper')

    // 验证切换后 class 状态改变
    if (isCheckedInitially) {
      await expect(switchBtn).not.toHaveClass(/is-checked/)
      await expect(selectWrapper).not.toHaveClass(/is-disabled/)
    } else {
      await expect(switchBtn).toHaveClass(/is-checked/)
      await expect(selectWrapper).toHaveClass(/is-disabled/)
    }
  })
})
