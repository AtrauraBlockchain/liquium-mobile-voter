var express = require('express');
var app = express();
var port = 8080;

var ethConnector = require('ethconnector');
var liquiumRT = require('../contracts/js/liquium_rt.js');


app.all('*', function(req, res, next) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    next();
});

app.get('/api/organization/:idOrganization/polls', function (req, res, next) {
    liquiumRT.getPolls(req.params.idOrganization, function(err, polls) {
        if (err) return next(err);
        res.json(polls);
    });
});

api.post('/api/organizations', function(req, res, next) {
    liquiumRT.deployOrganization({}, function(err, organization) {
        if (err) return next(err);
        res.json({ organizationAddr: organization.address });
    });
});

api.post('/api/organization/:idOrganization/polls', function(req, res, next) {

});

app.get('*', function(req, res) {
    res.end('404');
});

var server;

ethConnector.init('rpc' ,{gasLimit: 4700000},function(err) {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {
        server = app.listen(port, function() {
            var port = server.address().port;
            console.log('server listening at http://localhost:' + port.toString());
        });
    }
});
