var winston = require('winston'),
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                level : 'silly',
                colorize : true
            })
        ]
    });

exports.logger = logger;
