const appInfo = require('../app.json')

const arguments = process.argv.slice(2)
const actionIndex = arguments.indexOf("--action") + 1

if(actionIndex === 0) {
  console.log('')
  console.log('Invalid call to echoActionToPerform: --action flag is missing.')
  console.log('')
  process.exit()
}

const { domain } = Object.values(appInfo.expo.extra.IDPS)[0]

if(!domain) {
  console.log('')
  console.log('Invalid call to echoActionToPerform: tenant not properly setup.')
  console.log('')
  process.exit()
}

const actionStrings = {
  'push-apps-to-production': `** About to push apps to production for ${domain}. **`,
  'push-to-staging': `** About to push web and apps to staging for ${domain}. **`,
  'push-web-staging-to-production': `** About to push web staging to production for ${domain}. **`,
  'build-android-beta': `** About to build Android BETA app for ${domain}. **`,
  'build-android-production': `** About to build Android PRODUCTION app for ${domain}. **`,
  'build-ios-beta': `** About to build iOS BETA app for ${domain}. **`,
  'build-ios-production': `** About to build iOS PRODUCTION app for ${domain}. **`,
}

const action = actionStrings[arguments[actionIndex]]

if(!action) {
  console.log('')
  console.log('Invalid call to echoActionToPerform: invalid action.')
  console.log('')
  process.exit()
}

console.log('')
console.log('–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––')
console.log(action)
console.log('–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––')
console.log('')

process.exit()