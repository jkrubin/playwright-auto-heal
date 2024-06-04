export type ScrapeMetaData = {
    pageHtml: string;
    pageImg: Buffer;
    errorMsg?: string;
    attemptedAction?: string;
}

export type ScraperActions = 'CLICK' | 'TYPE' | 'WAIT'
export const scraperActionsWithDescriptions = {
    'CLICK': "An element on the page needs to be clicked to complete the prompt",
    'TYPE': "We need to type in an element on the page in order to complete the prompt",
    'WAIT': "The page is still loading and we need to wait longer"
}