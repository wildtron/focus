var http = require('http'),
	connect = require('connect'),
	app = connect()
	.use(function (req, res, next) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, PUT');
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept')
		if (req.method === 'OPTIONS') {
			res.end();
		}
		else {
			next();
		}
	})
	.use(connect.static(__dirname + '/public'));

http.createServer(app).listen(8080, function () {
	console.log('Config server is now running at port 8080');
});
