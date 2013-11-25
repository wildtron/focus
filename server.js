var express = require('express');

var port = 80;
var app = express();

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: '7a02111d416ff52b4de9345c4185a5e9'}));
app.use(express.compress());
app.use(express.static(__dirname+'/..'), {maxAge : 86400000});

app.get('/', function (req, res) {
	res.sendfile('login.html');

});


app.listen(port);
console.log("Server listening at port: "+port);
