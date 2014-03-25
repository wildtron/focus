var http = require('http'),
	connect = require('connect'),
	app = connect()
    .use(function (req, res, next) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
		next();
	})
    .use(connect.static(__dirname + '/public'));

http.createServer(app).listen(8081);
