const alfy = require('alfy')

const WorkflowError = require('../error')
const config = require('../config')
const outputLanguages = require('../output/languages')
const {capitalize, langNames, hasOwnProperty} = require('../util')

const variables = {
	'default-language': {
		default: 'English',
		outputOptions: outputLanguages,
		isValid: input => langNames.indexOf(input.toLowerCase()) !== 1,
		prettify: input => capitalize(input)
	}
}

// Output matching for config variables
const outputVariables = pattern => {
	if (!pattern) {
		pattern = ''
	}

	const vars = Object.keys(config.defaults)

	const mapper = key => ({
		title: key,
		subtitle: '⇒ ' + alfy.config.get(key),
		autocomplete: `!set ${key} `
	})

	const out = alfy.matches(pattern, Object.keys(config.defaults)).map(mapper)

	return out.length === 0 ? vars.map(mapper) : out
}

module.exports = input => {
	// !set command value
	// Value can include spaces

	if (typeof input !== 'string') {
		throw new TypeError('input should be a string')
	}

	const chunks = input.split(' ')

	if (chunks.length === 1) {
		return outputVariables()
	}

	if (chunks.length === 2) {
		return outputVariables(chunks[1])
	}

	const variableName = chunks[1]

	// Throw if variable is invalid
	if (!hasOwnProperty(variables, variableName)) {
		throw new WorkflowError(`Variable '${variableName}' does not exist`, {
			autocomplete: '!set '
		})
	}

	const variable = variables[variableName]
	const value = chunks.slice(2).join(' ')

	if (chunks.length >= 3) {
		if (langNames.indexOf(value.toLowerCase()) === -1) {
			return variable.outputOptions(
				value,
				name => `!set ${variableName} ${variable.prettify(name)}`
			)
		}

		return [{
			title: `Set ${variableName} to '${variable.prettify(value)}'`,
			subtitle: `Old value ⇒ ${alfy.config.get(variableName)}`,
			valid: true,
			arg: JSON.stringify({
				alfredworkflow: {
					variables: {
						action: 'config',
						/* eslint-disable camelcase */
						config_variable: variableName,
						config_value: variable.prettify(value)
						/* eslint-enable camelcase */
					}
				}
			})
		}]
	}
}

module.exports.meta = {
	name: '!set',
	usage: '!set (variable) (value)',
	help: 'Sets a given config variable to the given value.',
	autocomplete: '!set '
}

module.exports.match = input => {
	return input.indexOf('!set') === 0
}
