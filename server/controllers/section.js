var collectionName = 'sections',
    util = require(__dirname + '/../helpers/util'),
    db = require(__dirname + '/../config/database'),
    logger = require(__dirname + '/../lib/logger');

exports.collectionName = collectionName;

exports.getStudentsWithFiles = function (req, res, next) {
    var item,
        collection,
        data = util.chk_rqd(['section_id', 'exer_number', 'student_number', 'order'], req.query, next),
        getInstructor = function (err, _collection) {
            if (err) return next(err);
            collection = _collection;
            logger.log('verbose', 'section:getStudent access_token : ', (req.cookies['focus'] || '#'));
            collection.count({
				access_token : (req.cookies['focus'] || '#'),
				classes : {$in : [data.section_id]}
			}, {limit : 1}, getStudentCollection);
        },
        getStudentCollection = function (err, item) {
            if (err) return next(err);
            if (item) {
				db.get().collection('students', getStudents);
            }
            else {
                logger.log('warn', 'section:getStudent unrecognized token', (req.cookies['focus'] || '#'));
                return res.send(401, {message : "Invalid access_token"});
            }
        },
        getStudents = function (err, collection) {
			var where = {classes : {$in : [data.section_id]}};
            if (err) return next(err);
			if (util.isSN(data.student_number)) {
				where._id = data.student_number;
			}

            logger.log('verbose', 'section:getStudent getting students');

			if (!isNaN(data.exer_number)) {
				collection.aggregate([
					{
						$match : where
					},
					{
						$unwind : '$files'
					},
					{
						$match : {
							'files.name' : new RegExp('exer' + data.exer_number, 'gi')
						}
					},
					{
						$group : {
							_id : '$_id',
							first_name : {
								$first : '$first_name'
							},
							last_name : {
								$first : '$last_name'
							},
							files : {
								$push : '$files'
							}
						}
					}
				], sendResponse);
			}
			else {
				collection.find(where, {
					first_name : 1,
					last_name : 1,
					files : 1
				}).toArray(sendResponse);
			}
        },
        sendResponse = function (err, docs) {
            if (err) return next(err);
			docs = docs.map(function (d) {
				d.name = util.toTitleCase(d.first_name + ' ' + d.last_name);
				return d;
			});
            logger.log('verbose', 'section:getStudent successful');
            return res.send(docs);
        };
    logger.log('info', 'section:getStudent someone is trying to get the students of', data.section_id);
	if (!data) return;
    db.get().collection('instructors', getInstructor);
};

exports.getAttendance = function (req, res, next) {
	var records,
		data = util.chk_rqd(['section_id'], req.query, next),
        getInstructor = function (err, _collection) {
            if (err) return next(err);
            collection = _collection;
            logger.log('verbose', 'section:getStudent access_token : ', (req.cookies['focus'] || '#'));
            collection.count({
				access_token : (req.cookies['focus'] || '#'),
				classes : {$in : [data.section_id]}
			}, {limit : 1}, getAttendanceCollection);
        },
		getAttendanceCollection = function (err, item) {
            if (err) return next(err);
            if (item) {
				db.get().collection('attendance', getRecords);
            }
            else {
                logger.log('warn', 'section:getAttendance unrecognized token', (req.cookies['focus'] || '#'));
                return res.send(401, {message : "Invalid access_token"});
            }
		},
		getRecords = function (err, collection) {
            if (err) return next(err);
			logger.log('verbose', 'section:getAttendance getting records');
			collection.find({
				section_id : data.section_id
			}).sort({date : 1}).toArray(getStudentCollection);
		},
		getStudentCollection = function (err, docs) {
            if (err) return next(err);
			records = docs;
			db.get().collection('students', getStudents);
		},
		getStudents = function (err, collection) {
            if (err) return next(err);
			logger.log('verbose', 'section:getAttendance getting student');
			collection.find({
				classes : {
					$in : [data.section_id]
				}
			}).sort({last_name : 1}).toArray(sendResponse);
		},
		sendResponse = function (err, docs) {
            if (err) return next(err);
			res.send({
				records : records,
				students :	docs.map(function (s) {
								return {
									_id : s._id,
									name : s.last_name + ', ' + s.first_name
								};
							})
			});
		};
    logger.log('info', 'section:getStudent someone is trying to get the students of', data.section_id);
	if (!data) return;
    db.get().collection('instructors', getInstructor);
};
