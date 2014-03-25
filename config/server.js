var connect = require('connect');

connect.createServer(
	function (req, res, next) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
		next();
	},
	connect.static(__dirname + '/public')
).listen(8081);
