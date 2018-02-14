const alfy = require('alfy')
const languages = require('google-translate-api/languages')

const {langNames} = require('../util')

module.exports = (pattern, autocomplete = () => undefined) => {
	if (!pattern) {
		pattern = ''
	}

	const out = alfy.matches(pattern, langNames)
		.map(name => ({
			title: name.slice(0, 1).toUpperCase() + name.slice(1),
			autocomplete: autocomplete(name),
			icon: {
				path: `icons/${languages.getCode(name)}.png`
			}
		}))

	return out.length === 0 ? null : out
}
