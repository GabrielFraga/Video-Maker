const readline = require('readline-sync')

<<<<<<< HEAD
async function start() {
	const content = {
		maximumSentences: 7
	}
=======
function start (){
	const content = {}
>>>>>>> origin/user-input

	content.searchTerm = askAndReturnSearchTerm()
	content.prefix = askAndReturnPrefix()

<<<<<<< HEAD
	await robots.text(content)


	function askAndReturnSearchTerm() {
=======
	function askAndReturnSearchTerm(){
>>>>>>> origin/user-input
		return readline.question('Type a Wikipedia term: ')
	}

	function askAndReturnPrefix(){
		const prefixes = ['Who is','What is','The history of']
		const selectedPrefixIndex = readline.keyInSelect(prefixes)
		const selectedPrefixText = prefixes[selectedPrefixIndex]
		return selectedPrefixText
	}

	console.log(content.sentences)
}
start()
