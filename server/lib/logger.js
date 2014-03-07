var winston = require('winston'),
	logger;

if (process.env['NODE_ENV'] === 'testing') {
    logger = new (winston.Logger)();
} else {
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                level : 'silly',
                colorize : true
            })
        ]
    });
}

module.exports = logger;
