(function (window) {
	var root = {};

    root.xhr = function (method, url, data, success_cb, error_cb, headers) {
        var request = new XMLHttpRequest(),
            i;

        request.open(method, url, true);
        request.setRequestHeader('Content-Type', 'application/json');

        if (headers)
            for (i in headers)
                request.setRequestHeader(i, headers[i]);

        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                success_cb && success_cb(JSON.parse(request.responseText), request);
            }
        };

        request.onerror = function() {
            error_cb && error_cb(request);
        };

        request.send(JSON.stringify(data || {}));
    };

	root.getClosestWindow = function (e) {
		try {
			while (true) {
				if (e.parentNode.classList.contains('window_div'))
					return e.parentNode;
				e = e.parentNode;
			}
		} catch (e) {
			return {id : ''};
		}
	};

	root.toTitleCase = function (str) {
		return str.replace(/\w\S*/g, function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	};

	root.randomEffect = function () {
		return ['top', 'bottom', 'left', 'right'][parseInt(Math.random() * 4, 10)];
	};

	root.loadScript = function (url, callback) {
		var script = window.document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		script.onload = callback;
		script.onreadystatechange = callback;
		window.document.getElementsByTagName('head')[0].appendChild(script);
	};

	root.wbr = function (str) {
		return str.replace(RegExp("(\\w{30})(\\w)", "g"), function(all, text, char){
			return text + " " + char;
		});
	};

	Date.prototype.toJSONLocal = ( function() {
		var addZ = function (n) {
			return (n < 10 ? '0' : '') + n;
		};
		return function () {
		  return this.getFullYear() + '-' +
				 addZ(this.getMonth() + 1) + '-' +
				 addZ(this.getDate());
		};
	} () );

	window.util = root;
}(this));
