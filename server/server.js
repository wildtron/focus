var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    student = require('./routes/student'),
    instructor = require('./routes/instructor');

io.set('log level', 0);

app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));

app.post('/student/login', student.login);
app.get('/students', student.findAll);
app.get('/students/:id', student.findById);
app.post('/students', student.addstudent);
app.put('/students/:id', student.updatestudent);
app.delete('/students/:id', student.deletestudent);

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
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});


server.listen(3000);
console.log('API server listening on port 3000...');
