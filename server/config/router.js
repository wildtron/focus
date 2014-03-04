var db = require(__dirname + '/database');
    section = require(__dirname + '/../controllers/section'),
    student = require(__dirname + '/../controllers/student'),
    instructor = require(__dirname + '/../controllers/instructor');

// imports
// db.importData(section.collectionName);
db.importData(instructor.collectionName);

exports.setup = function (app) {
    app.post('/student/login', student.login);
    app.post('/student/logout', student.logout);
    app.get('/students', student.findAll);

    app.post('/instructor/login', instructor.login);
    app.post('/instructor/logout', instructor.logout);
    app.get('/instructors', instructor.findAll);

    app.get('*', function (req, res) {
        res.redirect('/index.html');
    });
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
                socket.emit('update_chat', 'hi po!', '2010-43168');
                // socket.emit('warning', 'successfully joined in all rooms');
            }
            else {
                socket.emit('warning', 'students missing');
            }
        });

        socket.on('join_room', function (data) {
            if (data.student_number) {
                socket.join(data.student_number);
                io.sockets.in(data.student_number).emit('warning', data.student_number + ' is now online');
                socket.emit('warning', 'attendance recorded');
            }
            else {
                socket.emit('warning', 'student_number missing');
            }
        });

        socket.on('chat', function (data) {
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
    });
};

