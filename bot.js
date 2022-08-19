const TelegramBot = require('node-telegram-bot-api');

const token = '';

const bot = new TelegramBot(token, {polling: true});

const gauntletLaunched = '#запусклабы';
const timeout_1_hour = 3600000;
const usersDayMap = new Map();
const usersMonthMap = new Map();
const helpersDayMap = new Map();
const helpersMonthMap = new Map();
const launchersDayMap = new Map();
const launchersMonthMap = new Map();
let launchCounter = 0;

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const message = msg.text.toString().toLowerCase();
    const username = msg.from.username;
    const unique = (value, index, self) => {
        return self.indexOf(value) === index
    }

    console.log('111 got message: ' , message);

    let postponeMsg = false;
    let customTimeout = false;

    if (message === '#бот') {
        bot.sendMessage(chatId,
            'Это бот, созданный для королевства Hammerfell. \n' +
            'Команды: \n' +
            '#запусклабы - запускает таймер на 1 час \n' +
            '#кд х - запускает таймер на х минут \n' +
            '@ник_игрока #лаба - пингует игроков, не прошедших лабу \n' +
            '#статистика_пингов - показывает месячную статистику игроков, КОТОРЫХ пинговали, и количество самих пингов (обновляется 1 числа каждого месяца) \n' +
            '#статистика_проверок - показывает игроков, КОТОРЫЕ пинговали, и количество их пингов за месяц \n' +
            '#статистика_запусков - показывает игроков, которые запускали лабы и количество их запусков за месяц',
            {reply_to_message_id: msg.message_id}
        );
        stats();
    }

    function getStats(statsMap) {
        const map = new Map([...statsMap.entries()].sort((a, b) => b[1] - a[1]));
        if (map.size > 0) {
            let userList = JSON.stringify(Object.fromEntries(map));
            let str = 'Статистика пингов: \n\n' + userList.split(',').join(' пинг(ов) \n') + ' пинг(ов)';
            bot.sendMessage(chatId, str.replace(/"([^"]+)":/g, '$1:').replace(/[\]}[{]/g, ''));
        } else {
            bot.sendMessage(chatId, 'Статистики по пингам пока нет, она появится после того, как пинганут хотя бы одного игрока.');
        }
    }

    function getHelpers(helpersMap) {
        const map = new Map([...helpersMap.entries()].sort((a, b) => b[1] - a[1]));
        if (map.size > 0) {
            let userList = JSON.stringify(Object.fromEntries(map));
            let str = 'Статистика проверок: \n\n' + userList.split(',').join(' раз(а) пинговал других \n') + ' раз(а) пинговал других';
            bot.sendMessage(chatId, str.replace(/"([^"]+)":/g, '$1:').replace(/[\]}[{]/g, ''));
        } else {
            bot.sendMessage(chatId, 'Статистики по проверкам игроков пока нет.');
        }
    }

    function getLaunchers(launchersMap) {
        const map = new Map([...launchersMap.entries()].sort((a, b) => b[1] - a[1]));
        if (map.size > 0) {
            let userList = JSON.stringify(Object.fromEntries(map));
            let str = 'Статистика запусков: \n\n' + userList.split(',').join(' раз(а) запускал лабу \n') + ' раз(а) запускал лабу \n\n';
            if (launchersMap === launchersDayMap) {
                str += launchCounter >= 10 ? 'За прошедшие сутки было пройдено ' + launchCounter + ' лаб! Отлично!'
                    : 'За прошедшие сутки было пройдено всего ' + launchCounter + ' лаб. Нужно поднажать!';
            }
            bot.sendMessage(chatId, str.replace(/"([^"]+)":/g, '$1:').replace(/[\]}[{]/g, ''));
        } else {
            bot.sendMessage(chatId, 'Статистики по запускам пока нет, она появится после первого запуска лабы.');
        }
    }

    function stats() {
        (function loop() {
            let date = new Date();
            if (date.getHours() === 8 && date.getMinutes() === 0) {
                if (date.getDate() === 1) {
                    statMsg(usersMonthMap, helpersMonthMap, launchersMonthMap);
                    usersDayMap.clear();
                    helpersDayMap.clear();
                    launchersDayMap.clear();
                    bot.sendMessage(chatId, 'Статистика по лабам за месяц была сброшена.');
                } else {
                    statMsg(usersDayMap, helpersDayMap, launchersDayMap);
                }
            }
            date = new Date();
            const delay = 60000 - (date % 60000);
            setTimeout(loop, delay);
        })();
    }

    function statMsg(usersMap, helpersMap, launchersMap) {
        getStats(usersMap);
        getHelpers(helpersMap);
        getLaunchers(launchersMap);
        launchCounter = 0;
        usersMap.clear();
        helpersMap.clear();
        launchersMap.clear();
    }

    if (message === '#статистика_пингов') {
        getStats(usersMonthMap);
    }

    if (message === '#статистика_проверок') {
        getHelpers(helpersMonthMap);
    }

    if (message === '#статистика_запусков') {
        getLaunchers(launchersMonthMap);
    }

    function addToMap(dayMap, monthMap) {
        let user = '@' + username.toLowerCase();
        dayMap.has(user) ? dayMap.set(user, dayMap.get(user) + 1) : dayMap.set(user, 1);
        monthMap.has(user) ? monthMap.set(user, monthMap.get(user) + 1) : monthMap.set(user, 1);
    }

    if (message.endsWith('#лаба') || message.startsWith('#лаба ')) {
        let usersArray = message.split(" ");
        usersArray = usersArray.filter((u) => {return u !== "#лаба"}).filter(unique);
        usersArray.forEach(user => {
            usersMonthMap.has(user) ? usersMonthMap.set(user, usersMonthMap.get(user) + 1) : usersMonthMap.set(user, 1);
        });
        usersArray.forEach(user => {
            usersDayMap.has(user) ? usersDayMap.set(user, usersDayMap.get(user) + 1) : usersDayMap.set(user, 1);
        });
        addToMap(helpersDayMap, helpersMonthMap);
    }

    if (message.startsWith('#кд ')) {
        customTimeout = Number(message.replace('#кд ','')) * 60000;
        console.log(`customTimeout: ${customTimeout/60000}`)
        postponeMsg = true;
    }

    if (gauntletLaunched === message) {
        postponeMsg = true;
    }

    if (postponeMsg) {
        let finalTimeout = customTimeout ? customTimeout : timeout_1_hour;
        addToMap(launchersDayMap, launchersMonthMap);
        launchCounter++;
        bot.sendMessage(chatId, `Таймер кд запущен на ${finalTimeout/60000} min. \n` +
            'Это ' + launchCounter + ' лаба за сегодня.', {reply_to_message_id: msg.message_id});
        setTimeout(function(){
            bot.sendMessage(chatId,
                '#кд_лабы_прошел Ну-ка все дружно зашли, чекнули лабу, запустили новую и закрыли этаж!',
                {reply_to_message_id: msg.message_id});
        }, finalTimeout);
    }
});

bot.on("polling_error", console.log);