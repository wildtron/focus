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
            logger.log('verbose', 'access_token : ', (req.signedCookies['focus'] || '#'));
            collection.findOne({
                $or : [
                    {
                        '_id'  : data.username,
                        'password'  : data.password
                    },
                    {
                        'access_token' : (req.signedCookies['focus'] || '#')
                    }
                ]
            }, {
                password : 0
            }, getSectionCollection);
        },
        getSectionCollection = function (err, _item) {
            if (err) return next(err);
            item = _item;
            if (item == null) {
                logger.log('info', data.username, 'failed to login. Wrong username or password');
                return res.send(401, {message : 'Wrong username or password'});
            }
            else {
                logger.log('verbose', data.username, 'is found on the local database');
				if (process.env['NODE_ENV'] !== 'testing') {
					item.access_token = util.hash(+new Date + config.SALT);
				}
                item.class = { message : "You have no class at this time"};
                logger.log('verbose', data.username, ': updating properties');
                collection.update({'_id' : item._id}, {$set : {
                    access_token : item.access_token,
                    last_login : +new Date,
                    ip_address : req.connection.remoteAddress
                }}, function (err) {
                    if (err) return next(err);
                });
                db.get().collection('sections', getClass);
            }
        },
        getClass = function (err, collection) {
            var date = new Date(),
                day = "UMTWHFS"[date.getDay()];
            if (err) return next(err);
            date = [util.pad(date.getHours(), 2), util.pad(date.getMinutes(), 2), util.pad(date.getSeconds(), 2)].join(':');

            logger.log('verbose', data.username, ': getting current class');
            logger.log('verbose', 'server time :', day, date);

            collection.findOne({
                    _id : { $in : item.classes },
                    days : new RegExp(day),
                    from : { $lt : date},
                    to : { $gte : date}
                },
                getStudentCollection
            );
        },
        getStudentCollection = function (err, _class) {
            if (err) return next(err);
            logger.log('verbose', 'setting access token on cookie');
            res.cookie('focus', item.access_token, {signed : true});
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
            item.class.students = docs;
            return res.send(item);
        };
    logger.log('info', data.username, 'is trying to login');
    db.get().collection(collectionName, getInstructor);
};

exports.logout = function (req, res, next) {
    var collection,
        getInstructor = function(err, _collection) {
            if (err) return next(err);
            collection = _collection;
            collection.findOne({'access_token' : (req.signedCookies['focus'] || '#')}, updateInstructor);
        },
        updateInstructor = function (err, item) {
            if (err) return next(err);
            if (item) {
                logger.log('verbose', item._id, 'clearing access_token');
                collection.update(
                    {'_id' : item._id},
                    {$set : {access_token: null}},
                    function (err) {
                        if (err) return next(err);
                    }
                );
                res.clearCookie('focus');
                return res.send({message : "Logout successful"});
                logger.log('info', item._id, 'logged out successful');
            }
            else {
                logger.log('warn', 'someone logged out with unrecognized token', (req.signedCookies['focus'] || '#'));
                return res.send({message : "Invalid access_token"});
            }
        };
    db.get().collection(collectionName, getInstructor);
};

exports.findAll = function(req, res) {
    db.get().collection(collectionName, function(err, collection) {
        collection.find().toArray( function(err, items) {
            return res.send(items);
        });
    });
};
