var DB = require(__dirname + '/../config/database'),
    util = require(__dirname + '/../helpers/util'),
    logger = require(__dirname + '/../lib/logger').logger,
    config = require(__dirname + '/../config/config').config,
    http = require('http'),
    fs = require('fs'),
    collectionName = 'students';

exports.collectionName = collectionName;

// logins a student
exports.login = function (req, res) {
    var data = util.chk_rqd(['username', 'password', 'student_number'], req.body),
        db,
        collection,
        item,
        getStudentCollection = function (_db) {
            db = _db;
            db.collection(collectionName, getStudent);
        },
        getStudent = function(err, _collection) {
            collection = _collection;
            collection.findOne({
                $or : [
                    {
                        '_id'  : data.student_number,
                        'username'  : data.username,
                        'password'  : util.hash(util.hash(data.password) + config.SALT)
                    },
                    {
                        'access_token' : (req.cookies.FOCUSSESSID || '#')
                    }
                ]
            }, trySystemOne);
        },
        trySystemOne = function (err, item) {
            if (item) {
                item.access_token = util.hash(+new Date + config.SALT);
                item.last_login = +new Date;
                collection.update({'_id' : item._id}, {$set : {
                    access_token : item.access_token,
                    last_login : +new Date,
                    ip_address : data.ip_address
                }});
                res.send({
                    access_token : item.access_token,
                    first_name : item.first_name,
                    last_name : item.last_name
                });
                logger.log('info', 'logged in locally', data.username, data.student_number);
            }
            else {
                loginViaSystemOne();
            }
        },
        loginViaSystemOne = function () {
            var payload = ['password=',
                            util.hash(util.hash(data.password) + config.SALT),
                            '&username=',
                            util.hash(util.hash(data.username) + config.SALT),
                            '&student_number=',
                            util.hash(util.hash(data.student_number) + config.SALT),
                            '&access_token=',
                            config.ACCESS_TOKEN].join(''),
                req = http.request({
                    host: config.systemone.host,
                    port: config.systemone.port,
                    path: config.systemone.path,
                    method: 'POST',
                    headers : {
                        "Content-Type" : 'application/x-www-form-urlencoded',
                        "Content-Length" : payload.length
                    }
                }, function(response) {
                    response.setEncoding('utf8');
                    response.on('data', function (chunk) {
                        saveInDB(JSON.parse(chunk));
                    });
                });
            req.on('error', function(e) {
                console.log('problem with request: ' + e.message);
            });
            req.write(payload);
            req.end();
        },
        saveInDB = function (temp) {
            var i, temp2;
            if (temp.message) {
                console.log("login failed", data.username, data.student_number);
                res.send(temp);
            }
            else {
                temp.username = data.username;
                temp._id = data.student_number;
                temp.password = util.hash(util.hash(data.password) + config.SALT);
                temp.access_token = util.hash(+new Date + config.SALT);
                temp.last_login = +new Date;
                temp.ip_address = data.ip_address;
                i = temp.classes.length;

                // format classes
                while (i--) {
                    temp2 = temp.classes[i].laboratory.split(" ");
                    if (config.subjects_with_lab[temp.classes[i].courseCode] && temp2.length > 1) {
                        temp.classes[i] = temp.classes[i].courseCode + " " + temp.classes[i].sectionName;
                    }
                    else {
                        temp.classes.splice(i, 1);
                    }
                }

                collection.remove({'_id': student_number});
                collection.insert(temp);
                res.send({
                    access_token : temp.access_token,
                    first_name : temp.first_name,
                    last_name : temp.last_name
                });
                console.log("logged in via systemone", data.username, data.student_number);
            }
        };
    data.ip_address = req.connection.remoteAddress;
    DB.get(getStudentCollection);
};

exports.logout = function (req, res) {
    var data = util.chk_rqd(['access_token'], req.body),
        collection,
        getStudentCollection = function (db) {
            db.collection(collectionName, getStudent);
        },
        getStudent = function (err, _collection) {
            collection = _collection;
            collection.findOne({'access_token': data.access_token}, updateStudent);
        },
        updateStudent = function (err, item) {
            if (item) {
                collection.update({'_id' : item._id}, {$set : {access_token: null, socket_id : null}});
                res.send({message : "Logout successful"});
                console.log("Logout successful");
            }
            else
                res.send({message : "Invalid access_token"});
        };
    DB.get(getStudentCollection);
};


exports.findAll = function (req, res) {
    var getStudentCollection = function (db) {
            db.collection(collectionName, getAllStudents);
        },
        getAllStudents = function (err, collection) {
            collection.find().toArray(send);
        },
        send = function (err, items) {
            res.send(items);
        };
    DB.get(getStudentCollection);
};

exports.submit = function (req, res) {
    var files, i;
    console.dir(req.body);
    logger.log('debug', req.body.access_token);
    if (req.files && req.files.file) {
        if (!req.files.file instanceof Array)
            files = [req.files.file];
        else
            files = req.files.file;

        for (i = files.length; i--;) {

        }
        logger.log('verbose', 'file received');
        // fs.readFile(req.files.displayImage.path, function (err, data) {
            // var newPath = __dirname + '/uploads/uploadedFileName';
            // fs.writeFile(newPath, data, function (err) {
                // res.redirect("back");
            // });
        // });
    }
    else {
        logger.warn('verbose', 'someone call submit without a file');
    }
    res.send('wat');
};
