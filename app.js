var express = require('express');
var app = express();

var iMessage = require('osa-imessage');

var port = process.env.PORT || 5677;

app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({ extended: true }));

app.get('/', function(req, res) {
    res.end('Hello World');
});

app.post('/send', function(req, res){
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

app.listen(port);

console.log('Server started on port: ' + port);
