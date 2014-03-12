var db = require(__dirname + '/database'),
    logger = require(__dirname + '/../lib/logger'),
    util = require(__dirname + '/../helpers/util'),
    TolerableError = require(__dirname + '/../lib/tolerable_error'),
    section = require(__dirname + '/../controllers/section'),
    student = require(__dirname + '/../controllers/student'),
    instructor = require(__dirname + '/../controllers/instructor');

// imports
if (process.env['NODE_ENV'] === 'testing') {
	db.addImport(student.collectionName);
	db.addImport(section.collectionName);
	db.addImport(instructor.collectionName);
}

exports.setup = function (app) {
    app.post('/student/login', student.login);
    app.post('/student/logout', student.logout);
    app.post('/student/submit', student.submit);
    app.get('/student/getFile', student.getFile);
    app.post('/student/findByAccessToken', student.findByAccessToken);
    app.post('/student/log', student.log);

    app.post('/instructor/login', instructor.login);
    app.post('/instructor/logout', instructor.logout);
    app.get('/instructor/getLogs', instructor.getLogs);

    app.get('/section/getStudentsWithFiles', section.getStudentsWithFiles);

    app.get('*', function (req, res) {
        res.redirect('/index.html');
    });

    // error handling
    app.use(function (err, req, res, next) {
        logger.log('warn', err.message);
        res.send(err.code || 400, {message : err.message});
        return;
    });

	logger.log('verbose', 'done setting up router');
};

exports.handleSocket = function (io) {
	var rooms = {},
		getRoomBySocketId = function (id) {
			var room;
			for (iroom in rooms)
				if (~room.sockets.indexOf(id))
					return room;
			return false;
		};
    io.set('log level', 0);

    io.sockets.on('connection', function (socket) {

        socket.on('join_room', function (data) {
			data = util.chk_rqd(['identifier', 'instructor', 'student_number'], data);
            if (data) {
                if (!rooms[data.student_number + data.instructor]) {
					rooms[data.student_number + data.instructor] = {
						student_number : data.student_number,
						instructor : data.instructor,
						connected : 0,
						sockets : []
					};
				}
				else if (rooms[data.student_number + data.instructor].connected === 2) {
					return socket.emit('warning', 'who are you? o.O');
				}
				rooms[data.student_number + data.instructor].sockets.push(socket.id);
				rooms[data.student_number + data.instructor].connected++;
				socket.join(data.student_number + data.instructor);
                socket.broadcast.to(data.student_number + data.instructor).emit('online', data);
            }
            else {
                socket.emit('warning', 'incomplete data on join_room');
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
					room = getRoomBySocketId(socket.id);
					socket.broadcast.to(Object.keys(room)[0]).emit('disconnect', data);
                }
            }
        });
    });

    logger.log('verbose', 'done handling socket');
};

