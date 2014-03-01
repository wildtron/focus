var DB = require(__dirname + '/../config/database'),
    config = require(__dirname + '/../config/config').config,
    util = require(__dirname + '/../helpers/util'),
    collectionName = 'instructors';

exports.collectionName = collectionName;

exports.login = function (req, res) {
    try {
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
                            'access_token' : (req.signedCookies['focusdb'] || '#')
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
                    hour = date.getHours(),
                    day = "UMTWHFS"[date.getDay()];

                collection.findOne({
                        _id : { $in : item.classes },
                        $where : function () {
                            var temp = this.timeLaboratory.split("-");
                            if (hour > 12) hour -= 12;
                            return (~this.daysLaboratory.split.indexOf(day) && hour >= +temp[0] && hour < +temp[1]);
                        }
                    },
                    getStudentCollection
                );
            },
            getStudentCollection = function (err, _class) {
                res.cookie('focusdb', item.access_token, {signed : true});
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
    } catch (e) {
        console.dir(e);
        res.send({message : e.message});
    }
};



exports.logout = function (req, res) {
    try{
        var db,
            last_collection,
            getInstructorCollection = function (_db) {
                db = _db;
                db.collection(collectionName, getInstructor);
            },
            getInstructor = function(err, collection) {
                last_collection = collection;
                collection.findOne({'access_token' : (req.signedCookies['focusdb'] || '#')}, updateInstructor);
            },
            updateInstructor = function (err, item) {
                if (item) {
                    last_collection.update({'_id' : item._id}, {$set : {access_token: null}}, {safe: true}, function (err, result) {
                        err && console.log(err);
                    });
                    res.send({message : "Logout successful"});
                    console.log("Logout successful");
                }
                else {
                    res.send({message : "Invalid access_token"});
                }
            }
        DB.get(getInstructorCollection);
    }
    catch (e) {
        console.dir(e);
        res.send({message : e.message});
    }
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


function isLoggedIn (student_number) {
    db.get(function(db){
        db.collection('students', function(err, collection) {
            collection.findOne({'student_number'  : student_number}, function (err, item) {
                
            });
        });
    });
}
