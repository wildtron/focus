var collectionName = 'instructors',
    util = require(__dirname + '/../helpers/util'),
    DB = require(__dirname + '/../config/database'),
    logger = require(__dirname + '/../lib/logger').logger,
    config = require(__dirname + '/../config/config').config;

exports.collectionName = collectionName;

exports.login = function (req, res) {
    var db,
        item,
        last_collection,
        data = util.chk_rqd(['username', 'password'], req.body),
        getInstructorCollection = function (_db) {
            db = _db;
            db.collection(collectionName, getInstructor);
        },
        getInstructor = function(err, collection) {
            last_collection = collection;
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
            item = _item;
            if (item == null) {
                logger.log('info', data.username, 'failed to login. Wrong username or password');
                res.send({message : 'Wrong username or password'});
            }
            else {
                logger.log('verbose', data.username, 'is found on the local database');
                item.access_token = util.hash(+new Date + config.SALT);
                item.class = { message : "You have no class at this time"};
                logger.log('verbose', data.username, ': updating properties');
                last_collection.update({'_id' : item._id}, {$set : {
                    access_token : item.access_token,
                    last_login : +new Date,
                    ip_address : req.connection.remoteAddress
                }});
                db.collection('sections', getClass);
            }
        },
        getClass = function(err, collection) {
            var date = new Date(),
                day = "UMTWHFS"[date.getDay()];

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
            logger.log('verbose', 'setting access token on cookie');
            res.cookie('focus', item.access_token, {signed : true});
            delete item.access_token;
            if (_class) {
                item.class = _class;
                logger.log('verbose', data.username, ': current class found', _class);
                logger.log('verbose', data.username, ': getting students');
                db.collection('students', getStudents);
            }
            else {
                logger.log('info', data.username, ': no current class', item.classes.join(', '));
                res.send(item);
            }
        },
        getStudents = function (err, collection) {
            collection.find(
                {_id : {$in : item.class.students}},
                {
                    classes : 0,
                    password : 0,
                    access_token : 0
                }
            ).toArray(function (err, docs) {
                logger.log('verbose', data.username, ': login successful with current class and students');
                item.class.students = docs;
                res.send(item);
            });
        };
    logger.log('info', data.username, 'is trying to login');
    DB.get(getInstructorCollection);
};



exports.logout = function (req, res) {
    var db,
        last_collection,
        getInstructorCollection = function (_db) {
            db = _db;
            db.collection(collectionName, getInstructor);
        },
        getInstructor = function(err, collection) {
            last_collection = collection;
            collection.findOne({'access_token' : (req.signedCookies['focus'] || '#')}, updateInstructor);
        },
        updateInstructor = function (err, item) {
            if (item) {
                logger.log('verbose', item.username, 'clearing access_token');
                last_collection.update({'_id' : item._id}, {$set : {access_token: null}});
                res.clearCookie('focus');
                res.send({message : "Logout successful"});
                logger.log('info', item.username, 'logged out successful');
            }
            else {
                logger.log('warn', 'someone logged out with unrecognized token', (req.signedCookies['focus'] || '#'));
                res.send({message : "Invalid access_token"});
            }
        };
    DB.get(getInstructorCollection);
};

exports.findbyId = function(req, res) {
    var id = req.params.id;
    db.collection(collectionName, function(err, collection) {
        collection.findOne({'_id': new BSON.ObjectID(id)}, function (err, item) {
            res.send(item);
        });
    });
};

exports.findAll = function(req, res) {
    db.get(function(db){
        db.collection(collectionName, function(err, collection) {
            collection.find().toArray(function(err, items) {
                res.send(items);
            });
        });
    });
};

exports.nothing = function (req, res) {
    res.end('nothing');
}
