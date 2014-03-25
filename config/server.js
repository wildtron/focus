var http = require('http'),
	connect = require('connect'),
	app = connect().use(connect.static(__dirname + '/public'));

http.createServer(app).listen(8081);
