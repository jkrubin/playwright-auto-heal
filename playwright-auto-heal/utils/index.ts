import { Page } from "playwright";

export async function stripPlaywrightPage(page: Page) {
    let htmlContent = await page.content()
    //Rm <script> tags
    htmlContent = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Rm <style> tags
    htmlContent = htmlContent.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
    // Rm HTML comments
    htmlContent = htmlContent.replace(/<!--[\s\S]*?-->/g, '');

    return htmlContent
}

export async function snapshotPlaywrightPage(page: Page) {
    const buffer = await page.screenshot({fullPage: true})
    return buffer
}
