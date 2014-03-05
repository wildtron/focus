var winston = require('winston'),
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                level : 'silly',
                colorize : true
            })
        ]
    });

// winston.addColors({
    // verbose: 'grey',
// });
exports.logger = logger;
