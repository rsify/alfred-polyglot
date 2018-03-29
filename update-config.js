const alfy = require('alfy')

const {env} = process

alfy.config.set(env.config_variable, env.config_value)
