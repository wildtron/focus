(function (root) {
    root.xhr = function (method, url, data, success_cb, error_cb, headers) {
        var request = new XMLHttpRequest,
            i;
        request.open(method, url, true);
        request.setRequestHeader('Content-Type', 'application/json');

        if (headers)
            for (i in headers)
                request.setRequestHeader(i, headers[i]);

        request.onload = function () {
            if (request.readyState === 4) {
                success_cb && success_cb(JSON.parse(request.responseText), request);
            }
        };

        request.onerror = function() {
            error_cb && error_cb(request);
        };

        request.send(JSON.stringify(data || {}));
    }
}(this));