var express = require('express');
var app = express();

var sse = require('connect-sse')();

var iMessage = require('osa-imessage');

var messageEvents;

var port = process.env.PORT || 5677;

app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({ extended: true }));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authentication");
    next();
});

app.use(express.static(__dirname + '/static'));

app.get('/auth', function(req, res) {
    // TODO: Test if the Authentication header is correct
});

app.post('/send', function(req, res){
    // TODO: Test if the Authentication header is correct

    var to = req.body.to;
    var message = req.body.message;

    iMessage.send(message, to, function(err, data) {
        if(err) {
            res.statusCode = 500;
            res.json({
                success: false
            });
        } else {
            res.statusCode = 200;
            res.json({
                success: true,
                to: data
            });
        }
    });
});

app.get('/receive', sse, function(req, res) {
    messageEvents.on('received', function(data){
        res.json(data);
    });
});

app.listen(port);

messageEvents = iMessage.listen();
messageEvents.setMaxListeners(Infinity);

console.log('Server started on port: ' + port);
