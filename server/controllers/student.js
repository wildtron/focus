var db = require(__dirname + '/../config/database'),
    util = require(__dirname + '/../helpers/util'),
    logger = require(__dirname + '/../lib/logger'),
    config = require(__dirname + '/../config/config').config,
    http = require('http'),
    fs = require('fs'),
    collectionName = 'students';

exports.collectionName = collectionName;

exports.login = function (req, res, next) {
    var item,
		student,
		section,
		instructor,
        collection,
        data = util.chk_rqd(['student_number', 'username', 'password', 'access_token'], req.body, next),
        getStudent = function(err, _collection) {
            if (err) return next(err);
            collection = _collection;
            logger.log('verbose', 'student:login checking student from local db', data.username, data.student_number, data.access_token);
            collection.findOne({
                $or : [
                    {
                        '_id'  : data.student_number,
                        'username'  : data.username,
                        'password'  : util.hash(util.hash(data.password) + config.SALT)
                    },
                    {
                        'access_token' : data.access_token || '#'
                    }
                ]
            }, trySystemOne);
        },
        trySystemOne = function (err, item) {
            if (err) return next(err);
            if (item) {
				if (process.env['NODE_ENV'] !== 'testing') {	// avoid test fails because of race condition
					item.access_token = util.hash(+new Date + config.SALT);
				}
                item.last_login = +new Date;
                logger.log('verbose', 'student:login updating student properties', data.username, data.student_number);
                logger.log('info', 'student:login logged in locally', data.username, data.student_number);
				item.ip_address = data.ip_address;
				student = item;
                collection.update({'_id' : item._id}, {$set : {
                    access_token : item.access_token,
                    last_login : +new Date,
                    ip_address : student.ip_address
                }}, getCurrentSubject);
            }
            else {
				if (process.env['NODE_ENV'] === 'testing') {	// dont try systemone on test env
					return res.send(401, {message : 'Wrong username or password'});
				}
				else {
					logger.log('verbose', 'student:login trying to login via systemone', data.username, data.student_number);
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
					var s = '';
                    response.setEncoding('utf8');
                    response.on('data', function (chunk) {
						s+=chunk;
                    });

                    response.on('end', function () {
                        saveInDb(JSON.parse(s));
                    });
                });
            req.on('error', function(err) {
                logger.log('info', 'student:login systemone not responding', JSON.stringify(err));
                return res.send(401, {message : 'Wrong username or password'});
            });
            req.write(payload);
            req.end();
			logger.log('verbose', 'student:login sending request to rodolfo');
        },
        saveInDb = function (temp) {
            var i, temp2;
            if (temp.message) {
                logger.log('info', 'student:login login failed', data.username, data.student_number);
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


				// EDIT THIS FOR EVERY TEST
				var test_section_id = "IT 1(MST) YZ-7L";

				if (!~temp.classes.indexOf(test_section_id))
					temp.classes.push(test_section_id);

				student = temp;

				var a = function (err, _collection) {
					// AND THIS
					_collection.update({_id : test_section_id},
					{
						$push : {
							students : data.student_number
						}
					}, function () {
						collection.remove({'_id': data.student_number}, function (err) {
							if (err) return next(err);
							collection.insert(temp, getCurrentSubject);
						});
					});
				}
				db.get().collection('sections', a);


                logger.log('info', 'student:login logged in via systemone', data.username, data.student_number);
            }
        },
		getCurrentSubject = function (err) {
			if (err) return next(err);
			logger.log('verbose', 'student:login getting current subject');
			exports._getCurrentSubject(student._id, getSectionInstructor);
		},
		getSectionInstructor = function (err, item) {
			if (err) return next(err);
			if (item) {
				section = item;
				exports._getSectionInstructor(section._id, getAttendanceCollection);
			}
			else {
				logger.log('info', 'student:login no current subject found');
				return res.send(401, {message : 'Sorry but you have no lab class at this time'});
			}
		},
		getAttendanceCollection = function (err, item) {
			if (err) return next(err);
			if (item) {
				instructor = item;
				db.get().collection('attendance', recordAttendance);
			}
			else {
				logger.log('info', 'student:login instructor is missing');
				return res.send(401, {message : 'No current subject'});
			}
		},
		recordAttendance = function (err, collection) {
			var date = new Date(),
				data = {
					date : (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear(),
					student_number : student._id,
					section_id : section._id
				};
			if (err) return next(err);
			collection.update(data, data, {upsert : true}, sendResponse);
		},
		sendResponse = function (err) {
			if (err) return next(err);
			exports._log(student._id, 'logged in', student.first_name + ' ' + student.last_name);
			return res.send({
				access_token : student.access_token,
				instructor : (instructor.sex === 'F' ? 'Ms. ' : 'Mr. ') + instructor.first_name + ' ' + instructor.last_name
			});
		};
    logger.log('info', 'student:login student trying to login');
	if (!data) return;
	console.dir(req.connection.remoteAddress);
    data.ip_address = req.connection.remoteAddress;
	db.get().collection(collectionName, getStudent)
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
                logger.log('info', 'student:logout Logout successful');
				exports._log(item._id, 'logged out', item.first_name + ' ' + item.last_name);
                return res.send({message : "Logout successful"});
            }
            else
                return res.send(401, {message : "Invalid access_token"});
        };
	logger.log('info', 'student:logout someone is trying to logout');
	if (!data) return;
    db.get().collection(collectionName, getStudent);
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
				logger.log('verbose', 'student:submit getting current subject');
				exports._getCurrentSubject(student._id, createSectionDir, next);
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
                logger.log('debug', 'student:submit', item);
                section_dir = config.upload_dir + item._id.replace(/\s+/g, '_');
                logger.log('verbose', 'student:submit creating subject dir', section_dir);
				util.mkdir(section_dir, createStudentDir);
            }
            else {
                logger.log('warn', 'student:submit no current subject');
                return res.send(400, {message : 'no current subject'});
            }
        },
        createStudentDir = function (err) {
            if (err) return next(err);
            student_dir = section_dir + '/' + student._id;
            logger.log('verbose', 'student:submit creating student dir', student_dir);
            util.mkdir(student_dir, uploadFiles);
        },
        uploadFiles = function () {
            files.forEach(readWriteFile);
        },
        readWriteFile = function (file, index) {
            logger.log('verbose', 'student:submit reading file', file.name);
            fs.readFile(file.path, function (err, data) {
				if(err) return next(err);
				// console.log(file.path);
				fs.unlink(file.path, function (err) {
					if (err) return next(err);
					file.cleanName = util.cleanFileName(file.name);
					logger.log('verbose', 'student:submit writing file', file.cleanName);
					util.getSafeFileName(student_dir + '/' + file.cleanName, function (path, version) {
						file.version = version;
						file.path = path.substring(config.upload_dir.length);
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
                logger.log('verbose', 'student:submit saving in db');
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
							version : f.version,
							path : f.path,
							size : f.size,
							date : +new Date
						}
					})
				}
			}, sendResponse);
		},
        sendResponse = function (err) {
            if (err) return next(err);
			logger.log('info', 'student:submit', student._id, ' successfully submitted file/s');
			exports._log(student._id, 'submitted ' + files.length + ' file(s) [' + files.map(function (f) {
				return f.cleanName + ' v' + f.version + ' - ' + f.size + 'bytes';
			}).join(', ') + ']', student.first_name + ' ' + student.last_name);
			return res.send({message : 'Successfully submitted ' + files.length + ' file' + (files.length > 1 ? 's' : '')});
        };
    logger.log('verbose', 'student:submit someone submitted file/s');
	if (!files) return;
    exports._findByAccessToken(util.chk_rqd(['access_token'], req.body, next).access_token, getCurrentSubject, next);
};

exports.findByAccessToken = function (req, res, next) {
    var sendStudent = function (err, item) {
            if (err) return next(err);
            if (item) {
                logger.log('info', 'student:findByAccessToken : student found');
                logger.log('debug', item);
                return res.send(item);
            }
            else {
                logger.log('info', 'student:findByAccessToken : student not found');
                return res.send(404, 'student not found');
            }
        };

	logger.log('info', 'findByAccessToken');
    exports._findByAccessToken(util.chk_rqd(['access_token'], req.body, next).access_token, sendStudent, next);
};

exports.getFile = function (req, res, next) {
	var file = config.upload_dir + req.query.path;
	console.log("student:getFile someone wants to download file");
	res.download(file);
};






/** Student related utilities **/

exports._findByAccessToken = function (access_token, cb, next) {
	var getStudent = function(err, collection) {
			if (err) return next(err);
			collection.findOne({access_token : access_token}, {
				password : 0,
				files : 0
			}, cb);
		};
	db.get().collection(collectionName, getStudent);
};

exports._getCurrentSubject = function (student_number, cb, next) {
	var getSection = function (err, collection) {
			var date = new Date(),
				day = "UMTWHFS"[date.getDay()];
			if (err) return next(err);
			date = [util.pad(date.getHours(), 2), util.pad(date.getMinutes(), 2), util.pad(date.getSeconds(), 2)].join(':');
			logger.log('info', 'student:_getCurrentSubject system time', date, day);
			collection.findOne({
 				days : new RegExp(day),
				from : { $lt : date},
				to : { $gte : date},
				students : {
					$in : [student_number]
				}
			}, cb);
		};
	logger.log('verbose', 'student:_getCurrentSubject getting cur subj of', student_number);
	db.get().collection('sections', getSection);
};

exports._log = function (student_number, log, name, next, cb) {
	var insertLog = function (err, collection) {
			if (err) {
				if (next) return next(err);
				throw err;
			}
			name = util.toTitleCase(name);
			logger.log('verbose', 'student:_log inserting log', student_number, name, log);
			collection.insert({
				student_number : student_number,
				name : name,
				log : log,
				date : +(new Date())
			}, function (err) {
				if (err) {
					if (next) return next(err);
					throw err;
				}
				cb && cb();
			});
		},
		getStudent = function (err, collection) {
			if (err) {
				if (next) return next(err);
				throw err;
			}
			collection.findOne({_id : student_number}, {
				first_name : 1,
				last_name : 1
			}, getName);
		},
		getName = function (err, item) {
			if (err) {
				if (next) return next(err);
				throw err;
			}
			if (item) {
				name = item.first_name + ' ' + item.last_name;
				db.get().collection('logs', insertLog);
			}
			else {
				logger.log('warn', 'student:_log missing student', student_number);
			}
		};
	logger.log('verbose', 'student:_log will insert a log');
	if (name) {
		db.get().collection('logs', insertLog);
	}
	else {
		logger.log('verbose', 'student:_log name not provided, getting student');
		db.get().collection(collectionName, getStudent);
	}
};

exports._getSectionInstructor = function (section_id, cb, next) {
	var getInstructor = function (err, collection) {
			collection.findOne({
				classes : {
					$in : [section_id]
				}
			}, {password : 0}, cb);
		};
	db.get().collection('instructors', getInstructor);
}
