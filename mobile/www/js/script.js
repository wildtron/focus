(function (root) {
    var temp,
		_this,
		current,
		doc = root.document,
		url = 'http://localhost:3000/',


		/** Helper Functions **/
		xhr = function (method, url, data, success_cb, error_cb, headers) {
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
		},
		pollUpdate = function ( ) {

		},
        toTitleCase = function (str) {
            return str.replace(/\w\S*/g, function (txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
        },
        getStudentBySN = function (sn) {
            var cache = _this.class.students,
                i = cache.length;
            while (i--)
                if (cache[i]._id === sn)
                    return cache[i];
        },
        animate = function (o, d) {
            var end_value = parseFloat(o.style.width),
                delta = end_value / 300 / 0.06,
                frame = 0,
                handle = setInterval(function() {
                    var value = delta * (frame += 1);
                    o.style.left === '' && (o.style.left = '0px');
                    o.style.left = parseFloat(o.style.left) + ((d ? 1 : -1) * delta) + 'px';
                    value >= end_value && clearInterval(handle);
                }, 1 / 0.06);
        },
        initList = function () {
            var list = doc.getElementById('list_ul'),
				temp,
				i,
				transition = function (e) {
                    var s = getStudentBySN(e.target.id);
					current = s;
                    animate(doc.getElementById('details_section'), 0);
                    animate(doc.getElementById('students_section'), 0);
                    doc.getElementById('student_name_div').innerHTML = toTitleCase(s.first_name + ' ' + s.last_name);
                    doc.getElementById('details_div').innerHTML = [s._id, 'Status : ' + 'absent', 'Applications :' ].concat(s.applications).join('<br />');
                };
            list.innerHTML = '';
			_this.class.students.forEach(function (s) {
				var li = doc.createElement('li');
				li.appendChild(doc.createTextNode(toTitleCase(s.first_name + ' ' + s.last_name)));
				li.setAttribute('id', s._id);
				li.setAttribute('class', 'absent details_button');
                list.appendChild(li);;
            });
            temp = doc.getElementsByClassName('details_button');
            i = temp.length;
            while (i--) {
                temp[i].addEventListener('click', transition, true);
                temp[i].addEventListener('touchstart', transition, true);
            }
        },
		login = function () {
			var username = doc.getElementById('username_input'),
				password = doc.getElementById('password_input');
			password.disabled = username.disabled = 'disabled';

			// send to server

			xhr('POST', url + 'instructor/login', {
				username : username.value,
				password : password.value
			}, function (response, req) {

				if (req.readyState === 4 && req.status === 200) {
					_this = response;

					if (!response.class.message) {
						initList();
					}
					else {
						doc.getElementById('list_ul').innerHTML += '<li>Sorry but you don\'t have class as of this moment.</li>';
					}

					this.innerHTML = 'Login Success!';
					this.className = 'sign_in_success';

					setTimeout(function (self) {
						doc.getElementById('front_section').className = 'current-to-left';
						animate(doc.getElementById('front_section'), 0);
						animate(doc.getElementById('students_section'), 0);
						self.className = '';
						self.innerHTML = 'Sign In';
						password.value = username.value = password.disabled = username.disabled = '';
					}, 250, this);
				}
				else if (req.readyState === 4) {
					this.innerHTML = 'Error!';
					this.className = 'sign_in_error';
					setTimeout(function (self) {
						self.className = '';
						self.innerHTML = 'Sign In';
						password.disabled = username.disabled = '';
						username.focus();
					}, 1000, this);
				}
			});
		},
		backTransition = function () {
			animate(doc.getElementById('details_section'), 1);
			animate(doc.getElementById('students_section'), 1);
		},
		logout = function () {
			animate(doc.getElementById('front_section'), 1);
			animate(doc.getElementById('students_section'), 1);
			doc.getElementById('username_input').focus();
		},
		command = function (e) {
			var id = e.target.id,
				ip = 'http://' + current.ip_address + ':8286';
			switch (id) {
				case 'lock_button' :   xhr('POST', ip, {command : 'lock', hash : current.hash, salt : current.salt}, function (data) {
											if (data.status === 'Locking') {
												window.childNodes[0].setAttribute('src', '/img/click-to-unlock.png');
												window.className = window.className.replace(/off|active|idle/g, 'locked');
											}
										});
										break;
				case 'shutdown_button' :   xhr('POST', ip, {command : 'shutdown', hash : current.hash, salt : current.salt});
										break;
				case 'logout_button' : xhr('POST', ip, {command : 'logout', hash : current.hash, salt : current.salt});
										break;
			}
		};

	/** Attach Events **/

    (root.onresize = function () {
        var temp1 = doc.getElementsByTagName('section'),
            i = temp1.length;
        while (i--) {
            temp1[i].style.height = root.innerHeight + 'px';
            temp1[i].style.width = root.innerWidth + 'px';
        }
    })();

    temp = doc.getElementById('back_button');
	temp.addEventListener('click', backTransition, true);
	temp.addEventListener('touchstart', backTransition, true);

    temp = doc.getElementById('sign_in_button');
	temp.addEventListener('click', login, true);
	temp.addEventListener('touchstart', login, true);

    temp = doc.getElementById('logout_button');
	temp.addEventListener('click', logout, true);
	temp.addEventListener('touchstart', logout, true);

	['shutdown', 'lock', 'logoff'].forEach(function (button) {
		var temp = doc.getElementById(button + '_button');
		temp.addEventListener('click', command, true);
		temp.addEventListener('touchstart', command, true);
	});

    doc.getElementById('username_input').focus();

}(this));
