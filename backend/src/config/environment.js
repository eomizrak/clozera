import dotenv from 'dotenv'

const options = { quiet: process.env.NODE_ENV === 'test' }

if (process.env.DOTENV_CONFIG_PATH) {
  options.path = process.env.DOTENV_CONFIG_PATH
}

dotenv.config(options)
