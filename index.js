var express         = require('express');
var bodyParser      = require('body-parser');
var request         = require('request');

var app = express();


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('Tihulu welcomes you!');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    }
    else {
        res.send('Invalid verify token');
    }
});

app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;

    for (i = 0; i < events.length; i++) {

        var event = events[i];

        if (event.message && event.message.text) {

            var text = event.message.text;
            var sender = event.sender.id;

            if (text.toUpperCase().includes('DOLAR') || text.toUpperCase().includes('DOLLAR')) {
                getDollar(sender);
            }

            else if (text.toUpperCase().includes('EURO')) {
                getEuro(sender);
            }

            else if (text.toUpperCase().includes('HAVA')) {

                var result = text.split(' ');
                var cityWeather = '';

                for (var i = 1; i < result.length; i++) {
                    cityWeather += result[i] + ' ';
                }

                getWeather(sender, (result[1] ? cityWeather : 'ankara'));
            }

            else if (text.toUpperCase().includes('KIMSIN SEN')) {
                sendTextMessage(sender, { text: 'Çık diyorum, çık hayatım, hastayım diyorum psikopatım diyorum.' });
            }

            else if (text.toUpperCase().includes('HI')) {
                sendTextMessage(sender, { text: 'Hi $ekerim.'});
            }

            else if (text.toUpperCase().includes('HELLO')) {
                sendTextMessage(sender, { text: 'Hello canim.'});
            }

            else if (text.toUpperCase().includes('BTC') || text.toUpperCase().includes('BITCOIN')) {
                getBTC(sender);
            }

            else if (text.toUpperCase().includes('ETH') || text.toUpperCase().includes('ETHEREUM')) {
                getEther(sender);
            }

            else {
                sendTextMessage(sender, { text: 'Komutan Logar!\nBir cisim yaklaşıyor efendim.' });
            }
        }
    }
    res.sendStatus(200);
});

function sendTextMessage(sender, messageData) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        }
        else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

function getDollar(sender) {
    request({
        url :'http://www.bloomberght.com/piyasa/intradaydata/dolar',
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error getDollar message: ', error);
        }
        else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        var data = JSON.parse(body);
        var value = data['SeriesData'][data['SeriesData'].length - 1][1];
        sendTextMessage(sender, { text: '1 $ : ' + value + ' TL' });
    });
}

function getEuro(sender) {
    request({
        url :'http://www.bloomberght.com/piyasa/intradaydata/euro',
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error getEuro message: ', error);
        }
        else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        var data = JSON.parse(body);
        var value = data['SeriesData'][data['SeriesData'].length - 1][1];
        sendTextMessage(sender, { text: '1 € : ' + value + ' TL' });
    });
}

function getWeather(sender, city) {
    request({
        url: 'http://api.apixu.com/v1/forecast.json?key=07641e9c545c4658a92180624160312&q=' + city,
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error getWeather message: ', error);
        }
        else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        var data = JSON.parse(body);

        var celc = data['current']['temp_c'];
        var fahr = data['current']['temp_f'];

        var hum = data['current']['humidity'];
        var weather = data['current']['condition']['text'];

        var results = city.toUpperCase()    + '\n'      +
                      celc                  + ' °C\n'   +
                      fahr                  + ' °F\n'   +
                      'Hum: '               + hum       + '%\n' +
                      'Condition: '         + weather   + '\n';
        sendTextMessage(sender, { text: results });
    });
}

function getBTC(sender) {
    request({
        url :'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=ETH,USD,EUR',
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error getBTC message: ', error);
        }
        else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        var data = JSON.parse(body);
        var dollarValue = data['USD'] + ' $';
        var euroValue = data['EUR'] + ' €';
        var ethValue = data['ETH'] + ' Ξ';
        sendTextMessage(sender, { text: '1 Bitcoin : ' + dollarValue + '\n' + '1 Bitcoin : ' + euroValue + '\n' + '1 Bitcoin : ' + ethValue});
    });
}

function getEther(sender) {
    request({
        url :'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR',
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error getEther message: ', error);
        }
        else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        var data = JSON.parse(body);
        var dollarValue = data['USD'] + ' $';
        var euroValue = data['EUR'] + ' €';
        var btcValue = data['BTC'] + ' ฿';
        sendTextMessage(sender, { text: '1 Ethereum : ' + dollarValue + '\n' + '1 Ethereum : ' + euroValue + '\n' + '1 Ethereum : ' + btcValue});
    });
}

