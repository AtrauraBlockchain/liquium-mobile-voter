var express = require('express');
var app = express();
var port = 8080;

var polls = require('./polls/pollsmock.js');


app.all('*', function(req, res, next) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    next();
});

app.get('/api/polls', function (req, res) {
    res.end(polls.generatePollsJson());
});

app.get('*', function(req, res) {
    res.end('404');
});

var server = app.listen(port, function() {
    var port = server.address().port;
    console.log('server listening at http://localhost:' + port.toString());
});
