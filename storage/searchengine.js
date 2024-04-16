const aData = require('./bot_data/raw_data.json'),
  templateData = aData,
  natural = require('natural'),
  path = require("path"),
  fs = require("fs"),
  fileSystemHandler = require('./fileSystemHandler'),
  buffer = require("buffer"),
  {
    telegramMessageHandler,
    responseEngine
  } = require("./package"),
  cfg = require("../configuration.json"),
  glossary = {
    "data": [
      {"ДК": "дебет"},
      {"КК": "кред"}
    ]
  }

const defaultMessageParams = {
  parse_mode: cfg.defMessageParams.defParseMode,
  protect_content: cfg.defMessageParams.disableSave,
  noforwards: cfg.defMessageParams.disableForwards,
  silent: cfg.defMessageParams.sendNotify ? false : true,
}

function combinator(matrix) {
  return matrix.reduceRight(function (combination, x) {
    let result = [];
    x.forEach(function (a) {
      combination.forEach(function (b) {
        result.push(`${a} ${b}`);
      });
    });
    return result;
  });
}

function replaceValues(stringArray, replaceValArray) {
  stringArray.forEach((el) => {
    replaceValArray.forEach(elem => {
      if (el.toLowerCase() === Object.keys(elem)[0].toLowerCase())
        stringArray[stringArray.indexOf(el)] = elem[Object.keys(elem)[0]].split(' ')
    })
  })
  if (Array.isArray(stringArray[0])) {
    return stringArray[0];
  } else {
    return stringArray.toString().toLowerCase().split(' ');
  }
}

class SearchEngine {
  async createIndexes(valArray) {
    let arrayToParse = new Set(valArray)
    arrayToParse = Array.from(arrayToParse);

    function generateIndex() {
      return Math.random().toString(16).slice(4)
    } // itemType : { "index": 'genId', content: valArray[i] }
    const content = {
      searchStrings: arrayToParse.map((v) => [{
        index: generateIndex(),
        title: `${v}`
      }])
    }
    try {
      fs.writeFile(path.resolve(`${__dirname}/`, 'search_system', `search_strings.json`), JSON.stringify(content), function () {
      })
    } catch (e) {
      console.log(e)
    }
  }

  async compareIndexes(arrayToCompare, callback) { // array of possible values
    try {
      fs.readFile(path.resolve(`${__dirname}/`, 'search_system', `search_strings.json`), async function (err, data) {
        if (err)
          console.log(err)
        else {
          if (arrayToCompare === false) {

          } else {
            let d = JSON.parse(data.toString())
            let finalData = []
            arrayToCompare.forEach((el) => {
              d.searchStrings.forEach((searchStrObject) => {
                if (el === Object.values(searchStrObject[0])[1]) {
                  finalData.push([{text: el, callback_data: Object.values(searchStrObject[0])[0]}])
                }
              })
            })
            await callback(finalData)
          }
        }
      })
    } catch (e) {

    }
  }

  async getValByIndex(index, callback) {
    fs.readFile(path.resolve(`${__dirname}/`, 'search_system', `search_strings.json`), async function (err, data) {
      if (err)
        console.log(err)
      else {
        let d = JSON.parse(data.toString())
        for (const searchStrObject of d.searchStrings) {
          if (Object.values(searchStrObject[0])[0] === index) {
            callback(Object.values(searchStrObject[0])[1])
            break;
          }
        }
      }
    })
  }

  async getValues(valToParse, callback) {
    let searchStrings = [];
    let indexStrings = [];
    templateData.resData.forEach((object) => { // array : [{ key: { key1:[], key2:[],key3:[],key4:[] } }]
      Object.values(object)[0].title.forEach((titleObject) => {
        indexStrings.push(titleObject)
        titleObject.split(' ').forEach((elem) => {
          try {
            elem.length > 1
              ? searchStrings.push(elem.replace('(', '').replace(')', '').toLowerCase())
              : ''
          } catch (e) {
            searchStrings.push(elem.toLowerCase())
          }
        })
      })
    })
    searchStrings = new Set(searchStrings);
    let queryValueArray = valToParse.toLowerCase().split(' ');

    callback({
      search_array: Array.from(searchStrings),
      query_array: replaceValues(queryValueArray, glossary.data)
    });
  }

  valCompare(valToCompare, callback) {
    let val1 = valToCompare.search_array;
    let val2 = valToCompare.query_array;
    let searchWordArray = [];
    let resultArray = [];
    val1.forEach((el) => el.split(' ').forEach((el) => searchWordArray.push(el)))
    val2.forEach(el => {
      let res = searchWordArray.filter(it => natural.PorterStemmerRu.stem(JSON.stringify(it)).includes(natural.PorterStemmerRu.stem(el)))
      resultArray.push(
        res.length === 0
          ? undefined
          : res
      );
    })
    // Результат: поиск заменам слов .ПРИМЕР: Вход: 'Ипот кредит'; Выход: [ [ 'Ипотека' ], [ 'кредитной', 'Кредит' ] ];
    if (resultArray.filter((v) => v).length === 0) {
      callback(false)
    } else {
      callback(this.buildCompareVal(resultArray.filter((v) => v)))
    }
  }

  buildCompareVal(arrayValues) {
    let compareArray = [] // Возможные строки для поиска в бд
    let combinationsArray = combinator(arrayValues)
    let uniqueFixer = new Set(combinationsArray)
    return this.compareResultWithData(combinationsArray, arrayValues);
  }

  compareResultWithData(arrayOfCombinations, rawValues) {
    let finalResult;
    for (let a of arrayOfCombinations) {
      templateData.resData.forEach((array) => {
        Object.values(array)[0].title.forEach((element, index) => { //{ key: { key1:[], key2:[],key3:[],key4:[] } }
          if (element === a) {
            finalResult = Object.values(array)[0].title[index]
          }
        })
      });
    }
    if (finalResult)
      return finalResult
    else {
      let arr = [];
      arrayOfCombinations.forEach(el => {
        try {
          el.split(' ').forEach(elem => {
            arr.push(elem)
          })
        } catch (e) {
          arr.push(el)
        }
      })
      let possibleValues = [];//
      for (let a1 of rawValues[0]) {
        templateData.resData.forEach((array) => {
          Object.values(array)[0].title.forEach((element, i) => { //{ key: { key1:[], key2:[],key3:[],key4:[] } }
            element.split(' ').forEach((el) => {
              if (el.replace('(', '').replace(')', '').toLowerCase().includes(a1)) {
                possibleValues.push(Object.values(array)[0].title[i])
              }
            })
          })
        });
      }
      let uniqueArr = new Set(possibleValues)
      return Array.from(uniqueArr);
    }
  }

  async getMessageData(callback) {
    await fileSystemHandler.prototype.readFromStorage('message_data', 'messages_data.json', function (result) {
      callback(result.messages)
    })
  }

  async MessageResolverForPossibleValues(text, msg, client) {
    await this.getMessageData(async function (messagesArray) {
      let i = 0;
      for (const messageArr of messagesArray) {
        if (Object.keys(messageArr)[0].toLowerCase() === text.toLowerCase()) {
          if (
            Object.values(messageArr)[0][0].split(' ').length === 1
            && Object.values(messageArr)[0][0].split(' ')[0].startsWith('<')
            && Object.values(messageArr)[0][0].split(' ')[0].endsWith('>')
          ) { // IS KEYBOARD
            await fileSystemHandler.prototype.readFromStorage('keyboard_data', 'keyboard_data.json', function (keyboardData) {
              for (const keyboardElement of keyboardData.keyboards) {
                if (Object.keys(keyboardElement)[0].toLowerCase() === Object.values(messageArr)[0][0]
                  .toLowerCase()
                  .replace('<', '')
                  .replace('>', '')
                ) {
                  client.sendMessage(msg.chat.id, text, Object.values(keyboardElement)[0]).catch((err) => {
                  })

                  break;
                }
              }
            })
          } else { // 00 - content 01- file 02 - media - 03 - image
            if (Object.values(messageArr)[0][0].split('').length > 4000) {
              const splitInHalf = arr => [arr.slice(0, Math.ceil(arr.length / 2)), arr.slice(Math.ceil(arr.length / 2))]
              await client.sendMessage(msg.chat.id, splitInHalf(Object.values(messageArr)[0][0])[0], defaultMessageParams).catch((err) => {
              })
              await client.sendMessage(msg.chat.id, splitInHalf(Object.values(messageArr)[0][0])[1], defaultMessageParams).catch((err) => {
              })

            } else {
              await client.sendMessage(msg.chat.id, Object.values(messageArr)[0][0], defaultMessageParams).catch((err) => {
              })
            }
            if (Object.values(messageArr)[0][1] !== null) {
              let files = Object.values(messageArr)[0][1].split(',');
              files.forEach((file) => {
                client.sendDocument(msg.chat.id, fileSystemHandler.prototype.getCustomFilePath(file), defaultMessageParams).catch((err) => {
                })
              })
            }
            if (Object.values(messageArr)[0][2] !== null) { // Видео должны заработать в ориге бота
              let files = Object.values(messageArr)[0][2].split(',');
              files.forEach((videoFile) => {
                client.sendVideo(msg.chat.id, videoFile, defaultMessageParams).catch((err) => {
                })
              })
            }
            if (Object.values(messageArr)[0][3] !== null) {
              let images = Object.values(messageArr)[0][3].split(',');
              images.forEach((image) => {
                client.sendVideo(msg.chat.id, fileSystemHandler.prototype.getCustomFilePath(image), defaultMessageParams).catch((err) => {
                })
              })
            }
            break;
          }
        }
      }
    })
  }
}

class useSearchEngine {
  async findValue(text, callback) {
    await SearchEngine.prototype.getValues(text, async function (res1) {
      await SearchEngine.prototype.valCompare(res1, function (resFinal) {
        callback(resFinal)
      })
    })
  }

  async generateIndexes() {
    let indexStrings = []
    templateData.resData.forEach((object) => { // array : [{ key: { key1:[], key2:[],key3:[],key4:[] } }]
      Object.values(object)[0].title.forEach((titleObject) => {
        indexStrings.push(titleObject)
      })
    })
    await SearchEngine.prototype.createIndexes(indexStrings)
  }

  async getIndexes(array, callback) {
    await SearchEngine.prototype.compareIndexes(array, function (data) {
      callback(data)
    })
  }

  async getValueByIndex(index, message, client) {
    await SearchEngine.prototype.getValByIndex(index, async function (readyValue) {
      await SearchEngine.prototype.MessageResolverForPossibleValues(readyValue, message, client)
    })
  }
}

module.exports = useSearchEngine;