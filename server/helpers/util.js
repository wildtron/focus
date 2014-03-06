var crypto = require('crypto'),
    fs = require('fs'),
    logger = require(__dirname + '/../lib/logger').logger;

exports.chk_rqd = function (reqd, body) {
    var i = reqd.length,
        ret = {},
        temp;
    while (i--) {
        if (!body[temp = reqd[i]]) {
            throw new Error(temp + ' is missing');
        }
        ret[temp] = body[temp];
    }
    return ret;
};

exports.toDay = function (str) {
    return   str.replace("Mon", "M")
                .replace(/Tue(s?)/g, "T")
                .replace("Wed", "W")
                .replace(/Thurs|Th/g, "H")
                .replace("Fri", "F")
                .replace("Sat", "S");
};

exports.hash = function (string) {
    return crypto.createHash('md5').update('' + string).digest('hex');
};

exports.pad = function (num, size) {
    return ('000000000' + num).substr(-size);
};

exports.throw_err = function (err) {
    if (err) throw err;
};

exports.extractFiles = function (files, name, required) {
    if (files[name])
        return (files[name] instanceof Array) ? files[name] : [files[name]];
    if (required)
        throw new Error(name + ' file is missing');
    return [];
}

exports.mkdir = function (dir, cb) {
    fs.exists(dir, function (exists) {
        if (exists) cb();
        else {
            fs.mkdir(dir, 600, function (err) {
                if (err) throw err;
                cb();
            });
        }
    });
}

exports.getSafeFileName = function (path, cb) {
    var original_path = path,
        version = 1,
        check = function (path) {
            fs.exists(path, function (exists) {
                if (exists) {
                    check(original_path + '-' + (++version));
                }
                else {
                    cb(path);
                }
            });
        };
    check(original_path);
};
