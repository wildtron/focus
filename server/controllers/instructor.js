var DB = require(__dirname + '/../config/database'),
    config = require(__dirname + '/../config/config').config,
    util = require(__dirname + '/../helpers/util'),
    collectionName = 'instructors';

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
                console.log("Login failed ", data.username);
                res.send({message : 'Wrong username or password'});
            }
            else {
                item.access_token = util.hash(+new Date + config.SALT);
                item.class = { message : "You have no class at this time"};
                last_collection.update({'_id' : item._id}, {$set : {
                    access_token : item.access_token,
                    last_login : +new Date,
                    ip_address : req.connection.remoteAddress
                }}, {safe : true}, function (err, result) {
                    err && console.log(err);
                });
                db.collection('sections', getClass);
            }
        },
        getClass = function(err, collection) {
            // using server date, get the class happening right now
            var date = new Date(),
                day = "UMTWHFS"[date.getDay()];

            date = [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');

            collection.findOne({
                    _id : { $in : item.classes },
                    $where : function () {
                        return (~this.days.split.indexOf(day) &&
                            (this.from + ':00') >= date &&
                            date < (this.to + ':00'));
                    }
                },
                getStudentCollection
            );
        },
        getStudentCollection = function (err, _class) {
            res.cookie('focus', item.access_token, {signed : true});
            delete item.access_token;
            if (_class) {
                item.class = _class;
                db.collection('students', getStudents);
            }
            else {
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
                if (docs) {
                    item.class.students = docs;
                }
                res.send(item);
            });
        };

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
                last_collection.update({'_id' : item._id}, {$set : {access_token: null}}, {safe: true}, function (err, result) {
                    err && console.log(err);
                });
                res.clearCookie('focus');
                res.send({message : "Logout successful"});
                console.log("Logout successful");
            }
            else {
                res.send({message : "Invalid access_token"});
            }
        }
    DB.get(getInstructorCollection);
};

exports.findbyId = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving instructor: ' + id);
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
