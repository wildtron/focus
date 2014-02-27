var execStream = require('exec_stream');

module.exports = function(net, options) {
   if (!options)
      options = {};
   if (!options.getSpawnArguments) {
      options.getSpawnArguments = function() {
          var path = arguments[0];
          if ((typeof path === 'string' || Buffer.isBuffer(path) ) && path.length > 0) {
              if (Buffer.isBuffer(path)) path = path.toString('ascii'); // ??? should it be utf8 
              if (path.charCodeAt(0) === 0) {
                  // yes, it's abstract socket
                  var abstractPath = path.slice(1);
                  return ['socat', ['abstract-client:'+abstractPath, '-']];
              }
          }
      }
   }
   if (!net.createConnection)
       throw new Error('Undefined reference to net.createConnection. Check that you are passing net module as argument');
   var oldCreateConnection = net.createConnection;
   net.createConnection = function (path) {
       var args = Array.prototype.slice.apply(arguments); 
       // TODO more generic 'getStream'
       var command = options.getSpawnArguments.apply(this, args);
       if (command) {
           var stream = execStream.apply(null, command);
           // stub functions expected from net stream
           stream.setNoDelay = function() {};
           return stream;
       } else {
           return oldCreateConnection.apply(this, args);
       }
   }
};
