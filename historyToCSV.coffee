fs = require 'fs'
path = require 'path'

fileNames = process.argv[2...]
for fileName in fileNames
  do (fileName) ->
    outFile = path.join(path.dirname(fileName), path.basename(fileName, path.extname fileName) + '.csv')
    console.log "writing to " + outFile

    fs.unlink outFile, ->
      fs.readFile fileName, (err, historyString) ->
        history = JSON.parse historyString

        keys = Object.keys(history)
        fs.appendFileSync outFile, keys.join('\t') + '\n'

        for i in [0...history[keys[0]].length]
          rowValues = keys.map (key) -> history[key][i]
          fs.appendFileSync outFile, rowValues.join('\t') + '\n'
