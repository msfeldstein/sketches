#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const browserify = require('browserify')
const html = require('simple-html-index')
const { promisify } = require('util')
const child_process = require('child_process')

const publishDir = process.argv[3] ||  './publish-to-netlify'

async function awaitablePipe(src, dst) {
  src.pipe(dst)
  return new Promise(function(resolve, reject) {
    src.on('end', resolve)
    src.on('error', reject)
  })
}

async function publish() {
  // Clean up any old artifacts which shouldn't exist
  try {
    fs.removeSync(publishDir)
  } catch (e) {}

  // Create a temporary output directory to publish from
  fs.mkdirSync(publishDir)
  const b = browserify();
  b.add(process.argv[2] || './index.js')
  console.log(process.argv[2])
  var output = fs.createWriteStream(path.join(publishDir, 'bundle.js'));
  const bundler = b.bundle()
  console.log("Building bundle.js")
  await awaitablePipe(bundler, output)
  // Copy or create the index.html page
  const indexPath = path.join(publishDir, 'index.html')
  if (fs.pathExistsSync('./index.html')) {
    console.log("Copying existing index.html")
    fs.copySync('./index.html', indexPath)
  } else {
    console.log("Generating index.html")
    const htmlStream = html({
      title: 'budo',
      entry: 'bundle.js'
    })
    const htmlOut = fs.createWriteStream(indexPath)
    console.log(indexPath, 'index')
    await awaitablePipe(htmlStream, htmlOut)
  }
  const assetDirectories = ['public', 'assets', 'images', 'static']
  assetDirectories.forEach(dir => {
    if (fs.pathExistsSync(dir)) {
      console.log("Copying asset path:", dir)
      fs.copySync(dir, path.join(publishDir, dir))
    }
  })
  
  process.chdir(publishDir)
  child_process.spawn(`now`, ['--public']).stdout.on('data', function (data) {
    console.log('Publish: ' + data.toString());
  }).on('close', function() {
    // Cleanup artifacts
    fs.removeSync(publishDir)
  })
  

}
publish().catch(e => {
  console.error("Error", e)
  fs.removeSync(publishDir)
})