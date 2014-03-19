var db = require(__dirname + '/database'),
    logger = require(__dirname + '/../lib/logger'),
    config = require(__dirname + '/config').config,
    util = require(__dirname + '/../helpers/util'),
    section = require(__dirname + '/../controllers/section'),
    student = require(__dirname + '/../controllers/student'),
    instructor = require(__dirname + '/../controllers/instructor');

// imports
if (process.env['NODE_ENV'] === 'testing') {
	db.addImport(student.collectionName);
	db.addImport(instructor.collectionName);
}
db.addImport(section.collectionName);

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
    app.get('/section/getAttendance', section.getAttendance);

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
		getRoomBySocketId = function (id, student_number) {
			var room;
			for (room in rooms) {
				room = rooms[room];
				if (student_number) {
					if (room.instructor === id && room.student_id === student_number)
						return room;
				} else if (room.student === id || room.instructor === id) {
					return room;
				}
			}
			return false;
		},
		isFromStudent = function (room, id) {
			return (room.student === id);
		};
    io.set('log level', 0);

    io.sockets.on('connection', function (socket) {

        socket.on('s_join_room', function (access_token) {
			var _student,
				getCurrentSubject = function (err, item) {
				if (err) console.dir('this should not exist', err);
				if (item) {
					_student = item;
					logger.log('silly', 's_join | student : ', item);
					student._getCurrentSubject(item._id, getInstructor);
				}
				else {
					socket.emit('warning', 'Invalid access token');
				}
			},
			getInstructor = function (err, item) {
				if (err) console.dir('this should not exist', err);
				if (item) {
					logger.log('silly', 's_join | section : ', item);
					student._getSectionInstructor(item._id, joinRoom);
				}
				else {
					socket.emit('warning', 'You have no current subject');
				}
			},
			joinRoom = function (err, item) {
				if (err) console.dir('this should not exist', err);
				if (item) {
					logger.log('silly', 's_join | instructor : ', item);
					if (!rooms[_student._id + item._id]) {
						rooms[_student._id + item._id] = {
							id : _student._id + item._id,
						};
					}
					rooms[_student._id + item._id].student = socket.id;
					rooms[_student._id + item._id].student_id = _student._id;
					socket.join(_student._id + item._id);

					// if instructor is online
					if (rooms[_student._id + item._id].instructor) {
						io.sockets.in(_student._id + item._id).emit('online', _student);
					}

					// generate hash and salt
					_student.salt = util.hash(util.randomString());
					_student.hash = util.hash(_student.salt + _student.access_token, 'sha1');
					_student.vnc = 'http://' + _student.ip_address + ':6080/index.html?password=' + util.hash(_student.access_token + _student.access_token, 'sha1');

					delete _student.access_token;

					logger.log('silly', 's_join_room getting chat history of', _student._id);
					db.getChatHistory(_student._id, sendHistory);
				}
				else {
					socket.emit('warning', 'Pano ka nakalogin ng walang current subject? o.O');
				}
			},
			sendHistory = function (err, docs) {
				if (err) return console.dir(err);
				socket.emit('history', docs);
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
						_instructor = item;
						logger.log('silly', 'i_join | instructor : ', item);
						instructor._getCurrentSubject(item.classes, joinRooms);
					}
					else {
						socket.emit('warning', 'Invalid access token');
					}
				},
				joinRooms = function (err, item) {
					var temp;
					if (err) console.dir('this should not exist', err);
					if (item) {
						for (temp in io.sockets.manager.roomClients[socket.id]) {
							console.log('leaving', temp.substring(1));
							socket.leave(temp.substring(1));
						}
						item.students.forEach(function (_student) {
							if (!rooms[_student + _instructor._id]) {
								rooms[_student + _instructor._id] = {
									id : _student + _instructor._id,
									student : null,
									student_id : null
								};
							}
							rooms[_student + _instructor._id].instructor = socket.id;
							rooms[_student + _instructor._id].instructor_id = _instructor._id;
							socket.join(_student + _instructor._id);
							socket.broadcast.to(_student + _instructor._id).emit('online');
						});
					} else {
						socket.emit('warning', 'Section is missing o.O');
					}
				};
            if (access_token) {
				logger.log('silly', 'i_join access_token :', access_token);
				instructor._findByAccessToken(access_token, getCurrentSubject);
            }
            else {
                socket.emit('warning', 'access_token is missing');
            }
        });

		socket.on('i_get_history', function (student_number) {
			var room = getRoomBySocketId(socket.id),
				sendHistory = function (err, docs) {
					if (err) return console.dir(err);
					socket.emit('history', docs);
				};
			if (room) {
				logger.log('silly', 'socket i_get_history', student_number);
				db.getChatHistory(student_number, sendHistory);
			} else {
				socket.emit('warning', 'get_history Socket id not in a room');
			}
		});

        socket.on('s_update_chat', function (message) {
            var room = getRoomBySocketId(socket.id);
			if (room && message) {
				db.saveChatHistory(message, room.instructor_id, room.student_id, true);
                socket.broadcast.to(room.id).emit('update_chat', room.student_id, message);
			}
            else {
                socket.emit('warning', 'no room or no message');
            }
        });

        socket.on('i_update_chat', function (message, student_number) {
            var room = getRoomBySocketId(socket.id);
			logger.log('silly', 'i_update_chat sn', student_number, 'inst', room.instructor_id);
			if (rooms[student_number + room.instructor_id] && message) {
				room = rooms[student_number + room.instructor_id];
				db.saveChatHistory(message, room.instructor_id, student_number, false);
                socket.broadcast.to(room.id).emit('update_chat', message);
			}
            else {
                socket.emit('warning', 'no room or no message');
            }
        });

        socket.on('disconnect', function () {
            var room;
			logger.log('silly', 'someone is disconnecting');
			for (room in rooms) {
				room = rooms[room];
				if (room.instructor === socket.id) {
					logger.log('silly', 'disconnecting from', room.id);
					socket.broadcast.to(room.id).emit('disconnect');
					socket.leave(room.id);
					room.instructor = room.instructor_id = null;
					if (!room.student)
						delete rooms[room.id];
				}
				else if (room.student === socket.id) {
					logger.log('silly', 'disconnecting from', room.id);
					socket.broadcast.to(room.id).emit('disconnect', room.student_id);
					socket.leave(room.id);
					room.student = room.student_id = null;
					if (!room.instructor)
						delete rooms[room.id];
					break;
				}
            }
        });
    });

    logger.log('verbose', 'done handling socket');
};

