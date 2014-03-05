var crypto = require('crypto');

exports.chk_rqd = function (reqd, body) {
    var i = reqd.length,
        ret = {},
        temp;
    while (i--) {
        if (!body[temp = reqd[i]])
            throw new Error(temp + ' is missing');
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
