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
			var where = {classes : {$in : [data.section_id]}},
				projection = {
					access_token : 0,
					password : 0
				};
			if (!isNaN(data.exer_number)) {
				projection = {
					first_name : 1,
					last_name : 1,
					files : {
						$elemMatch : {
							name : new RegExp('exer' + data.exer_number, 'gi')
						}
					}
				};
			}
			if (util.isSN(data.student_number)) {
				where._id = data.student_number;
			}
            if (err) return next(err);
            logger.log('verbose', 'section:getStudent getting students');
            collection.find({
					$query : where,
					$orderby : {}
				},
				projection
            ).toArray(sendResponse);
        },
        sendResponse = function (err, docs) {
            if (err) return next(err);
            logger.log('verbose', 'section:getStudent successful');
            return res.send(docs);
        };
    logger.log('info', 'section:getStudent someone is trying to get the students of', data.section_id);
	if (!data) return;
    db.get().collection('instructors', getInstructor);
};


/** Section related utilities **/

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