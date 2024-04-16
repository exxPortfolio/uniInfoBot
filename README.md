# uniInfoBot
telegram bot for quick access to information using googleSheets

Check master branch \n

Usage: <br>
  Config:<br>
    bot_api_key: Api key of your bot (get it from BotFather)<br>
    dataFolders => String[] : array of folder names // dont change it<br>
    keyboardCut => Int : count of buttons if buttons more than it keyboard will be splited<br>
    defApiSheetName => String : Name of default sheet<br>
    mainMenuList => String : Name of menu sheet<br>
    dataSheetID => String : ID of google sheet contains data for tgBot<br>
    authSheetID => String : ID of google sheet contains users aval to use tgBot<br>
    listNames => Object : Lists uses for auth needs<br>
    errorList => Object : Errors texts<br>
    defMessageParams => Object : telegramMessage params [<br>
      disableSave: if true users aren't free to save/copy message content screenshots aren't available too<br>
      disableForwards: if true users aren't free to forward messages<br>
      sendNotify: if true users will receive tg notify about bot response<br>
      defParseMode => HTML | Markdown | MarkdownV2 : message parse method **for more info find desc below**<br>
    ]<br>
    messageList => Object : Messages list<br>
    searchConfig => Object : possibleValuesLimit => Int : Limit of possible values for search sys, if possVals more than it result of possVals will be undefined<br>
    renderConfig => Object : renderSheetName => String: name of googleList contains all another sheets you want to use<br>
    <br>
  GoogleSheets:<br>
    1. Create a sheet book <br>
    2. Create two sheet with names like : RenderList and MenuList<br>
    3. Render list "A" Collumn must contains all another sheets you want to use, write only names like : MenuList<br>
    4. Render list "B" Collumn you can use for description of every list<br>
    Usefull info:<br>
      Any googleSheet have five collumns A..E<br>
      Collumn A: Name of button<br>
      Collumn B: Content to show by click on button<br>
      Collumn C: File to send when button clicked 'FileName'<br>
      Collumn D: Video to send when button clicked 'VideoID' // id can be gotten by sending video to bot<br>
      Collumn E: Image to send when clicked 'ImageName (like file)' // SENDS IMAGE _AFTER_ Message text or except text<br>
  
