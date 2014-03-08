var db = require(__dirname + '/../config/database'),
    util = require(__dirname + '/../helpers/util'),
    logger = require(__dirname + '/../lib/logger'),
    TolerableError = require(__dirname + '/../lib/tolerable_error'),
    config = require(__dirname + '/../config/config').config,
    http = require('http'),
	path = require('path'),
    fs = require('fs'),
    collectionName = 'students',
    _findByAccessToken = function (access_token, cb, next) {
        var getStudent = function(err, collection) {
                if (err) return next(err);
                collection.findOne({access_token : access_token}, {password : 0}, cb);
            };
        db.get().collection(collectionName, getStudent);
    },
    _getCurrentSubject = function (student_number, cb, next) {
        var getSection = function (err, collection) {
                var date = new Date(),
                    day = "UMTWHFS"[date.getDay()];
                if (err) return next(err);
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
        db.get().collection('sections', getSection);
    };

exports.collectionName = collectionName;

exports.login = function (req, res, next) {
    var item,
        collection,
        data = util.chk_rqd(['student_number', 'username', 'password'], req.body, next),
        getStudent = function(err, _collection) {
            if (err) return next(err);
            collection = _collection;
            logger.log('verbose', 'checking student from local db', data.username, data.student_number);
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
            if (err) return next(err);
            if (item) {
				if (process.env['NODE_ENV'] !== 'testing') {
					item.access_token = util.hash(+new Date + config.SALT);
				}
                item.last_login = +new Date;
                logger.log('verbose', 'updating student properties', data.username, data.student_number);
                collection.update({'_id' : item._id}, {$set : {
                    access_token : item.access_token,
                    last_login : +new Date,
                    ip_address : data.ip_address
                }}, function (err) {
                    if (err) return next(err);
                });
                logger.log('info', 'logged in locally', data.username, data.student_number);
                return res.send({
                    access_token : item.access_token,
                    first_name : item.first_name,
                    last_name : item.last_name
                });
            }
            else {
                logger.log('verbose', 'trying to login via systemone', data.username, data.student_number);
				if (process.env['NODE_ENV'] === 'testing') {
					return res.send(401, {message : 'Wrong username or password'});
				}
				else {
					loginViaSystemOne();
				}
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
                        saveInDb(JSON.parse(chunk));
                    });
                });
            req.on('error', function(err) {
                logger.log('info', 'systemone not responding', JSON.stringify(err));
                return res.send(401, {message : 'Wrong username or password'});
            });
            req.write(payload);
            req.end();
        },
        saveInDb = function (temp) {
            var i, temp2;
            if (temp.message) {
                logger.log('info', 'login failed', data.username, data.student_number);
                return res.send(401, {message : 'Wrong username or password'});
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
                collection.remove({'_id': data.student_number}, function (err) {
                    if (err) return next(err);
                });
                collection.insert(temp, function (err) {
                    if (err) return next(err);
                });
                logger.log('info', 'logged in via systemone', data.username, data.student_number);
                return res.send({
                    access_token : temp.access_token,
                    first_name : temp.first_name,
                    last_name : temp.last_name
                });
            }
        };
    logger.log('info', 'student trying to login');
    data.ip_address = req.connection.remoteAddress;
    db.get().collection(collectionName, getStudent);
};

exports.logout = function (req, res, next) {
    var collection,
        data = util.chk_rqd(['access_token'], req.body, next),
        getStudent = function (err, _collection) {
            if (err) return next(err);
            collection = _collection;
            collection.findOne({'access_token': data.access_token}, updateStudent);
        },
        updateStudent = function (err, item) {
            if (err) return next(err);
            if (item) {
                collection.update({'_id' : item._id}, {$set : {access_token: null, socket_id : null}}, function (err) {
                    if (err) return next(err);
                });
                return res.send({message : "Logout successful"});
                logger.log('info', 'Logout successful');
            }
            else
                return res.send(401, {message : "Invalid access_token"});
        };
    db.get().collection(collectionName, getStudent);
};

exports.findAll = function (req, res, next) {
    var getAllStudents = function (err, collection) {
            if (err) return next(err);
            collection.find().toArray(send);
        },
        send = function (err, items) {
            if (err) return next(err);
            return res.send(items);
        };
    db.get().collection(collectionName, getAllStudents);
};

exports.submit = function (req, res, next) {
    var student,
		section,
        counter = 0,
        section_dir,
        student_dir,
        files = util.extractFiles(req.files, 'file', next),
        getCurrentSubject = function (err, item) {
            if (err) return next(err);
			if (item) {
				student = item;
				logger.log('verbose', 'getting current subject');
				_getCurrentSubject(student._id, createSectionDir, next);
			}
			else {
                logger.log('info', 'student:submit student not found');
                return res.send(404, 'student not found');
			}
        },
        createSectionDir = function (err, item) {
            if (err) return next(err);
            if (item) {
				section = item;
                logger.log('debug', item);
                section_dir = path.normalize(config.upload_dir + item._id.replace(/\s+/g, '_'));
                logger.log('verbose', 'creating subject dir', section_dir);
				util.mkdir(config.upload_dir, function () {
					util.mkdir(section_dir, createStudentDir);
				});
            }
            else {
                logger.log('warn', 'student:submit no current subject');
                return res.send(400, {message : 'no current subject'});
            }
        },
        createStudentDir = function (err) {
            if (err) return next(err);
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
				if(err) return next(err);
				fs.unlink(file.path, function (err) {
					if (err) return next(err);
					file.cleanName = util.cleanFileName(file.name);
					logger.log('verbose', 'writing file', file.cleanName);
					util.getSafeFileName(student_dir + '/' + file.cleanName, function (path) {
						if (process.env['NODE_ENV'] === 'testing')
							getStudentCollection();
						else
							fs.writeFile(path, data, getStudentCollection);
					});
				});
            });
        },
		getStudentCollection = function (err) {
            if (err) return next(err);
            if (++counter === files.length) {
                logger.log('verbose', 'saving in db');
				db.get().collection(collectionName, saveInDb);
            }
		},
		saveInDb = function (err, collection) {
            if (err) return next(err);
			collection.update({_id : student._id},
			{
				$pushAll : {
					files : files.map(function(f){
						return {
							name : f.cleanName,
							size : f.size,
							date : +new Date
						}
					})
				}
			}, sendResponse);
		},
        sendResponse = function (err) {
            if (err) return next(err);
			logger.log('info', student._id, ' successfully submitted file/s');
			return res.send({message : 'Successfully submitted ' + files.length + ' file' + (files.length > 1 ? 's' : '')});
        };
    logger.log('verbose', 'someone submitted file/s');
    _findByAccessToken(util.chk_rqd(['access_token'], req.body, next).access_token, getCurrentSubject, next);
};

exports.findByAccessToken = function (req, res, next) {
    var sendStudent = function (err, item) {
            if (err) return next(err);
            if (item) {
                logger.log('info', 'findByAccessToken : student found');
                logger.log('debug', item);
                return res.send(item);
            }
            else {
                logger.log('info', 'findByAccessToken : student not found');
                return res.send(404, 'student not found');
            }
        };

	logger.log('info', 'findByAccessToken');
    _findByAccessToken(util.chk_rqd(['access_token'], req.body, next).access_token, sendStudent, next);
};
