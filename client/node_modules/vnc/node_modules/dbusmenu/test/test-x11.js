var dbus = require('dbus-native');
var bus = dbus.sessionBus();
var menu = require('./menu1');
var dbusmenu = require('../lib');
var x11 = require('x11');

x11.createClient(function(err, display) {
    var X = display.client;
    var wid = X.AllocID();
    X.CreateWindow(wid, display.screen[0].root, 100, 100, 400, 300);
    X.MapWindow(wid);
    var mainmenu = dbusmenu.createMenu(bus, wid, '/some/wid/path', menu);
    mainmenu.on('clicked', function(id, menuitem) {
        console.log(menuitem);
    });
});
