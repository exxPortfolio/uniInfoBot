# uniInfoBot
telegram bot for quick access to information using googleSheets

Check master branch \n

## Usage: <br>
  ### Config:<br>
    1. bot_api_key: Api key of your bot (get it from BotFather)
    2. dataFolders => String[] : array of folder names // dont change it
    3. keyboardCut => Int : count of buttons if buttons more than it keyboard will be splited
    4. defApiSheetName => String : Name of default sheet
    5. mainMenuList => String : Name of menu sheet
    6. dataSheetID => String : ID of google sheet contains data for tgBot
    7. authSheetID => String : ID of google sheet contains users aval to use tgBot
    8. listNames => Object : Lists uses for auth needs
    9. errorList => Object : Errors texts
    10. defMessageParams => Object : telegramMessage params {
      10.1. disableSave: if true users are not free to save/copy message content screenshots are not available too
      10.2. disableForwards: if true users are not free to forward messages
      10.3. sendNotify: if true users will receive tg notify about bot response
      10.4. defParseMode => HTML | Markdown | MarkdownV2 : message parse method for more info find desc below
    }
    11. messageList => Object : Messages list
    12. searchConfig => Object : possibleValuesLimit => Int : Limit of possible values for search sys,
       if possVals more than it result of possVals will be undefined
    13. renderConfig => Object : renderSheetName => String: name of googleList contains all another sheets you want to use
  ### GoogleSheets:<br>
  **DataList** <br>
    1. Create a sheet book <br>
    2. Create two sheet with names like : RenderList and MenuList<br>
    3. Render list "A" Collumn must contains all another sheets you want to use, write only names like : MenuList<br>
    4. Render list "B" Collumn you can use for description of every list<br>
    5. Create second sheet book
    6. Create a list names like usersList
    7. Create a list names like adminsList
    Usefull info:<br>
      Any googleSheet have five collumns A..E<br>
      Collumn A: Name of button<br>
      Collumn B: Content to show by click on button<br>
      Collumn C: File to send when button clicked 'FileName'<br>
      Collumn D: Video to send when button clicked 'VideoID' // id can be gotten by sending video to bot<br>
      Collumn E: Image to send when clicked 'ImageName (like file)' // SENDS IMAGE _AFTER_ Message text or except text<br>

  **AuthList**<br>
    1. Create sheet book<br>
    2. Create a list names like usersList<br>
    3. Create a list names like adminsList<br>
    UsefullInfo: <br>
      Collumn A: Name of user "Name Surname"<br>
      Collumn B: User telegram name like @piurg without '@' char<br>

### TelegramBotCommands
  User must be admin to use any of it
  Name | Result
  ----- | -----
  `/ref` | Update all info like users, admins , data lists
  `/getlot` | Get log file
  `/getfile FILE_NAME` | Get file by name
  `/getfiles` | Get full files list
  `/cls` | Clear console

### TelegramBotInit
  1. Pull this repo
  2. Using bash type:
```bash
npm i

node index.js
```
  
