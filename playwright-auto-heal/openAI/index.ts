import OpenAI from "openai";
import dotenv from "dotenv"

import { ChatCompletion, ChatCompletionContentPart, ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";
import { ScrapeMetaData, scraperActionsWithDescriptions } from "../types";
dotenv.config()
const OPENAI_MODEL = "gpt-4o";

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY']
})

const generateMessages = (context: string, task: string, pageHtml: string, scraperImg: Buffer | null): ChatCompletionMessageParam[] => {
    let userMessages: ChatCompletionContentPart[] = []
    if(scraperImg){
        const imgUrl = `data:image/jpeg;base64,${Buffer.from(scraperImg).toString('base64')}`
        userMessages.push({
            type: "image_url",
            image_url: {
                url: imgUrl
            }
        })
    }
    userMessages = [
        ...userMessages, 
        {
            type: 'text',
            text: `Context:\n${context}`
        },
        {
            type: 'text',
            text: `Page Html:\n${pageHtml}` 
        },
        {
            type: 'text',
            text: `Task:\n${task}`
        }
    ]

    return [
        {
            role: "system",
            content: "You are analyzing a web scraper process that has failed. Given the current state of the page and the previous action that failed, deduce a new action to fulfil the prompt"
        },
        {
            role: "user",
            content: userMessages
        },  
    ]
}

export const createScraperAction = async(prompt: string, scrapeData: ScrapeMetaData) => {
    const {pageHtml, pageImg, errorMsg, attemptedAction} = scrapeData
    const scraperActionTool: ChatCompletionTool = {
        type: "function",
        function: {
            name: "create_scraper_action",
            description: `Create a web scraper action to achieve the prompt. An action must be taken on an element on the current page. The possible actions are:\n\t ${Object.entries(scraperActionsWithDescriptions).map(([action, desc]) => `ACTION: "${action}" - DESCRIPTION: "${desc}"`)}`,
            parameters: {
                type: "object",
                properties: {
                    "element_selector": {
                        type: "string",
                        description: `Selector for element on the current page to take an action on, or blank if the action is wait. When selecting an element, prioritize the following:
                            1. Element id - If an element has an id use that to create the selector
                            2. Element name - If an element is named, use that to create the selector
                            3. Element attribute - If an element has a custom unique attribute, use that to create the selector
                            4. if this fails, create an xpath from the nearest identifiable element, and prepend with "xpath="`
                    },
                    "action_type": {
                        type: "string",
                        description: "The Type of action to take on the selected element or on the page in general",
                        enum: Object.keys(scraperActionsWithDescriptions),
                    },
                },
                required: ['element_selector', 'action_type']
            }
        }

    }
    const context = `You are given the stringified HTML and image of a web page, as well as a task to complete on that page. Given all of these things, look at the web page and determine the best action to take on the current page to complete the task.`
    let task = prompt
    if(attemptedAction){
        task = `${task}\n\tScraper Action that failed on page: ${attemptedAction}`
    }
    if(errorMsg) {
        task = `${task}\n\tError Message from last action`
    }

    const messages: ChatCompletionMessageParam[] = generateMessages(context, task, pageHtml, pageImg)
    console.log('Sending completion to GPT')
    const openAiRes: ChatCompletion = await openai.chat.completions.create({
        messages: messages,
        model: OPENAI_MODEL,
        tools: [scraperActionTool],
        tool_choice: {
            type: 'function',
            function: {
                name: 'create_scraper_action'
            }
        }
    })
    console.log('RES: ',openAiRes)
    const toolCalls = openAiRes?.choices[0]?.message?.tool_calls
    toolCalls?.forEach((tool) => {
        console.log('TOOL CALL')
        console.log(tool)
        console.log(JSON.parse(tool.function.arguments))
    })

}
// export const categorizeText = async (docTypes: DocType[], text: string): Promise<DocType> => {
//     const categoriesFromDocTypes: string[] = docTypes.map((docType) => {
//         return `\nCategory: ${docType.get('name')}
//                 \n\tIdentifier: ${docType.get('snakeName')}
//                 \n\tDescription: ${docType.get('description')}`
//     })
//     const context = `Read the Context text, and classify it into one of the following categories. Each category will have a name, an identifier, and a description. Match which description fits the context the best and give the identifier\n${categoriesFromDocTypes}`
//     const enumsFromDocTypes = docTypes.map((docType) => docType.get('snakeName'))
//     const categorizeTool: ChatCompletionTool = {
//         type: "function",
//         function: {
//             name: "create_category",
//             description: "Take a text body and categorize it into one of the enumerated categories",
//             parameters: {
//                 type: "object",
//                 properties: {
//                     "category": {
//                         type: "string",
//                         enum: enumsFromDocTypes,
//                         description: "Possible categories for the text"
//                     }
//                 },
//                 required: ["category"]
//             },

//         }
//     }
//     const messages: ChatCompletionMessageParam[] = generateMessages(context, text)
//     console.log(messages)
//     const openAiRes: ChatCompletion = await openai.chat.completions.create({
//         messages: messages,
//         model: OPENAI_MODEL,
//         tools: [categorizeTool],
//         tool_choice: {
//             type: "function",
//             function: {
//                 name: categorizeTool.function.name
//             }
//         }
//     })
//     console.log(openAiRes)
//     try{
//         const toolCalls = openAiRes?.choices[0]?.message?.tool_calls
//         if(toolCalls?.length){
//             const categoryJSON = JSON.parse(toolCalls[0].function.arguments)
//             const {category} = categoryJSON
//             console.log('category is', category)
//             const matchingDocument = docTypes.find((doc)=> doc.snakeName === category)
//             if(matchingDocument) {
//                 return matchingDocument
//             }else{
//                 throw new Error(`could not find ${category} in documents`)
//             }
//         }
//         throw new Error(`Assistant did not use tool calls`)
//     }catch(err){
//         console.log(err)
//         throw err
//     }
// }
