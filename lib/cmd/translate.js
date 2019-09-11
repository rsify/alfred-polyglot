const alfy = require('alfy')
const translateService = require('@vitalets/google-translate-api')
const languages = require('@vitalets/google-translate-api/languages')

const outputLanguages = require('../output/languages')
const {CachedList, tryAsync} = require('../util')

const history = new CachedList('to-lang-history')

const $pending = Symbol('token$pending')

const parse = input => {
	const raw = input.trim().split(' ').reduce(({words, from, to}, current) => {
		if (from === $pending) {
			return {words, from: current, to}
		}

		if (to === $pending) {
			return {words, from, to: current}
		}

		if (current === 'from' && !from) {
			return {words, from: $pending, to}
		}

		if (current === 'to' && !to) {
			return {words, from, to: $pending}
		}

		return {
			words: words.concat(current),
			to,
			from
		}
	}, {
		words: [],
		from: undefined,
		to: undefined
	})

	return {
		text: raw.words.join(' '),
		from: raw.from,
		to: raw.to
	}
}

const translate = async (text, from, to) => {
	const res = await tryAsync(
		() => translateService(text, {from, to}),
		error => {
			if (error.code === 'BAD_NETWORK') {
				throw new Error('You\'re not connected to the internet!')
			}

			throw error
		}
	)

	// If the translate service detects the `from` language being
	// the same as user specified `to` language, rerun the
	// translation with the `to` language being the last unique
	// one.
	// This allows for inputs like `trans potato` be translated
	// to a language different from english if the user has their
	// `default-language` set to `en`, automatically.
	if (res.from.language.iso.toLowerCase() === to) {
		const lastUniqueToLanguage = history.all.reverse()
			.find(l => l !== to)

		const newToLanguage = lastUniqueToLanguage || 'en'

		// Prevent infinite recursion
		if (newToLanguage !== to) {
			return translate(text, from, newToLanguage)
		}
	}

	history.append(to)

	const messages = []

	let fromLangMsg = languages[res.from.language.iso.toLowerCase()]
	const toLangMsg = languages[to]

	if (res.from.language.didYouMean) {
		fromLangMsg += ` (corrected from ${languages[from]})`
	}

	messages.push(`${fromLangMsg} ⇒ ${toLangMsg}`)

	const corrected = res.from.text.value.replace('[', '').replace(']', '')
	if (res.from.text.autoCorrected) {
		messages.push(`Showing translation for '${corrected}'`)
	}

	messages.push('Activate this item to copy word to clipboard.')

	const output = []

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
			autocomplete:
				(from ? `from ${from} ` : '') +
				(to ? `to ${to} ` : '') +
				corrected,
			valid: false
		})
	}

	return output
}

const translateCommand = async input => {
	const parsed = parse(input)

	for (const prefix of ['from', 'to']) {
		const subject = parsed[prefix]

		if (subject === undefined) {
			continue
		}

		if (subject === $pending || !languages.getCode(subject)) {
			const out = outputLanguages(
				subject === $pending ? null : subject,
				lang => {
					const code = languages.getCode(lang)
					const sliceBy = subject === $pending ? undefined : -1
					return input.trim().split(' ').slice(0, sliceBy).concat(code).join(' ')
				}
			)

			if (out) {
				return out
			}
		}
	}

	if (parsed.text.length === 0) {
		return [{
			title: 'Translate \'...\''
		}]
	}

	const from = languages.getCode(parsed.from) || 'auto'
	const to = languages.getCode(parsed.to || alfy.config.get('default-language'))

	return translate(parsed.text, from, to)
}

module.exports = translateCommand

module.exports.meta = {
	name: 'Translate text',
	usage: '(text) [from (language)] [to (language)]',
	help: 'Translates a given piece of text.',
	autocomplete: ''
}

module.exports.match = input => input.indexOf('!') !== 0

module.exports.parse = parse
