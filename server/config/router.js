var db = require(__dirname + '/database'),
    logger = require(__dirname + '/../lib/logger'),
    TolerableError = require(__dirname + '/../lib/tolerable_error'),
    section = require(__dirname + '/../controllers/section'),
    student = require(__dirname + '/../controllers/student'),
    instructor = require(__dirname + '/../controllers/instructor');

// imports
db.addImport(section.collectionName);
db.addImport(instructor.collectionName);
if (process.env['NODE_ENV'] === 'testing') {
	db.addImport(student.collectionName);
}

exports.setup = function (app) {
    app.post('/student/login', student.login);
    app.post('/student/logout', student.logout);
    app.post('/student/submit', student.submit);
    app.post('/student/findByAccessToken', student.findByAccessToken);
    app.get('/students', student.findAll);

    app.post('/instructor/login', instructor.login);
    app.post('/instructor/logout', instructor.logout);
    app.get('/instructors', instructor.findAll);

    app.get('/section/getStudents', section.getStudents);

    app.get('*', function (req, res) {
        res.redirect('/index.html');
    });

    // error handling
    app.use(function (err, req, res, next) {
        logger.log('warn', err.message);
		console.dir(err);
        res.send(400, {message : err.message});
        return;
    });

	logger.log('verbose', 'done setting up router');
};

exports.handleSocket = function (io) {
    io.set('log level', 0);

    io.sockets.on('connection', function (socket) {
        socket.on('create_rooms', function (data) {
            if (data.students instanceof Array) {
                var i = data.students.length;
                while (i--) {
                    socket.join(data.students[i]);
                }
            }
            else {
                socket.emit('warning', 'students missing');
            }
        });

        socket.on('join_room', function (data) {
            if (data.student_number) {
                socket.join(data.student_number);
                socket.broadcast.to(data.student_number).emit('online', data.student_number);
                socket.emit('warning', 'attendance recorded');
            }
            else {
                socket.emit('warning', 'student_number missing');
            }
        });

        socket.on('update_chat', function (data) {
            if (data.student_number && data.message) {
                socket.broadcast.to(data.student_number).emit('update_chat', data.message, data.student_number);
            }
            else if (data.student_number){
                socket.emit('warning', 'message is missing');
            }
            else {
                socket.emit('warning', 'student_number missing');
            }
        });

        socket.on('disconnect', function () {
            var rooms = io.sockets.manager.roomClients[socket.id],
                room;

            for (room in rooms) {
                if (room && rooms[room]) {
                    room = room.replace('/','');
                    socket.leave(room);
                }
            }
        });
    });

    logger.log('verbose', 'done handling socket');
};

