"use strict";
global.XMLHttpRequest = require('xhr2')

const cfg = require('../configuration.json'),
    path = require("path"),
    fileSystemHandler = require('./fileSystemHandler'),
    fs = require("fs"),
    useSearchEngine = require('./searchengine'),
    aData = require('./bot_data/raw_data.json'),
    templateData = aData,
    natural = require('natural'),
ObjectTemplates = {
    messagesObject : {
        messageTitle : [
            'item1 : content | <content>',
            'item2 : file_to_send | <file_array>',
            'item3 : media_file_to_send | <media_array>'
        ]
    },
    keyboardObject: {
        messageTitle: [
            'item1 : content | <content>',
        ]
    },
    usersObject : {
        userTelegramId: [
            'item1 : username of tg profile',
            'item2 : isAdmin ? true : false',
            'item3 : job title <svk , ng, srkp ....etc>'
        ]
    }
}, defaultMessageParams = {
    parse_mode: cfg.defMessageParams.defParseMode,
    protect_content: cfg.defMessageParams.disableSave,
    noforwards: cfg.defMessageParams.disableForwards,
    silent: cfg.defMessageParams.sendNotify ? false : true
}

class netQuery{
    async getDataFromGoogle(sheetName, sheetId, queryToList, callback) { // defQuery 'Select *'
        let sName = sheetName;
        let base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
        let qRea = encodeURIComponent(queryToList);
        let qUri = `${base}&sheet=${sName}&tq=${qRea}`;
        let xhr = new XMLHttpRequest();
        xhr.open('get', qUri, true);
        xhr.send()
        xhr.onload = () => {
            try {
                let data = JSON.parse(xhr.responseText.substr(47).slice(0, -2))
                callback(data)
            } catch (e) {
                console.log(e)
            }
        }
    }
}

class telegramLogger{
    log (msg) {
        let date = new Date().toDateString()
        fileSystemHandler.prototype.appendInStorage('logs', `${JSON.stringify(msg)} \n`,
            `log_${date.replace(' ', '_')}.txt`)
    }
}

class dataHandler { // uses XHR to get keyboard data
    async updateData()  {
        async function getDataFromGoogle_child(sheetName, sheetId, queryToList, callback) { // defQuery 'Select *'
            let sName = sheetName;
            let base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
            let qRea = encodeURIComponent(queryToList);
            let qUri = `${base}&sheet=${sName}&tq=${qRea}`;
            let xhr = new XMLHttpRequest();
            xhr.open('get', qUri, true);
            xhr.send()
            xhr.onload = () => {
                try {
                    let data = JSON.parse(xhr.responseText.substr(47).slice(0, -2))
                    callback(data)
                } catch (e) {
                    console.log(e)
                }
            }
        }

        async function useNetData(callback) {
            await getDataFromGoogle_child('renderList',cfg.dataSheetID, 'Select *', async function (raw) {
                let data_fcol = [];
                let data_fcol2 = [];
                let data_fcol3 = [];
                let data_fcol4 = [];
                let data_fcol5 = [];
                let completed_data_array = [];

                let notRawData = raw.table.rows.map(row => row.c[0].v)

                for (const e of notRawData) {
                    await callData(e, function (d) {
                        completed_data_array.push(d)
                    })
                }

                async function callData(elem, callback) {
                    await getDataFromGoogle_child(elem,cfg.dataSheetID, 'Select *', async function (data) {
                        for (let i = 0; i < data.table.rows.length; i++) {
                            if (data.table.rows[i].c[0] !== null??undefined) {
                                if (data.table.rows[i].c[0].v !== 'title') {
                                    if (data.table.rows[i].c[0] === undefined || data.table.rows[i].c[0] === null)
                                        data_fcol.push('null');
                                    else
                                        data_fcol.push(data.table.rows[i].c[0].v);

                                    if (data.table.rows[i].c[1] === undefined || data.table.rows[i].c[1] === null)
                                        data_fcol2.push('null');
                                    else
                                        data_fcol2.push(data.table.rows[i].c[1].v);

                                    if (data.table.rows[i].c[2] === undefined || data.table.rows[i].c[2] === null)
                                        data_fcol3.push('null');
                                    else
                                        data_fcol3.push(data.table.rows[i].c[2].v);

                                    if (data.table.rows[i].c[3] === undefined || data.table.rows[i].c[3] === null)
                                        data_fcol4.push('null')
                                    else
                                        data_fcol4.push(data.table.rows[i].c[3].v);

                                    if (data.table.rows[i].c[4] === undefined || data.table.rows[i].c[4] === null)
                                        data_fcol5.push('null')
                                    else
                                        data_fcol5.push(data.table.rows[i].c[4].v);
                                }
                            }
                        }
                        let finalData = {
                            [elem]: {
                                "title": data_fcol,
                                "content": data_fcol2,
                                "file": data_fcol3,
                                "media": data_fcol4,
                                "image": data_fcol5,
                            }
                        }
                        data_fcol = []
                        data_fcol2 = []
                        data_fcol3 = []
                        data_fcol4 = []
                        data_fcol5 = []
                        await callback(finalData);
                    })
                }
                await callback(completed_data_array)
            })
        }

        async function createKeyboards(callback) {
            fileSystemHandler.prototype.readFromStorage('bot_data', 'raw_data.json', function (result) {
                if (typeof result === "undefined")
                    console.log(cfg.errorList.undefined)
                else
                    try {
                        let d = result
                        let keyboardArray = []
                        d.resData.forEach((rawKeyboard) => {
                            if (Object.keys(rawKeyboard)[0] !== cfg.mainMenuList)
                                Object.values(rawKeyboard)[0].title.push(`${cfg.messageList.goBack}`)

                            let keyboardButtonArray = [];
                            if (Object.values(rawKeyboard)[0].title.length < cfg.keyboardCut){
                                keyboardArray.push({
                                    [Object.keys(rawKeyboard)[0]] : {
                                        parse_mode: cfg.defMessageParams.defParseMode,
                                        resize_keyboard: true,
                                        reply_markup: {
                                            keyboard: Object.values(rawKeyboard)[0].title.map(v => [{
                                                text: v
                                            }])
                                        }
                                    }
                                })
                            }else {
                                const midIndex = Math.floor(Object.values(rawKeyboard)[0].title.length / 2);
                                const firstPart = Object.values(rawKeyboard)[0].title.slice(0, midIndex);
                                const secondPart = Object.values(rawKeyboard)[0].title.slice(midIndex);
                                for (let i = 0; i < firstPart.length; i++){
                                    keyboardButtonArray.push([
                                        { text: firstPart[i].toString() }, { text: secondPart[i].toString() }
                                    ])
                                }
                                if (Object.values(rawKeyboard)[0].title.length % 2 !== 0) {
                                    let lastElement = Object.values(rawKeyboard)[0].title.slice(-1);
                                    keyboardButtonArray.push([{ text: lastElement.toString() }])
                                }
                                keyboardArray.push({
                                    [Object.keys(rawKeyboard)[0]] : {
                                        parse_mode: cfg.defMessageParams.defParseMode,
                                        resize_keyboard: true,
                                        reply_markup: {
                                            keyboard: keyboardButtonArray.map(v => v)
                                        }
                                    }
                                })
                            }
                        })
                        callback(keyboardArray)
                    }catch(e) {
                        console.log(e)
                    }
            })
        }

        async function createMessageData(callback){
            fileSystemHandler.prototype.readFromStorage('bot_data', 'raw_data.json', function (result) {
                if (typeof result === "undefined")
                    console.log(cfg.errorList.undefined)
                else
                    try {
                        let d = result
                        let messageResponseArray = []
                        d.resData.forEach((resDataElement, i) => {
                            resDataElement[Object.keys(resDataElement)[0]].title.forEach((title, index) => {
                                messageResponseArray.push({
                                    [resDataElement[Object.keys(resDataElement)[0]].title[index]] : [
                                        resDataElement[Object.keys(resDataElement)[0]].content[index],
                                        resDataElement[Object.keys(resDataElement)[0]].file[index],
                                        resDataElement[Object.keys(resDataElement)[0]].media[index],
                                        resDataElement[Object.keys(resDataElement)[0]].image[index]
                                    ]
                                })
                            })
                        })
                        callback(messageResponseArray)
                    }catch(e) {
                        console.log(e)
                    }
            })
        }

        await useNetData(function (dataToWrite) {
            const dataReady = {
                resData: dataToWrite
            }
            // latency before using fs to save data from list !important
            setTimeout(async () => {
                fileSystemHandler.prototype.writeToStorage('bot_data', dataReady, 'raw_data.json')

                await createKeyboards(function (keyboardlist) {
                    const dataReadyKb = {
                        keyboards: keyboardlist
                    }
                    setTimeout(async () => {
                        fileSystemHandler.prototype.writeToStorage('keyboard_data', dataReadyKb, 'keyboard_data.json')
                    },10000)
                })

                await createMessageData(function (msg_data) {
                    const dataReadyMsg = {
                        messages: msg_data
                    }
                    setTimeout(async () => {
                        fileSystemHandler.prototype.writeToStorage('message_data', dataReadyMsg, 'messages_data.json')
                    },15000)
                })
            },20000)
        })
    }
}

class verifyUser extends netQuery{
    async createUsersList(){
        async function getUsers(callback) {
            // users list
            await netQuery.prototype.getDataFromGoogle(cfg.listNames.users_list, cfg.authSheetID, 'Select *', function (users) {
                let usersData = { usersObject: [] }
                for (let i = 1; i < users.table.rows.length; i++) {
                    usersData.usersObject.push({
                        telegram: users.table.rows[i].c[1].v,
                        username: users.table.rows[i].c[0].v
                    })
                }
                callback(usersData)
            })
        }
        await getUsers(function (users) {
            // write list to users data folder
            setTimeout(() => {
                fileSystemHandler.prototype.writeToStorage('users_data', users, 'users_data.json')
            },2000)
        })
    }
    async createAdminsList(){
        async function getAdmins(callback) {
            await netQuery.prototype.getDataFromGoogle(cfg.listNames.admins_list, cfg.authSheetID, 'Select *', function (users) {
                let usersData = { usersObject: [] }
                for (let i = 1; i < users.table.rows.length; i++) {
                    usersData.usersObject.push({
                        telegram: users.table.rows[i].c[2].v,
                        username: users.table.rows[i].c[0].v
                    })
                }
                callback(usersData)
            })
        }
        await getAdmins(function (users) {
            setTimeout(() => {
                fileSystemHandler.prototype.writeToStorage('users_data', users, 'admins_data.json')
            },2000)
        })
    }
    async getUserData(userTelegramId, callback){ // and verify
        await fileSystemHandler.prototype.readFromStorage('users_data', 'users_data.json', function (usersObject) {
            usersObject.usersObject.forEach((element) => {
                if (userTelegramId === element.telegram)
                    callback(true)
            })            
        })
    }
    async getAdminData(userTelegramId, callback){ // and verify
        await fileSystemHandler.prototype.readFromStorage('users_data', 'admins_data.json', function (usersObject) {
            usersObject.usersObject.forEach((element) => {
                if (userTelegramId === element.telegram)
                    callback(true)
            })
        })
    }
}

class responseEngine extends verifyUser {
    async CommandResolver (msg, client) {
        telegramLogger.prototype.log(msg)

        if (msg.text === '/ref'){ //refresh data (init)
            await InitializeComponents.prototype.init()
                .then(() => setTimeout(() =>
                    client.sendMessage(msg.from.id, cfg.messageList.dataUpdated),
                    45000)) // .45 min's before send Success Message
        } else if(msg.text === '/getfiles'){ //get all files
            console.log(1)
            await client.sendMessage(msg.from.id, `${fileSystemHandler.prototype.getCustomFilesList()}`, {
                parse_mode: 'MarkdownV2',
                noforwards: true,
                silent: true,
            }).catch(async (error) => {
                await client.sendMessage(msg.from.id, cfg.errorList.fileListCreateError)
            })
        } else if(msg.text.split(' ')[0] === '/getfile'){
            let fileToReturn = msg.text.split(' ')[1]
            if (!fileToReturn)
                await client.sendMessage(msg.from.id, cfg.errorList.fileNotDefined, defaultMessageParams)
                    .catch((error) => {})
            else try {
                await client.sendDocument(msg.from.id, fileSystemHandler.prototype.getCustomFilePath(fileToReturn), defaultMessageParams)
                    .catch((error) => {})
            } catch(e) {
                await client.sendMessage(msg.from.id, cfg.errorList.fileNotFound, defaultMessageParams)
                    .catch((error) => {})
            }
        } else if(msg.text === '/getlog'){ // get latest log
            try {
                let date = new Date().toDateString()
                await client.sendDocument(msg.from.id, `${path.resolve(fileSystemHandler.prototype.getStoragePath(), `logs/log_${date.replace(' ', '_')}.txt`)}`,
                    defaultMessageParams)
                    .catch((error) => {})
            }catch (e) {
                await client.sendMessage(msg.from.id, cfg.errorList.fileNotFound)
                    .catch((error) => {})
            }
        } else if(msg.text === '/cls'){
            console.clear();
        }
    }

    async getMessageData(callback){
        await fileSystemHandler.prototype.readFromStorage('message_data', 'messages_data.json', function (result) {
            callback(result.messages) 
        })
    }

    async MessageResolver(msg, client, callback) { 
	await client.deleteMessage(msg.from.id, msg.message_id).catch((error) => {})
        telegramLogger.prototype.log(msg)
        if(msg.text === '/start' || msg.text === 'Назад'){
            await fileSystemHandler.prototype.readFromStorage('keyboard_data', 'keyboard_data.json', function (keyboardData) {
                keyboardData.keyboards.forEach((keyboardElement) => {
                    if (Object.keys(keyboardElement)[0].toLowerCase() === cfg.mainMenuList.toLowerCase()) {
                        client.sendMessage(msg.from.id, cfg.messageList.mainMenu , Object.values(keyboardElement)[0])
                            .catch((error) => {})
                            .then(() => client.deleteMessage(msg.chat.id, msg.from.message_id))
                            .catch((error) => {})
                    }
                })
            })
        } else {
            await this.getMessageData(async function (messagesArray) {
                fileSystemHandler.prototype.getCustomFilePath()
                let i = 0;
                for (const messageArr of messagesArray) {
                    if (Object.keys(messageArr)[0].toLowerCase() === msg.text.toLowerCase()) {
                        if (
                            Object.values(messageArr)[0][0].split(' ').length === 1
                            && Object.values(messageArr)[0][0].split(' ')[0].startsWith('<')
                            && Object.values(messageArr)[0][0].split(' ')[0].endsWith('>')
                        ){ // IS KEYBOARD
                            await fileSystemHandler.prototype.readFromStorage('keyboard_data', 'keyboard_data.json', function (keyboardData) {
                                for (const keyboardElement of keyboardData.keyboards) {
                                    if (Object.keys(keyboardElement)[0].toLowerCase() === Object.values(messageArr)[0][0]
                                        .toLowerCase()
                                        .replace('<', '')
                                        .replace('>','')
                                    ) {
                                        client.sendMessage(msg.from.id, msg.text, Object.values(keyboardElement)[0])
                                            .catch((error) => {})
                                        callback(true);
                                        break;
                                    }
                                }
                            })
                        } else { // 00 - content 01- file 02 - media - 03 - image
                            if (Object.values(messageArr)[0][0].split('').length > 4000){
                                const splitInHalf = arr => [
                                    arr.slice(0, Math.ceil(arr.length / 2)),
                                    arr.slice(Math.ceil(arr.length / 2))
                                ]

                                await client.sendMessage(msg.from.id, splitInHalf(Object.values(messageArr)[0][0])[0], defaultMessageParams)
                                    .catch((error) => {})

                                await client.sendMessage(msg.from.id, splitInHalf(Object.values(messageArr)[0][0])[1], defaultMessageParams)
                                    .catch((error) => {})

                                callback(true);

                            }else {
                                await client.sendMessage(msg.from.id, Object.values(messageArr)[0][0],defaultMessageParams)
                                    .catch((error) => {})
                                callback(true);
                            }
                            if (Object.values(messageArr)[0][1] !== null){
                                console.log(1)
                                let files = Object.values(messageArr)[0][1].split(',');
                                files.forEach((file) => {
                                    client.sendDocument(msg.from.id,fileSystemHandler.prototype.getCustomFilePath(file), defaultMessageParams)
                                        .catch((error) => {})
                                })
                            }
                            if (Object.values(messageArr)[0][2] !== null){
                                let files = Object.values(messageArr)[0][2].split(',');
                                files.forEach((videoFile) => {
                                    client.sendVideo(msg.from.id, videoFile, defaultMessageParams)
                                        .catch((error) => {})
                                })
                            }
                            if (Object.values(messageArr)[0][3] !== null){
                                console.log(Object.values(messageArr)[0][3])
                                let images = Object.values(messageArr)[0][3].split(',');
                                images.forEach((image) => {
                                    client.sendPhoto(msg.from.id, fileSystemHandler.prototype.getCustomFilePath(image), defaultMessageParams)
                                        .catch((error) => {})
                                })
                            }
                            break;
                        }
                    }else {
                        if (messagesArray.length === (i + 1)){
                            callback(false)
                        }
                    }
                    i++;
                }
            })
        }
    }
}

class InitializeComponents{
    async init () {
        await dataHandler.prototype.updateData();
        fileSystemHandler.prototype.initStorage()
        await verifyUser.prototype.createUsersList()
        await verifyUser.prototype.createAdminsList()
        await useSearchEngine.prototype.generateIndexes();
    }
}

class telegramMessageHandler {
    constructor(forwardMessageId) {
        this.forwardMessageId = forwardMessageId;
    }

    async msgTypeCommand(msg, cl){ //msgTypeCommand or file
        await verifyUser.prototype.getAdminData(msg.from.username, async function (userAllowed) {
            if (userAllowed === true){
                await responseEngine.prototype.CommandResolver(msg, cl, function (res) {}).catch((err) => console.log(err))
            }
        })
    }

    async msgTypeDefQuery(msg, cl){
        await verifyUser.prototype.getUserData(msg.from.username, async function (userAllowed) {
            if (userAllowed === true) {
                await responseEngine.prototype.MessageResolver(msg, cl, async function (res) {
                    if (res === false) { // result not found, try get possible values
                        await useSearchEngine.prototype.findValue(msg.text, async function (result) {
                            if (result.length > cfg.searchConfig.possibleValuesLimit) {
                                await cl.sendMessage(msg.chat.id, `${cfg.errorList.nothingFound}`)
                                    .catch((error) => {})
                            } else {
                                // inline keyboard with possible results
                                await useSearchEngine.prototype.getIndexes(result, function (values) {
                                    console.log(values) //keyboard elems
                                    cl.sendMessage(msg.from.id, cfg.messageList.possibleValues, {
                                        parse_mode: cfg.defMessageParams.defParseMode,
                                        resize_keyboard: true,
                                        reply_markup: { inline_keyboard: values.map((v) => v) }
                                    }).catch((error) => {})
                                });
                            }
                        })
                    } else {

                    }
                })
            }
        })
    }

    async gotFileByUser(msg, client) {
        await verifyUser.prototype.getAdminData(msg.from.username, async function (userAllowed) {
            if (userAllowed === true){
                if (typeof msg.video !== "undefined")
                    await client.sendMessage(msg.from.id, `${cfg.messageList.sendVideoId}: \`${msg.video.file_id}\` `,{parse_mode: 'MarkdownV2'})
                        .catch((err) => {})
                if (typeof msg.document !== "undefined"){
                    try {
                        let filepath = path.resolve(fileSystemHandler.prototype.getStoragePath(), `custom/${msg.document.file_name.toLowerCase()}`);
                        fs.writeFile(filepath, '-', {}, function () {})
                        let fileWriter = fs.createWriteStream(filepath);
                        const getReadStreamPromise = () => {
                            return new Promise((resolve, reject) => {
                                const stream = client.getFileStream(msg.document.file_id);
                                stream.on('data', (chunk) => {
                                    fileWriter.write(chunk);
                                })
                                stream.on('error', (err) => {
                                    reject(err);
                                })
                                stream.on('end', () => {
                                    client.sendMessage(msg.chat.id, `${cfg.messageList.fileSaved} ${msg.document.file_name.toLowerCase()}`)
                                        .catch(err => {})
                                    resolve();
                                })
                            })
                        }
                        await getReadStreamPromise();
                    } catch (e) {
                    }
                }
            }
        })
    }

    async gotMessageByUser (msg, client) {
        console.log(msg)
        if (!msg.text || msg.text.startsWith('/')) {
            try {
                if (msg.text === '/start')
                    await this.msgTypeDefQuery(msg, client)
                else
                    await this.msgTypeCommand(msg, client)
            }catch (e) {
                await this.msgTypeDefQuery(msg, client).catch((err) => {})
            }
        } else {
            try {
                await this.msgTypeDefQuery(msg, client)
            }catch (e) {
                console.error(cfg.errorList.undefined)
            }
        }
    }
}

module.exports = {
    telegramMessageHandler,
    verifyUser,
    InitializeComponents
}