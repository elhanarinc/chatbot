var express = require('express');
var bodyParser = require('body-parser');
var request = require("request");
var app = express();

const JSONbig = require('json-bigint')

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.text({ type: 'application/json' }))
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

app.post('/webhook/', function (req, res) {
    var data = JSONbig.parse(req.body);
    var event = data.entry[0].messaging[0];
    var sender = event.sender.id.toString();

    if (event.message && event.message.text) {
        var text = event.message.text;
        if (text.toUpperCase().includes('DOLAR')) {
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
            getWeather(sender, (result[1] ? cityWeather: 'ankara'));
        }
        else if (text.toUpperCase().includes('KIMSIN SEN')) {
            sendTextMessage(sender, { text: 'Çık diyorum, çık hayatım, hastayım diyorum psikopatım diyorum.' });
        }
        else {
            sendTextMessage(sender, { text: 'Komutan Logar!\nBir cisim yaklaşıyor efendim.' });
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

        var results = city.toUpperCase() + '\n' +
                      celc + ' °C\n' +
                      fahr + ' °F\n' +
                      'Hum: ' + hum + '%\n' +
                      'Condition: ' + weather + '\n';
        sendTextMessage(sender, { text: results });
    });
}
