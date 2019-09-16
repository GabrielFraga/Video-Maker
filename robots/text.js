const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')
const state = require('./state')


const watsonApiKey = require('../credentials/watson-nlu.json')
const naturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')


const nlu = new naturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey.apikey,
    version: '2018-04-05',
    url: watsonApiKey.url
})


async function robot() {
    const content = state.load()

    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    limitMaximumSentences(content)
    await fetchKeyWordsOfAllSentences(content)

    state.save(content)

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2 ')
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()
        // console.log(wikipediaContent)

        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParetheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

        // console.log(withoutDatesInParetheses)
        content.sourceContentSanitized = withoutDatesInParetheses

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n')

            const withoutBlankLinesAndMarkdown = allLines.filter(line => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }

                return true
            })

            return withoutBlankLinesAndMarkdown.join(' ')
        }
    }

    function removeDatesInParentheses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
    }

    function breakContentIntoSentences(content) {
        content.sentences = []
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach(sentence => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
        // console.log(sentences)
    }

    function limitMaximumSentences(content) {

        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    async function fetchKeyWordsOfAllSentences(content) {
        for (const sentence of content.sentences) {
            sentence.keyword = await fetchWatsonAndReturnKeyWords(sentence.text)
        }
    }
    async function fetchWatsonAndReturnKeyWords(sentence) {


        return new Promise((resolve, reject) => {

            nlu.analyze({
                text: sentence,
                features: {
                    keywords: {}
                }
            }, (error, response) => {
                if (error) {
                    throw error
                }
                const keywords = response.keywords.map(keyword => {
                    return keyword.text
                })
                // console.log(keywords)
                resolve(keywords)
            })
        })
    }
}

module.exports = robot