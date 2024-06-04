import { Page } from "playwright";
import { snapshotPlaywrightPage, stripPlaywrightPage } from "./../utils";
import path from "path";
import { createScraperAction } from "../openAI";
import { ScrapeMetaData } from "../types";
const fs = require('fs');
export type ActionOptions = {
    page: Page,
    prompt: string,
    actionType: string,
}
export async function actionWithFallback(action: () => any, options: ActionOptions) {
    const {page, prompt, actionType} = options;
    try{
        console.log('starting action')
        const FnResult = await action();
        return FnResult
    }catch(err) {
        console.log('error')
        console.log(err)
        const pageHTML = await stripPlaywrightPage(page)
        const ssBuffer = await snapshotPlaywrightPage(page)
        const scrapeData: ScrapeMetaData = {
            pageHtml: pageHTML,
            pageImg: ssBuffer,
            errorMsg: `${err}`,
            attemptedAction: action.toString()
        }
        await createScraperAction(prompt, scrapeData)
        // const screenshotDir = path.resolve(__dirname, '../screenshots')
        // fs.writeFileSync(`${screenshotDir}/ss.png`, ssBuffer)
        // fs.writeFileSync(`${screenshotDir}/content.txt`, pageHTML)
    }
}