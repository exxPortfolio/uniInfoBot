const path = require("path");
const cfg = require("../configuration.json");
const fs = require("fs");

class fileSystemHandler{
    getStoragePath () {
        return path.resolve(__dirname)
    }
    initStorage() {
        let storageFilesFolders = cfg.dataFolders;
        storageFilesFolders.forEach((fileFolder, i) => {
            fs.mkdir(path.resolve(this.getStoragePath(), fileFolder), {
                recursive: true
            }, function (err, path) {
                if (err)
                    console.log(err)
                else
                    console.log(`path ${path} created as ${i} item`)
            })
        })
    }
    writeToStorage(dataType, dataContent, fileName) {
        try{
            console.log(path.resolve(this.getStoragePath(), dataType, `${fileName}`))
            fs.writeFile(path.resolve(this.getStoragePath(), dataType, `${fileName}`), JSON.stringify(dataContent) , function () {

            })
        }catch (e) {
            console.log(e)
        }
    }
    appendInStorage(dataType,fileData, fileName){
        try {
            fs.appendFile(path.resolve(this.getStoragePath(), dataType, `${fileName}`), fileData , function () {

            })
        }catch (e) {
            console.log(e)
        }
    }
    readFromStorage(dataType, fileName, callback){
        try {
            fs.readFile(path.resolve(this.getStoragePath(), dataType, `${fileName}`), function (err,data) {
                if (err)
                    console.log(err)
                else try{
                    callback(JSON.parse(data.toString())) // error
                }catch(e){

                }
            })
        }catch (e) {
            console.log(e)
        }
    }
    getCustomFilePath (data) {
        return path.resolve(this.getStoragePath(), `custom/${data}`)
    }
    getCustomFilesList () {
        const files = () => fs.readdirSync(path.resolve(this.getStoragePath(), `custom`)).map(file => `\`${file.replace(',', '')}\` \n`);
        return files();
    }
}

module.exports = fileSystemHandler;