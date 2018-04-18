#!/usr/bin/env node
const program = require('commander')
const axios = require('axios')
const inquirer = require('inquirer')
const { exec } = require('child_process')
const CLI = require('clui')
const chalk = require('chalk')
const { argv } = require('process')
const Spinner = CLI.Spinner

const state = {
  query: undefined,
  args: ['npm', ...argv.slice(2)]
}

const spinner = (message) => new Spinner(message, ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'])

const fectching = spinner('Fecthing recommend packages...  ')
const processing = spinner('processing npm command...  ')

const question = (choices) => [
  {
    type: 'list',
    name: 'recommend',
    message: 'Recommend packages:',
    pageSize: 10,
    choices
  }
]
const cmdProcess = (commandString) => {
  console.log(chalk.cyan(commandString))
  processing.start()
  exec(commandString, (err, stdout, stderr) => {
    processing.stop()
    if (err) {
      console.error(err)
    }
    console.log(`${stdout}`)
    console.log(chalk.yellow(stderr))
  })
}
const prompt = (pkgs) => {
  inquirer.prompt(question(pkgs))
    .then(selected => selected.recommend)
    .then(pkg => {
      const {args} = state
      const queryCommandIndex = args.findIndex(arg => (arg === 'q') || (arg === 'query'))
      const queryStringIndex = args.findIndex(arg => arg === state.query)
      args[queryCommandIndex] = 'install'
      args[queryStringIndex] = pkg
      return state.args.join(' ')
    })
    .then(cmdProcess)
}

const fectchPackage = (query) => {
  fectching.start()
  axios.get(`https://www.npmjs.com/search/suggestions?q=${query}`)
    .then(res => {
      fectching.stop()
      const { status, data } = res
      if (status === 200 && Array.isArray(data)) {
        const packageNames = data.map(pkg => pkg.name)
        return packageNames
      }
      return []
    })
    .then(prompt)
}

program
  .version('0.0.4')
  .command('query [pkg]')
  .alias('q')
  .allowUnknownOption(true)
  .action((pkg) => {
    if (pkg === undefined) {
      return
    }
    state.query = pkg
    fectchPackage(pkg)
  })

program
  .command('*')
  .action(() => {
    cmdProcess(state.args.join(' '))
  })

program.parse(argv)
