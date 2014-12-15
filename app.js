var express = require('express');
var app = express();

var sse = require('connect-sse')();

var iMessage = require('osa-imessage');
var Contacts = require('osa-contacts');

var iconutil = require('iconutil');

var messageEvents;

var port = process.env.PORT || 5677;

var password = process.env.PASSWORD || 'password';

app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({ extended: true }));

app.use(express.static(__dirname + '/static'));

var icon;
iconutil.toIconset('/Applications/Messages.app/Contents/Resources/Messages.icns', function(err, icons) {
    if(err)
        return;
    icon = icons['icon_32x32.png'];
});
app.get('/icon.png', function(req, res) {
    if(!icon) {
        res.statusCode = 404;
        res.end();
    }

    res.set('Content-Type', 'image/jpeg');
    res.statusCode = 200;
    res.end(icon);
});

app.get('/profile.jpg', function(req, res) {
    var name = req.query.name;

    Contacts.getContacts({ name: name }, function(err, data) {
        if(err) {
            res.statusCode = 500;
            res.json(err);
            return;
        }

        if(data.length == 0) {
            res.statusCode = 404;
            res.end();
            return;
        }

        res.statusCode = 200;

        Contacts.getPicture(data[0], true, function(err, data) {
            if(err)
                res.statusCode = 404;
            else
                res.statusCode = 200;
            res.set('Content-Type', 'image/jpeg');

            res.end(data);
        });
    });
});

var checkAuth = function(req, res, next) {
    if(req.headers.authentication == password) {
        next();
    } else {
        res.statusCode = 403;
        res.json({ auth: false });
    }
};

app.get('/auth', checkAuth, function(req, res) {
    res.statusCode = 200;
    res.json({ auth: true });
});

app.post('/send', checkAuth, function(req, res){
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

app.get('/receive', checkAuth, sse, function(req, res) {
    messageEvents.on('received', function(data){
        res.json(data);
    });
});

app.listen(port);

messageEvents = iMessage.listen();
messageEvents.setMaxListeners(Infinity);

console.log('Server started on port: ' + port);
