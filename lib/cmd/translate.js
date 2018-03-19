const alfy = require('alfy')
const translate = require('google-translate-api')
const languages = require('google-translate-api/languages')

const outputLanguages = require('../output/languages')

module.exports = async input => {
	const originalWords = input.trim().split(' ')
	const words = originalWords.slice(0)

	let [from, to] = ['from', 'to'].map(prefix => {
		for (let i = 0; i < words.length; i++) {
			const word = words[i]

			if (word === prefix) {
				const nextWord = words[i + 1]
				if (languages.isSupported(nextWord)) {
					words.splice(i, 2)
					return nextWord
				}
			}
		}

		return null
	})

	from = languages.getCode(from) || 'auto'
	to = languages.getCode(to || alfy.config.get('default-language'))

	const completion = ['from', 'to'].map(prefix => {
		if (words[words.length - 2] === prefix) {
			const lastWord = words[words.length - 1]

			if (languages.getCode(lastWord)) {
				return null
			}

			const out = outputLanguages(lastWord, lang => {
				const code = languages.getCode(lang)
				return originalWords.slice(0, -1).concat(code).join(' ')
			})

			if (out) {
				return out
			}
		} else if (words[words.length - 1] === prefix) {
			return outputLanguages(null, lang => {
				const code = languages.getCode(lang)
				return originalWords.concat(code).join(' ')
			})
		}

		return null
	})

	for (const o of completion) {
		if (o !== null) {
			return o
		}
	}

	const text = words.join(' ')

	if (text.length === 0) {
		return [{
			title: 'Translate \'...\''
		}]
	}

	let res
	try {
		res = await translate(text, {from, to})
	} catch (err) {
		if (err.code === 'BAD_NETWORK') {
			throw new Error('You\'re not connected to the internet!')
		}

		throw err
	}

	const messages = []

	let fromLangMsg = languages[res.from.language.iso]
	let toLangMsg = languages[to]

	const output = []

	if (res.from.language.didYouMean) {
		fromLangMsg += ` (corrected from ${languages[from]})`
	}

	messages.push(`${fromLangMsg} ⇒ ${toLangMsg}`)

	const corrected = res.from.text.value.replace('[', '').replace(']', '')
	if (res.from.text.autoCorrected) {
		messages.push(`Showing translation for '${corrected}'`)
	}

	messages.push('Activate this item to copy word to clipboard.')

	const translateUrl = `https://translate.google.com/#${from}/${to}/${text}`
	output.push({
		title: res.text,
		subtitle: messages.join(' | '),
		valid: true,
		arg: res.text,
		variables: {
			action: 'copy'
		},
		quicklookurl: translateUrl,
		mods: {
			cmd: {
				subtitle: messages
					.slice(0, messages.length - 1)
					.concat('Activate this item to open in Google Translate')
					.join(' | '),
				arg: translateUrl,
				variables: {
					action: 'url'
				}
			}
		}
	})

	if (res.from.text.didYouMean) {
		output.push({
			title: `Did you mean: '${corrected}'`,
			autocomplete: input.replace(text, corrected),
			valid: false
		})
	}

	return output
}

module.exports.meta = {
	name: 'Translate text',
	usage: '(text) [from (language)] [to (language)]',
	help: 'Translates a given piece of text.',
	autocomplete: ''
}

module.exports.match = input => input.indexOf('!') !== 0
