const alfy = require('alfy')

const config = require('./config')
const set = require('./cmd/set')
const translate = require('./cmd/translate')

// Apply default config if ran for the first time
if (alfy.config.size === 0) {
	alfy.config.store = config.defaults
}

const commands = [set, translate]

module.exports = async input => {
	for (const command of commands) {
		if (command.match(input)) {
			return command(input)
		}
	}

	// No matches, show all commands
	return commands.map(command => ({
		title: command.meta.name,
		subtitle: `${command.meta.help} | Usage: ${command.meta.usage}`,
		autocomplete: command.meta.autocomplete,
		valid: false
	}))
}
