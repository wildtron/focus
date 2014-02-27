var Proxy = require('peer-vnc');

var handle = new Proxy('10.0.4.233:5900', function (err, proxyURL) {
    console.log('VNC                   Proxy URL(please open it on browser)');
    for (var k in proxyURL) {
        console.log(k+'        '+proxyURL[k]);
    }
});
