var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    config = require(__dirname + '/config/config').config,
    routes = require(__dirname + '/config/routes');

app.use(express.errorHandler());
app.use(express.cookieParser(config.COOKIE_SECRET));
app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

routes.use(app);

server.listen(config.port);
console.log('API server listening on port ' + config.port + '...');
