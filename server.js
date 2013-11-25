var express = require('express');

var port = 80;
var app = express();

app.use(express.bodyParser());
app.use(express.compress());
app.use(express.static(__dirname+'/..'), {maxAge : 86400000});

app.get('/', function (req, res) {
	res.sendfile('login.html');

});


app.listen(port);
console.log("Server listening at port: "+port);
