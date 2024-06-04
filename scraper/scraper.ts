import { chromium } from "playwright";
import { actionWithFallback } from 'playwright-auto-heal'
(async () => {
    const browser = await chromium.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://news.ycombinator.com/');

    const elem = await actionWithFallback(() => page.locator('#badSelector').click({timeout: 3000}), {
        page: page,
        prompt: "Hello",
        actionType: "Click"
    })

})();