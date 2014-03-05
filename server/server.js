var express = require('express'),
    app = express(),
    fs = require('fs'),
    logger = require(__dirname + '/lib/logger').logger,
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    router = require(__dirname + '/config/router'),
    config = require(__dirname + '/config/config').config,
    logFile = fs.createWriteStream(__dirname + '/logs/' + new Date().toJSON().substring(0, 10) + '.log', {flags: 'a'});

logger.log('info', 'initializing FOCUS...');
app.use(express.logger({stream : logFile}));
app.use(express.compress());
app.use(express.methodOverride());
app.use(express.limit('25M'));
app.use(express.bodyParser({uploadDir: __dirname + '/temp'}));
app.use(express.errorHandler());
app.use(express.cookieParser(config.COOKIE_SECRET));
app.use(express.static(__dirname + '/public'));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

logger.log('verbose', 'setting up router');
router.setup(app);
logger.log('verbose', 'handling sockets');
router.handleSocket(io);

server.listen(config.port);
logger.log('info', 'Server listening on port : ', config.port);

