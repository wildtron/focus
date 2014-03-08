var express = require('express'),
    app = express(),
    fs = require('fs'),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    util = require(__dirname + '/helpers/util'),
    logger = require(__dirname + '/lib/logger'),
    db = require(__dirname + '/config/database'),
    router = require(__dirname + '/config/router'),
    config = require(__dirname + '/config/config').config,
	bootstrap = function (err) {
		var logFile;
		if(err) throw err;
		logger.log('info', 'initializing FOCUS...');
		if (process.env['NODE_ENV'] !== 'testing') {
			logFile = fs.createWriteStream(__dirname + '/logs/' + new Date().toJSON().substring(0, 10) + '.log', {flags: 'a'});
			app.use(express.logger({stream : logFile}));
		}
		app.use(express.compress());
		app.use(express.limit('25mb'));
		app.use(express.bodyParser({uploadDir : __dirname + '/temp'}));
		app.use(express.methodOverride());
		app.use(express.cookieParser(config.COOKIE_SECRET));
		app.use(express.static(__dirname + '/public'));
		app.use(function (req, res, next) {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
			res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
			res.setHeader('Access-Control-Allow-Credentials', true);
			db.setOnConnect(next);
		});
		app.use(app.router);

		logger.log('verbose', 'setting up router');
		router.setup(app);
		logger.log('verbose', 'handling sockets');
		router.handleSocket(io);
	};

if (!process.env['NODE_ENV']) {
	process.env['NODE_ENV'] = 'development';
}

console.log('NODE_ENV', process.env['NODE_ENV']);

if (process.env['NODE_ENV'] === 'testing') {
	util.mkdir(__dirname + '/temp', bootstrap);
}
else {
	util.mkdir(__dirname + '/temp', function () {
		util.mkdir(__dirname + '/logs', bootstrap);
	});
}

server.listen(config.port);
logger.log('info', 'Server listening on port : ', config.port);

module.exports = app;
