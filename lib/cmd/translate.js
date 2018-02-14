const alfy = require('alfy')
const translate = require('google-translate-api')
const languages = require('google-translate-api/languages')
const {endsWith} = require('../util')

const outputLanguages = require('../output/languages')

const matchPrefix = (prefix, input) => {
	const re = new RegExp(prefix + ' ?(\\w*)', 'i')
	const res = re.exec(input)

	return res === null ? null : res[1]
}

module.exports = async input => {
	// Text to be translated
	let text = input.trim()

	// Match '(from|to) [lang]' mutate text to be translated
	// Extract this and put inside a test
	// {text, from, to} = extractInputLangs(input)
	let [from, to] = ['from', 'to'].map(prefix => {
		const match = matchPrefix(prefix, input)

		if (match !== null &&
			Object.keys(languages).indexOf(match) !== -1 &&
			typeof languages[match] === 'string') {
			// 'prefix *' is in input
			// Specified language code is valid

			// Remove the 'prefix *' phrase from the text to be translated
			text = text.replace(
				new RegExp('(\\W|^)' + prefix + ' ?' + match)
				, ''
			)

			return languages[match]
		}

		return null
	})
	from = languages.getCode(from) || 'auto'
	to = languages.getCode(to || alfy.config.get('default-language'))

	const autocomplete = (match, prefix) => language => {
		const code = languages.getCode(language)

		return input.replace(
			new RegExp(prefix + ' ?' + match + '$'),
			prefix + ' ' + code + ' '
		)
	}

	const completion = ['from', 'to'].map(prefix => {
		const match = matchPrefix(prefix, input)

		if (languages.getCode(match) && typeof languages[match] === 'string') {
			return null
		}

		if ((endsWith(input, prefix + ' ' + match) ||
			endsWith(input, prefix)) &&
			input.indexOf(prefix) === input.lastIndexOf(prefix)) {
			// Autocomplete specified language to preceding string + code
			const out = outputLanguages(match, autocomplete(match, prefix))

			if (out) {
				return out
			}
		}

		return null
	})

	// Prevent js array closure weirdness
	for (const o of completion) {
		if (o !== null) {
			return o
		}
	}

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
	output.push({
		title: res.text,
		subtitle: messages.join(' | '),
		valid: true,
		arg: res.text,
		variables: {
			action: 'copy'
		},
		mods: {
			cmd: {
				subtitle: messages
					.slice(0, messages.length - 1)
					.concat('Activate this item to open in Google Translate')
					.join(' | '),
				arg: `https://translate.google.com/#${from}/${to}/${text}`,
				variables: {
					action: 'url'
				}
			}
		}
	})

	if (res.from.text.didYouMean) {
		output.push({
			title: `Did you mean: '${corrected}'`,
			autocomplete: input.replace(text, corrected)
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
