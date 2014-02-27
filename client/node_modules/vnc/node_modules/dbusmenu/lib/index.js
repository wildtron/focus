var EventEmitter = require('events').EventEmitter;

module.exports.createMenu = function(bus, xid, menuPath, menu) {
    return new Menu(bus, xid, menuPath, menu);
}

function Menu(bus, xid, menuPath, menu)
{
    var self = this;
    bus.invoke({
        path: '/com/canonical/AppMenu/Registrar',
        destination: 'com.canonical.AppMenu.Registrar',
        'interface': 'com.canonical.AppMenu.Registrar', 
        member: 'RegisterWindow',
        signature: 'uo',
        body: [xid, menuPath]
    }, function(err) {
        console.log('registered!');
    });

    var findItem = function(id, menu) {
        if (menu.id === id)
            return menu;
        var sm, result;
        if (menu.submenu) {
            for (sm = 0; sm < menu.submenu.length; ++sm)
            {
                result = findItem(id, menu.submenu[sm]);
                if (result)
                    return result;
            }
        }
        return null;
    }

    bus.setMethodCallHandler(menuPath, 'com.canonical.dbusmenu', 'GetLayout', [function(id, recursionDepth, properties) {
          var menuItem = findItem(id, menu);
          if (!menuItem) {
              console.log("NO SUCH ITEM!");
              process.exit(0);
          }

          function jsonMenuToDbus(item) {
              console.log("JSONMENU 2 DBUS", item);

              // ia{sv}av
              var props = [];
              var js2dbus = {
                  'boolean': 'b',
                  'number':  'i',
                  'string':  's'
              };
              var propItem;
              for (prop in item) {
                  if (prop != 'id' && prop != 'submenu') {
                      propItem = [prop];
                      if (prop === 'shortcut') {
                          propItem.push(['aas', item.shortcut]);
                      } else {
                          propItem.push([js2dbus[typeof item[prop]], item[prop]]);
                      }
                      props.push(propItem);
                  }
              }
              var submenu = [];
              if (item.submenu) {
                  item.submenu.forEach(function(subitem) {
                      submenu.push(['(ia{sv}av)', [jsonMenuToDbus(subitem)]]);
                  });
              }
              result = [item.id, props, submenu];
              return result;
          }
          
          var result = [ 0, jsonMenuToDbus(menuItem) ]; // 0 == revision
          return result;
    }, 
          'u(ia{sv}av)'
    ]);

    bus.setMethodCallHandler(menuPath, 'com.canonical.dbusmenu', 'GetGroupProperties', [function(ids, properties) {
           var result = [];
           ids.forEach(function(id) {
               var item = findItem(id, menu);

               var props = [];
               var js2dbus = {
                   'boolean': 'b',
                   'number':  'i',
                   'string':  's'
               };
               var propItem;
               for (prop in item) {
                   if (prop != 'id' && prop != 'submenu') {
                       propItem = [prop];
                       if (prop === 'shortcut') {
                           propItem.push(['aas', item.shortcut]);
                       } else {
                           propItem.push([js2dbus[typeof item[prop]], item[prop]]);
                       }
                       props.push(propItem);
                   }
               }

               result.push([id, props]);
           });
           return [result];
    },
           'a(ia{sv})'
    ]);


    bus.setMethodCallHandler(menuPath, 'com.canonical.dbusmenu', 'Event', [
       function(id, eventId, data, timestamp) {
           var item = findItem(id, menu);
           self.emit(eventId, id, item, timestamp);
       },
       ''  // result signature
    ]);

    bus.setMethodCallHandler(menuPath, 'com.canonical.dbusmenu', 'AboutToShow', [
       function(id) {
           self.emit('beforeshow', id, findItem(id, menu));
           var item = findItem(id, menu);
           var needsUpdate = 0;
           if (item.needsUpdate === true) {
               needsUpdate = 1;
               delete item.needsUpdate;
           }
           return [needsUpdate];
       },
       'b' // result signature - boolean
    ]);

    //bus.setMethodCallHandler(menuPath, 'org.freedesktop.DBus.Properties', 'GetAll',  [function(interfaceName) {
    //       console.log(interfaceName);
    //       if (intrfaceName != 'com.canonical.dbusmenu')
    //           throw new Error('org.freedesktop.DBus.Error.UnknownMethod');
    //       return [ 
    //           ['name', ['s', 'TaDam'] ]
    //       ];
    //}, 
    //      'av'
    //]);

    bus.sendSignal(menuPath, 'com.canonical.dbusmenu', 'LayoutUpdated', 'ui', [0, 0]);
}
var util = require('util');
util.inherits(Menu, EventEmitter);
