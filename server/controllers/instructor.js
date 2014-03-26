var collectionName = 'instructors',
    util = require(__dirname + '/../helpers/util'),
    db = require(__dirname + '/../config/database'),
    logger = require(__dirname + '/../lib/logger'),
    config = require(__dirname + '/../config/config').config;

exports.collectionName = collectionName;

exports.login = function (req, res, next) {
    var item,
        collection,
        data = util.chk_rqd(['username', 'password'], req.body, next),
        getInstructor = function (err, _collection) {
            if (err) return next(err);
            collection = _collection;
            logger.log('verbose', 'access_token : ', (req.cookies['focus'] || '#'));
            collection.findOne({
                $or : [
                    {
                        '_id'  : data.username,
                        'password'  : data.password
                    },
                    {
                        'access_token' : (req.cookies['focus'] || '#')
                    }
                ]
            }, {
                password : 0,
				ip_address : 0,
				last_login : 0
            }, getSectionCollection);
        },
        getSectionCollection = function (err, _item) {
            if (err) return next(err);
            item = _item;
            if (item) {
                logger.log('verbose', data.username, 'is found on the local database');
				if (process.env['NODE_ENV'] !== 'testing') {	// avoid test fails because of race condition
					// item.access_token = util.hash(+new Date + config.SALT);
				}
                item.class = { message : "Sorry but you have no class as this moment"};
                logger.log('verbose', data.username, ': updating properties');
                collection.update({'_id' : item._id}, {$set : {
                    access_token : item.access_token,
                    last_login : +new Date,
                    ip_address : req.connection.remoteAddress
                }}, function (err) {
                    if (err) return next(err);
                });
				exports._getCurrentSubject(item.classes, getStudentCollection, next);
            }
            else {
                logger.log('info', data.username, 'failed to login. Wrong username or password');
                return res.send(401, {message : 'Wrong username or password'});
            }
        },
        getStudentCollection = function (err, _class) {
            if (err) return next(err);
            logger.log('verbose', 'setting access token on cookie');
            res.cookie('focus', item.access_token);
            delete item.access_token;
            if (_class) {
                item.class = _class;
                logger.log('verbose', data.username, ': current class found', _class);
                logger.log('verbose', data.username, ': getting students');
                db.get().collection('students', getStudents);
            }
            else {
                logger.log('info', data.username, ': no current class', item.classes.join(', '));
                return res.send(item);
            }
        },
        getStudents = function (err, collection) {
            if (err) return next(err);
            collection.find(
                {_id : {$in : item.class.students}},
                {
                    classes : 0,
					files : 0,
                    password : 0
                }
            ).toArray(sendResponse);
        },
        sendResponse = function (err, docs) {
            if (err) return next(err);
            logger.log('verbose', data.username, ': login successful with current class and students');
			docs.map(function (d) {
				d.salt = util.hash(util.randomString());
				d.hash = util.hash(d.salt + d.access_token, 'sha1');
				d.vnc = 'http://' + d.ip_address + ':6080/index.html?password=' + util.hash(d.access_token + d.access_token, 'sha1');
				delete d.access_token;
				return d;
			});
            item.class.students = docs;
            return res.send(item);
        };
    logger.log('info', data.username, 'is trying to login');
	if (!data) return;
    db.get().collection(collectionName, getInstructor);
};

exports.logout = function (req, res, next) {
    var	item,
		getCollection = function (err, _item) {
            if (err) return next(err);
            if (_item) {
				item = _item;
				db.get().collection(collectionName, updateInstructor);
            }
            else {
                logger.log('warn', 'instructor:logout someone logged out with unrecognized token', (req.cookies['focus'] || '#'));
                return res.send(401, {message : "Invalid access_token"});
            }
		},
		updateInstructor = function (err, collection) {
            if (err) return next(err);
			logger.log('verbose', 'instructor:logout', item._id, 'clearing access_token');
			res.clearCookie('focus');
			/* collection.update(
				{'_id' : item._id},
				{$set : {access_token: null}},
				function (err) {
					if (err) return next(err);
				}
			); */
			logger.log('info', item._id, 'instructor:logout logged out successful');
			return res.send({message : "Logout successful"});
        };
    logger.log('info', 'instructor:logout someone is trying to logout');
	exports._findByAccessToken(req.cookies['focus'] || '#', getCollection, next);
};

exports.getLogs = function (req, res, next) {
	var section,
		data = util.chk_rqd(['student_number', 'from', 'to', 'section_id'], req.query, next),
		getSectionCollection = function (err, item) {
			if (err) return next(err);
			if (item) {
				// get section collection
				logger.log('verbose', 'instructor:getLogs getting sections collection');
				db.get().collection('sections', getSection);
			}
			else {
				logger.log('warn', 'instructor:getLogs someone trying to get logs with unrecognized token', (req.cookies['focus'] || '#'));
				return res.send(401, {message : "Invalid access_token"});
			}
		},
		getSection = function (err, collection) {
			if (err) return next(err);
			// find section
			logger.log('verbose', 'instructor:getLogs finding section');
			collection.findOne({_id : data.section_id}, getLogsCollection);
		},
		getLogsCollection = function (err, item) {
			if (err) return next(err);
			if (item) {
				section = item;
				// get logs
				logger.log('verbose', 'instructor:getLogs gettings logs collection');
				db.get().collection('logs', getLogs);
			}
			else
				res.send(400, {message : 'Section not found'});
		},
		getLogs = function (err, collection) {
			var where = {
				student_number : {
					$in : section.students
				}
			};
			if (err) return next(err);

			if (util.isSN(data.student_number)) {
				where.student_number = data.student_number;
			}

			if (!isNaN(data.from) && !isNaN(data.to)) {

				where.date = {
					$gte : +data.from,
					$lt : +data.to
				};
			}

			logger.log('verbose', 'instructor:getLogs finding logs');
			collection.find(where).toArray(sendResponse);
		},
		sendResponse = function (err, docs) {
			if (err) return next(err);
			if (docs)
				res.send({
					students : section.students,
					logs : docs
				});
			else
				res.send(404, {message : 'Found no logs'});
		};

    logger.log('info', 'instructor:getLogs someone is trying to get the logs');

	// verify instructor
	exports._findByAccessToken(false, getSectionCollection, next, {
		access_token : req.cookies['focus'] || '#',
		classes : {$in : [data.section_id]}
	});
};


/** Instructor related utilities**/

exports._findByAccessToken = function (access_token, cb, next, where) {
	var getInstructor = function(err, collection) {
			if (err && next) return next(err);
			if (err) return console.dir(err);
			collection.findOne(where || {access_token : access_token}, {password : 0}, cb);
		};
	db.get().collection(collectionName, getInstructor);
};

exports._getCurrentSubject = function (classes, cb, next) {
	var getClass = function (err, collection) {
			var date = new Date(),
				day = "UMTWHFS"[date.getDay()];
			if (err) return next(err);
			date = [util.pad(date.getHours(), 2), util.pad(date.getMinutes(), 2), util.pad(date.getSeconds(), 2)].join(':');

			logger.log('verbose', 'instructor:_getCurrentSubject system date', day, date);

			collection.findOne({
				_id : { $in : classes },
				days : new RegExp(day),
				from : { $lt : date},
				to : { $gte : date}
			}, cb);
		};
	db.get().collection('sections', getClass);
};
