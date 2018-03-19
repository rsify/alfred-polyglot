const alfy = require('alfy')

const {env} = process.env

alfy.config.set(env.config_variable, env.config_value)
