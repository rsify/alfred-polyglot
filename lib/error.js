class WorkflowError extends Error {
	constructor(message, data) {
		// data is an object with the following optional props:
		// .tip - message to show can the user fix the error
		// .autocomplete - self-explanatory

		super(message)
		this.name = 'WorkflowError'

		Object.assign(this, data)
	}
}

module.exports = WorkflowError
