var http = require('http'),
	connect = require('connect'),
	app = connect()
    .use(connect.static(__dirname + '/public'))
    .use(function(req, res){
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
		res.end('hello world\n');
	});

http.createServer(app).listen(8081);
