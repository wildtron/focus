exports.chk_rqd = function (reqd, req) {
    var i = reqd.length
        ret = {};
    while(i--) {
        if (!req.body[reqd[i]])
            throw new Error(reqd[i] + ' is missing');
        ret[reqd[i]] = req.body[reqd[i]];
    }
    return ret;
};
