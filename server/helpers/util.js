var crypto = require('crypto'),
    fs = require('fs'),
    Mocha = require('mocha'),
    path = require('path'),
    logger = require(__dirname + '/../lib/logger'),
    TolerableError = require(__dirname + '/../lib/tolerable_error');

exports.chk_rqd = function (reqd, body, next) {
    var i = reqd.length,
        ret = {},
        temp;
    while (i--) {
        if (!body[temp = reqd[i]]) {
            next && next(new TolerableError(temp + ' is missing'));
			return false;
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

exports.hash = function (string, hash) {
    return crypto.createHash(hash || 'md5').update('' + string).digest('hex');
};

exports.randString = function () {
	// return exports.hash();
};

exports.pad = function (num, size) {
    return ('000000000' + num).substr(-size);
};

exports.extractFiles = function (files, name, next) {
    if (files[name])
        return (files[name] instanceof Array) ? files[name] : [files[name]];
    if (next) {
        next(new TolerableError(name + ' is missing'));
		return false;
	}
    return [];
}

exports.mkdir = function (dir, cb) {
    fs.exists(dir, function (exists) {
        if (exists) cb();
        else {
            fs.mkdir(dir, 666, function (err) {
                cb(err);
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
                    check(original_path + '-' + (++version), version);
                }
                else {
                    cb(path, version);
                }
            });
        };
    check(original_path);
};

exports.cleanFileName = function (file_name) {
    return  file_name
            .replace(/\.\./gi, '')              // remove consecutive 2 dots
            .replace(/^\./i, '')                // remove dot on if first character
            .replace(/\s+/gi, '-')              // replace space/s with dash
            .replace(/[^a-zA-Z0-9\.-_]/gi, '');  // strip any special characters
};


exports.runTest = function () {
    var mocha = new Mocha({reporter : 'spec'});

    fs.readdirSync(__dirname + '/../tests/').filter(function(file){
        return file.substr(-3) === '.js';
    }).forEach(function(file){
        mocha.addFile(
            path.join(__dirname + '/../tests/', file)
        );
    });

	setTimeout(function () {
		mocha.run(function (failures) {
			process.on('exit', function () {
				process.exit(failures);
			});
		});
    }, 2000);
}

exports.isSN = function (student_number) {
	return /^\d{4}-\d{5}$/.test(student_number);
}

exports.toTitleCase = function (str) {
	return str.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}
