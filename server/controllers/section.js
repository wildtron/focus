var collectionName = 'sections',
    util = require(__dirname + '/../helpers/util'),
    db = require(__dirname + '/../config/database'),
    logger = require(__dirname + '/../lib/logger'),
    config = require(__dirname + '/../config/config').config;

exports.collectionName = collectionName;

exports.getStudents = function (req, res, next) {
    var item,
        collection,
        data = util.chk_rqd(['section_id'], req.query, next),
        getInstructor = function (err, _collection) {
            if (err) return next(err);
            collection = _collection;
            logger.log('verbose', 'section:getStudent access_token : ', (req.signedCookies['focus'] || '#'));
            collection.count({
				access_token : (req.signedCookies['focus'] || '#'),
				classes : {$in : [data.section_id]}
			}, {limit : 1}, getStudentCollection);
        },
        getStudentCollection = function (err, item) {
            if (err) return next(err);
            if (item) {
				db.get().collection('students', getStudents);
            }
            else {
                logger.log('warn', 'section:getStudent unrecognized token', (req.signedCookies['focus'] || '#'));
                return res.send(401, {message : "Invalid access_token"});
            }
        },
        getStudents = function (err, collection) {
            if (err) return next(err);
            logger.log('verbose', 'section:getStudent getting students');
            collection.find(
				{classes : {$in : ['CMSC 161 UV-2L']}},
                {
                    classes : 0,
                    password : 0,
                    access_token : 0
                }
            ).toArray(sendResponse);
        },
        sendResponse = function (err, docs) {
            if (err) return next(err);
            logger.log('verbose', 'section:getStudent successful');
            return res.send(docs);
        };
	if (!data) return;
    logger.log('info', 'section:getStudent someone is trying to get the students of', data.section_id);
    db.get().collection('instructors', getInstructor);
};