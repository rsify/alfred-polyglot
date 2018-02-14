const languages = require('google-translate-api/languages')

module.exports.capitalize = x =>
	x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase()

module.exports.endsWith = (string, end) => string.substr(-end.length) === end

module.exports.hasOwnProperty = (obj, prop) =>
	Object.hasOwnProperty.call(obj, prop)

module.exports.langNames = Object.keys(languages)
	.filter(languages.isSupported)
	.filter(lang => lang !== 'auto')
	.map(code => languages[code])
	.map(x => x.toLowerCase())
