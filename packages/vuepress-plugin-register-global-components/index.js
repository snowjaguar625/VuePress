const fs = require('fs-extra')
const path = require('path')
const globby = require('globby')

function fileToComponentName (file) {
  return file
    .replace(/\/|\\/g, '-')
    .replace(/\.vue$/, '')
}

async function resolveComponents (componentDir) {
  if (!fs.existsSync(componentDir)) {
    return
  }
  return (await globby(['**/*.vue'], { cwd: componentDir }))
}

module.exports = (options, context) => ({
  name: 'register-global-components',

  async enhanceAppFiles () {
    const { baseDirs } = options

    function genImport (baseDir, file) {
      const name = fileToComponentName(file)
      const absolutePath = path.resolve(baseDir, file)
      const code = `Vue.component(${JSON.stringify(name)}, () => import(${JSON.stringify(absolutePath)}))`
      return code
    }

    let code = ''
    for (const baseDir of baseDirs) {
      const files = await resolveComponents(baseDir) || []
      code += files.map(file => genImport(baseDir, file)).join('\n') + '\n'
    }
    code = `import Vue from 'vue'\n` + code + '\n'
    // context.registrationModulePath = await context.writeTemp(FILE_NAME, code)

    return [
      {
        name: 'global-components.js',
        content: code
      }
    ]
  }
})
