var db = require('./../config/database').getClient(),
    util = require('./../helpers/util'),
    collectionName = 'instructors';

exports.collectionName = collectionName;

exports.login = function (req, res) {
    try {
        var data = util.chk_rqd(['username', 'password'], req.body);
        
        db.collection(collectionName, function(err, collection) {
            collection.findOne({
                'username'  : data.username,
                'password'  : data.password
            }, function (err, item) {
                if (item == null) {
                    console.log("Login failed ", data.username);
                    res.send({message : 'Wrong username or password'});
                }
                else {
                    // using server date, get the class happening right now
                    var date = new Date(),
                        hour = date.getHours(),
                        day = "UMTWHFS"[date.getDay()],
                        i = item.classes.length,
                        temp;

                    // default class
                    item.class = { message : "You have no class at this time"};
                    
                    // iterate through instructor's classes
                    while(i--) {
                        temp = item.classes[i].time.split("-");
                        console.log("Checking if class is ", item.classes[i].course_name, item.classes[i].day, item.classes[i].time);
                        console.log("Current day time ", day, hour);
                        if (~item.classes[i].day.split("-")[0].indexOf(day) && hour >= +temp[0] && hour < +temp[1]) {
                            console.log("Current class : ");
                            console.dir(item.classes[i]);
                            item.class = item.classes[i];
                            delete item.classes;
                            
                            // get classlist
                            i = item.class.classlist.length;
                            while (i--) {
                                item.class.classlist[i];
                                
                            }
                            
                        }
                    }
                    
                    res.send(item);
                    
                }
            });
        });
    } catch (e) {
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
    db.collection(collectionName, function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};


function isLoggedIn (student_number) {
    db.collection('students', function(err, collection) {
        collection.findOne({'student_number'  : student_number}, function (err, item) {
            
        });
    });
}