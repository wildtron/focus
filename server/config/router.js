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

        socket.on('s_join_room', function (access_token) {
			var _student,
				getCurrentSubject = function (err, item) {
				if (err) console.dir('this should not exist', err);
				if (item) {
					_student = item;
					_student.socket_id = socket.id;
					logger.log('socket', 's_join | student : ', item);
					student._getCurrentSubject(item._id, getInstructor);
				}
				else {
					socket.emit('warning', 'Invalid access token');
				}
			},
			getInstructor = function (err, item) {
				if (err) console.dir('this should not exist', err);
				if (item) {
					logger.log('socket', 's_join | section : ', item);
					section._getSectionInstructor(item._id, joinRoom);
				}
				else {
					socket.emit('warning', 'You have no current subject');
				}
			},
			joinRoom = function (err, item) {
				if (err) console.dir('this should not exist', err);
				if (item) {
					logger.log('socket', 's_join | instructor : ', item);
					if (rooms[_student._id + item._id] && rooms[_student._id + item._id].student) {
						socket.emit('warning', 'Someone is already connected. wtf o.O');
					} else if (rooms[_student._id + item._id]) {
						room[_student._id + item._id].student = socket.id;
						socket.join(_student._id + item._id);
						socket.broadcast.to(_student._id + item._id).emit('online', _student);
					} else {
						room[_student._id + item._id] = {
							student : socket.id,
							instructor : null
						};
						socket.join(_student._id + item._id);
						socket.broadcast.to(_student._id + item._id).emit('online', _student);
					}
				}
				else {
					socket.emit('warning', 'Section instructor is missing o.O');
				}
			};
            if (access_token) {
				student._findByAccessToken(access_token, getCurrentSubject);
            }
            else {
                socket.emit('warning', 'access_token is missing');
            }
        });

        socket.on('i_join_room', function (access_token) {
			var _instructor,
				getCurrentSubject = function (err, item) {
				if (err) console.dir('this should not exist', err);
				if (item) {
					_student = item;
					_student.socket_id = socket.id;
					logger.log('socket', 's_join | student : ', item);
					student._getCurrentSubject(item._id, getInstructor);
				}
				else {
					socket.emit('warning', 'Invalid access token');
				}
			},
			getInstructor = function (err, item) {
				if (err) console.dir('this should not exist', err);
				if (item) {
					logger.log('socket', 's_join | section : ', item);
					section._getSectionInstructor(item._id, joinRoom);
				}
				else {
					socket.emit('warning', 'You have no current subject');
				}
			},
			joinRoom = function (err, item) {
				if (err) console.dir('this should not exist', err);
				if (item) {
					logger.log('socket', 's_join | instructor : ', item);
					if (rooms[_student._id + item._id] && rooms[_student._id + item._id].student) {
						socket.emit('warning', 'Someone is already connected. wtf o.O');
					} else if (rooms[_student._id + item._id]) {
						room[_student._id + item._id].student = socket.id;
						socket.join(_student._id + item._id);
						socket.broadcast.to(_student._id + item._id).emit('online', _student);
					} else {
						room[_student._id + item._id] = {
							student : socket.id,
							instructor : null
						};
						socket.join(_student._id + item._id);
						socket.broadcast.to(_student._id + item._id).emit('online', _student);
					}
				}
				else {
					socket.emit('warning', 'Section instructor is missing o.O');
				}
			};
            if (access_token) {
				instructor._findByAccessToken(access_token, getCurrentSubject);
            }
            else {
                socket.emit('warning', 'access_token is missing');
            }
        });

		socket.on('get_history', function (data) {
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

