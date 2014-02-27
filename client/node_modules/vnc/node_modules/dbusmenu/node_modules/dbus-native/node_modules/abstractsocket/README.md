abstractsocket
==============

abstract unix sockets support for net.createConnection

    var net = require('net');
    require('abstractsocket')(net);
    var connection = net.createConnection('\u0000/tmp/dbus-OeixI07RHo');
    connection.pipe(process.stdout);
    connection.write(Buffer('\0AUTH EXTERNAL 31303030\r\n'));

you can map `net.createConnection` to any command:

    var net = require('net');
    var url = require('url');
    require('abstractsocket')(net, {
        getSpawnArguments: function(path) {
            if (path.match(/^ssh\+exec:\/\//)) {
               var params = url.parse(path, true);
               var args = [];
               if (params.port)
               {
                   args.push('-p');
                   args.push(params.port.toString());
               }
               var user = params.auth.split(':')[0];
               args.push(user + '@' + params.hostname);
               args.push(params.query.command);
               console.log(args);
               return ['ssh', args];
            }
            // if not matched, createConnection is called 
        }
    });

    // list files on remote machine
    var lsStream = net.createConnection('ssh+exec://user@domain.com:2222/?command=ls%20-l');
    lsStream.pipe(process.stdout);
