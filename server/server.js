var express = require('express'),
    student = require('./routes/student'),
    instructor = require('./routes/instructor');

var app = express();

app.configure(function () {
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
});


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

app.listen(3000);
console.log('Listening on port 3000...');
