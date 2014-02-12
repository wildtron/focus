var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    student = require('./routes/student'),
    instructor = require('./routes/instructor');

io.set('log level', 0);

app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


app.post('/student/login', student.login);
app.post('/student/logout', student.logout);
app.get('/students', student.findAll);
app.get('/students/:id', student.findById);

app.post('/instructor/login', instructor.login);
app.get('/instructors', instructor.findAll);
app.get('/instructors/:id', instructor.findById);
app.post('/instructors', instructor.addinstructor);
app.put('/instructors/:id', instructor.updateinstructor);
app.delete('/instructors/:id', instructor.deleteinstructor);

app.get('*', function (req, res) {
    res.redirect('/index.html');
});

io.sockets.on('connection', function (socket) {
    socket.emit('start', {id : socket.id});

    socket.on('set_id', function (data) {
        student.setSocket(data.id, socket.id);
        socket.emit('chat', {message : 'SERVER : Welcome! Attendance Recorded'});
    });

    socket.on('chat', function (data) {
        student.validateSocket(data.id, socket.id, function (err, result) {
            if (result) {
                socket.emit('chat', {message : 'hi im server'});
            } else {
                socket.emit('chat', {message : 'hu u po?'});
            }
        });
    });
});


server.listen(3000);
console.log('\n\n\n\nAPI server listening on port 3000...');
