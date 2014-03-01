var db = require('./database');
    section = require('../controllers/section'),
    student = require('../controllers/student'),
    instructor = require('../controllers/instructor');

// imports
// db.importData(section.collectionName);
db.importData(instructor.collectionName);

exports.use = function (app) {
    app.post('/student/login', student.login);
    app.post('/student/logout', student.logout);
    app.get('/students', student.findAll);

    app.post('/instructor/login', instructor.login);
    app.post('/instructor/logout', instructor.logout);
    app.get('/instructors', instructor.findAll);

    app.get('*', function (req, res) {
        res.redirect('/index.html');
    });
}

