var DB = require(__dirname + '/../config/database'),
    util = require(__dirname + '/../helpers/util'),
    logger = require(__dirname + '/../lib/logger').logger,
    config = require(__dirname + '/../config/config').config,
    http = require('http'),
    fs = require('fs'),
    collectionName = 'students',
    _findByAcessToken = function (access_token, cb) {
        var getStudentCollection = function (db) {
                db.collection(collectionName, getStudent);
            },
            getStudent = function(err, collection) {
                if (err) next(err);
                collection.findOne({access_token : access_token}, {password : 0}, cb);
            };
        DB.get(getStudentCollection);
    },
    _getCurrentSubject = function (student_number, cb) {
        var getSectionCollection = function (db) {
                db.collection('sections', getSection);
            },
            getSection = function (err, collection) {
                var date = new Date(),
                    day = "UMTWHFS"[date.getDay()];
                if (err) next(err);
                date = [util.pad(date.getHours(), 2), util.pad(date.getMinutes(), 2), util.pad(date.getSeconds(), 2)].join(':');
                collection.findOne({
                    days : new RegExp(day),
                    from : { $lt : date},
                    to : { $gte : date},
                    students : {
                        $in : [student_number]
                    }
                }, cb);
            };

        DB.get(getSectionCollection);
    };

exports.collectionName = collectionName;

// logins a student
exports.login = function (req, res, next) {
    var db,
        data,
        collection,
        item,
        getStudentCollection = function (_db) {
            db = _db;
            db.collection(collectionName, getStudent);
        },
        getStudent = function(err, _collection) {
            if (err) next(err);
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
            if (err) next(err);
            if (item) {
                item.access_token = util.hash(+new Date + config.SALT);
                item.last_login = +new Date;
                collection.update({'_id' : item._id}, {$set : {
                    access_token : item.access_token,
                    last_login : +new Date,
                    ip_address : data.ip_address
                }}, function (err) {
                    if (err) next(err);
                });
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
            req.on('error', function(err) {
                if (err) next(err);
            });
            req.write(payload);
            req.end();
        },
        saveInDB = function (temp) {
            var i, temp2;
            if (temp.message) {
                logger.log('info', 'login failed', data.username, data.student_number);
                res.send(temp);
            }
            else {
                temp.username = data.username;
                temp._id = data.student_number;
                temp.password = util.hash(util.hash(data.password) + config.SALT);
                temp.access_token = util.hash(+new Date + config.SALT);
                temp.last_login = +new Date;
                temp.ip_address = data.ip_address;

                for (i = temp.classes.length; i--; ) {
                    temp2 = temp.classes[i].laboratory.split(" ");
                    if (config.subjects_with_lab[temp.classes[i].courseCode] && temp2.length > 1) {
                        temp.classes[i] = temp.classes[i].courseCode + " " + temp.classes[i].sectionName;
                    }
                    else {
                        temp.classes.splice(i, 1);
                    }
                }

                collection.remove({'_id': student_number}, function (err) {
                    if (err) next(err);
                });
                collection.insert(temp, function (err) {
                    if (err) next(err);
                });
                res.send({
                    access_token : temp.access_token,
                    first_name : temp.first_name,
                    last_name : temp.last_name
                });
                logger.log('info', 'logged in via systemone', data.username, data.student_number);
            }
        };
    try {
        data = util.chk_rqd(['username', 'password', 'student_number'], req.body);
        data.ip_address = req.connection.remoteAddress;
        DB.get(getStudentCollection);
    } catch (err) {
        next(err);
    }
};

exports.logout = function (req, res, next) {
    var data,
        collection,
        getStudentCollection = function (db) {
            db.collection(collectionName, getStudent);
        },
        getStudent = function (err, _collection) {
            if (err) next(err);
            collection = _collection;
            collection.findOne({'access_token': data.access_token}, updateStudent);
        },
        updateStudent = function (err, item) {
            if (err) next(err);
            if (item) {
                collection.update({'_id' : item._id}, {$set : {access_token: null, socket_id : null}}, function (err) {
                    if (err) next(err);
                });
                res.send({message : "Logout successful"});
                console.log("Logout successful");
            }
            else
                res.send({message : "Invalid access_token"});
        };
    try {
        data = util.chk_rqd(['access_token'], req.body);
        DB.get(getStudentCollection);
    } catch (err) {
        next(err);
    }
};


exports.findAll = function (req, res, next) {
    var getStudentCollection = function (db) {
            db.collection(collectionName, getAllStudents);
        },
        getAllStudents = function (err, collection) {
            if (err) next(err);
            collection.find().toArray(send);
        },
        send = function (err, items) {
            if (err) next(err);
            res.send(items);
        };
    try {
        DB.get(getStudentCollection);
    } catch (err) {
        next(err);
    }
};

exports.submit = function (req, res, next) {
    var data,
        files,
        student,
        counter = 0,
        section_dir,
        student_dir,
        getCurrentSubject = function (err, item) {
            if (err) next(err);
            student = item;
            logger.log('verbose', 'getting current subject');
            _getCurrentSubject(student._id, createSectionDir);
        },
        createSectionDir = function (err, item) {
            if (err) next(err);
            if (item) {
                logger.log('debug', item);
                section_dir = config.upload_dir + item._id;
                logger.log('verbose', 'creating subject dir', section_dir);
                util.mkdir(section_dir, createStudentDir);
            }
            else {
                next(new Error('no current subject'));
            }
        },
        createStudentDir = function () {
            student_dir = section_dir + '/' + student._id;
            logger.log('verbose', 'creating student dir', student_dir);
            util.mkdir(student_dir, uploadFiles);
        },
        uploadFiles = function () {
            files.forEach(readWriteFile);
        },
        readWriteFile = function (file, index) {
            logger.log('verbose', 'reading file', file.name);
            fs.readFile(file.path, function (err, data) {
                var cleanName = util.cleanFileName(file.name);
                if (err) next(err);
                logger.log('verbose', 'writing file', cleanName);
                util.getSafeFileName(student_dir + '/' + cleanName, function (path) {
                    fs.writeFile(path, data, sendResponse);
                });
            });
        },
        sendResponse = function (err) {
            if (err) next(err);
            if (++counter === files.length) {
                res.send({message : 'Successfully submitted ' + files.length + ' file' + (files.length > 1 ? 's' : '')});
            }
        };
    try {
        logger.log('info', 'someone submitted file/s');
        data = util.chk_rqd(['access_token'], req.body);
        files = util.extractFiles(req.files, 'file', true);
        _findByAcessToken(data.access_token, getCurrentSubject);
    } catch (err) {
        next(err);
    }
};

exports.findByAcessToken = function (req, res, next) {
    var data,
        sendStudent = function (err, item) {
            if (err) next(err);
            if (item) {
                logger.log('info', 'findByAcessToken : student found');
                logger.log('debug', item);
                res.send(item);
            }
            else {
                logger.log('info', 'findByAcessToken : student not found');
                res.send(404, 'student not found');
            }
        };

    try {
        data = util.chk_rqd(['access_token'], req.body);
        _findByAcessToken(data.access_token, sendStudent);
    } catch (err) {
        next(err);
    }
};
