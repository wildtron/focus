var dbus = require('dbus-native');
var bus = dbus.sessionBus();
var name = 'some.name';
bus.requestName(name, 0);

var debug = false;
if (debug) {
var oldlog = console.log;
console.log = function(a, b, c, d, e, f)
{
    console.trace();
    oldlog(a,b,c,d,e);
}

bus.connection.on('message', function(msg) {
   console.log(msg);
});
}


/*
    <method name="GetGroupProperties">
      <arg type="ai" name="ids" direction="in">
      </arg>
      <arg type="as" name="propertyNames" direction="in">
      </arg>
      <arg type="a(ia{sv})" name="properties" direction="out">
      </arg>
    </method>
*/

var DbusMenuIface = {
   name: 'com.canonical.dbusmenu',
   methods: {
       GetLayout: [ 'iias', 'u(ia{sv}av)' ],
       GetGroupProperties: [ 'aias', 'a(ia{sv})']
   },
   properties: {
       IconThemePath: 'as',
       Status: 's',
       TextDirection: 's',
       Version: 'u'
   }
};

//var x11 = require('x11');
//x11.createClient(function(err, display) {
//    var X = display.client;
//    var wid = X.AllocID();
//    X.CreateWindow(wid, display.screen[0].root, 100, 100, 400, 300);
//    X.MapWindow(wid);
    var wid = 0x440000a;
    var appmenu = bus.getService('com.canonical.AppMenu.Registrar');
    appmenu.getInterface('/com/canonical/AppMenu/Registrar', 'com.canonical.AppMenu.Registrar', function(err, registrar) {
       console.log(registrar);
       var menuObjPath = '/com/sidorares/menus/' + wid;
       var menu = {};

       var menus = 
       
       menu.GetLayout = function(parentId, recursionDepth, propertyNames) {
          console.log('=========================================', parentId, recursionDepth, propertyNames);
          console.log(arguments);
          // u(ia{sv}av)
          var result = [ 0,  // u
             [      // (
                0,  // i
                [ // a
                   ['label', ['s', 'Label Empty']], // {sv}
                   ['visible', ['b', 1]],
                   ['enabled', ['b', 1]],
                   ['children-display', ['s', 'submenu']]
                 ],
                [ // a
                   [ //v
                        '(ia{sv}av)',
                        [       // (
                          75,  // i
                          [   // a
                             ['label', ['s', '_File']], // {sv}
                             ['visible', ['b', 1]],
                             ['enabled', ['b', 1]],
                             ['children-display', ['s', 'submenu']]
                          ],
                          [], // av 
                        ]
                   ]
                ] 
            ] 
          ];
          return result; 
       };
       menu.GetGroupProperties = function() {
          //return ['test'];

          
   
          console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
          console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
          console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
          console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
          console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
          console.log(arguments);
          props  = [[  // a
                [ // (
                0, // i
                [ // a
                   ['label', ['s', 'Label Empty']], // {sv}
                   ['visible', ['b', 1]],
                   ['enabled', ['b', 1]],
                   ['children-display', ['s', 'submenu']]
                 ],
                 ], 
                 [
                 75,  // i
                 [   // a
                             ['label', ['s', '_File']], // {sv}
                             ['visible', ['b', 1]],
                             ['enabled', ['b', 1]]
                             //,['children-display', ['s', 'submenu']]
                 ]
                 ]
          ]];
          /* 
{u'IconThemePath': [],
 u'Status': u'normal',
 u'TextDirection': u'ltr',
 u'Version': 3L}
*/


          return props;
                 
       }
       menu.IconThemePath = [];
       menu.Status = 'normal';
       menu.TextDirection = 'ltr';
       menu.Version = 3;
       
       bus.exportInterface(menu,  menuObjPath, DbusMenuIface);
       registrar.RegisterWindow(wid, menuObjPath, function() {});
    });

//    X.on('error', function(err) { console.log(err) });
//});
