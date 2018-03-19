const alfredNotifier = require('alfred-notifier')
const alfy = require('alfy')

const WorkflowError = require('./lib/error')
const workflow = require('./lib')

alfredNotifier();

(async () => {
	try {
		const out = await workflow(alfy.input)

		if (out === null) {
			throw new WorkflowError('Something went wrong :(')
		}
	} catch (err) {
		const messages = []

		if (err.tip) {
			messages.push(err.tip)
		}

		messages.push('Activate this item to try again.')
		messages.push('⌘L to see the stack trace')

		alfy.output([{
			title: `Error: ${err.message}`,
			subtitle: messages.join(' | '),
			autocomplete: err.autocomplete ? err.autocomplete : '',
			icon: {
				path: alfy.icon.error
			},
			valid: false,
			text: {
				largetype: err.stack,
				copy: err.stack
			}
		}])
	}
})()
