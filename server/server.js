if (!process.env['NODE_ENV']) {	// if env is not set, make it development
	process.env['NODE_ENV'] = 'development';
}

var express = require('express'),
    app = express(),
    fs = require('fs'),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    util = require(__dirname + '/helpers/util'),
    logger = require(__dirname + '/lib/logger'),
    db = require(__dirname + '/config/database'),
    router = require(__dirname + '/config/router'),
    config = require(__dirname + '/config/config').config;


logger.log('info', 'initializing FOCUS. ENV = ', process.env['NODE_ENV']);

if (process.env['NODE_ENV'] !== 'testing') {	// don't log on file if testing
	app.use(express.logger({
		stream : fs.createWriteStream(config.logs_dir + new Date().toJSON().substring(0, 10) + '.log', {flags: 'a'})}
	));
}

app.disable('x-powered-by');
app.use(express.bodyParser({uploadDir : config.temp_dir}));
app.use(express.compress());
app.use(express.limit(config.upload_file_limit));
app.use(express.methodOverride());
app.use(express.cookieParser(config.COOKIE_SECRET));
app.use(express.static(config.public_dir));
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
	res.setHeader('Access-Control-Allow-Credentials', true);
	db.setOnConnect(next);
});
app.use(app.router);

logger.log('verbose', 'setting up router');
router.setup(app);
logger.log('verbose', 'handling sockets');
router.handleSocket(io);

server.listen(config.port);
logger.log('info', 'Server listening on port : ', config.port);

module.exports = app;
