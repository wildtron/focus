/*
 *  script.js
 *  - Contains full client app logic
*/

(function (root) {
	var socket,
		url = 'http://10.0.5.49:8080/',
		localServer = 'http://localhost:10610',

		/**
			Cached DOM elements
		*/

		doc = root.document;
		chat_area = doc.getElementById('chat_area'),
		password = doc.getElementById('password_input'),
		username = doc.getElementById('username_input'),
		chat_content = doc.getElementById('chat_content'),
		student_number = doc.getElementById('student_number_input'),

		/**
			Helper functions
		*/


		wbr = function (str) {
			return str.replace(RegExp("(\\w{30})(\\w)", "g"), function(all, text, char){
				return text + " " + char;
			});
		},
		toTitleCase = function (str) {
			return str.replace(/\w\S*/g, function (txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		},
		connectSocket = function () {
			loadScript(url + 'socket.io/socket.io.js',
			function () {
				socket = io.connect(url);
				socket.emit('s_join_room', cookies.get('FOCUSSESSID'));

				socket.on('history', function (history) {
					history.forEach(function (h) {
						var li = doc.createElement('li');
						li.appendChild(doc.createTextNode(h.message));
						if (!h.from_student) {
							li.className = 'incoming';
						}
						chat_content.appendChild(li);
					});
					chat_content.parentElement.scrollTop = chat_content.parentElement.scrollHeight;
				});

				socket.on('update_chat', function (message) {
					var li = doc.createElement('li');
					li.className = 'incoming';
					li.appendChild(doc.createTextNode(message));
					chat_content.appendChild(li);
					chat_content.parentElement.scrollTop = chat_content.parentElement.scrollHeight;
				});

				socket.on('warning', function (message) {
					console.dir(message);
				});

				socket.on('online', function () {
					doc.getElementById('name_div').className = 'online';
				});

				socket.on('disconnect', function () {
					doc.getElementById('name_div').className = '';
				});
			});
		},
		loadScript = function (url, callback) {
			var script = doc.createElement('script');
			script.type = 'text/javascript';
			script.src = url;
			script.onload = callback;
			script.onreadystatechange = callback;
			doc.getElementsByTagName('head')[0].appendChild(script);
		},
		resetLoginForm = function () {
			var button = doc.getElementById('sign_in_button');
			doc.getElementById('front_section').style['-webkit-filter'] = '';
			doc.getElementById('progress_bar').style.display = 'none';
			setTimeout(function () {
				button.className = '';
				button.innerHTML = 'Login via SystemOne';
				student_number.disabled = password.disabled = username.disabled = '';
				student_number.focus();
			}, 1500);
		},
		resetChatArea = function (e) {
			e && e.preventDefault();
			chat_area.className = chat_area.value = '';
			chat_area.disabled = false;
			chat_area.focus();
		},
		loginIfCookieExists = function () {
			if (cookies.has('FOCUSSESSID')) {
				student_number.value = username.value = password.value = ' ';
				doc.getElementById('sign_in_button').click();
			}
		};

	/**
		Attach Events
	*/


    (function(){
        var req = new XMLHttpRequest();
        req.open('GET', 'http://ricolindo.uplb.edu.ph:8080/config.json', false);
        req.send();

        req.onreadyStateChange = function(){
            var xhr = event.target;
            if(xhr.readyState === 4 && xhr.status === 200){
                var parse = JSON.parse(xhr.responseText);
            }
        };
    })();


	doc.getElementById('sign_in_button').addEventListener('click', function (e) {
		var self = e.target,
			request = new XMLHttpRequest(),
			loginSuccess = function (access_token, instructor) {

				cookies.set('FOCUSSESSID', access_token, 10800);

				chat_content.innerHTML = '<li class="incoming"><button class="x" title="Close" onclick="this.parentNode.remove()">&#x2716;</button><h2>Welcome to :FOCUS Desktop App </h2><br /> Your attendance is now recorded. <br /> Here are the things that you can do: <br /><br />1. Chat with your instructor and ask for help when he/she is away. (press Ctrl + Enter to send a message)<br />2. Submit a file by dragging and dropping it on the text area below.<br /><br />Thank you.<br /><br />P.S. Please do not logout until instructed to. <br />P.S.S. Your computer is also being monitored. Better stay focused on the exercise. ;) </li>';

				connectSocket();

				doc.getElementById('name_div').innerHTML = 'Chat with ' + toTitleCase(instructor);
				self.innerHTML = 'Login success!';
				self.className = 'sign_in_success';

				setTimeout(function () {
					doc.getElementById('front_section').className = 'current-to-left';
					doc.getElementById('main_section').className = 'right-to-current';
					resetLoginForm();
					chat_area.focus();
					student_number.value = username.value = password.value = '';
				}, 250);
			};

		if (username.value === '' ||
			password.value === '' ||
			student_number.value === '')
			return false;

		// setup progress bar
		doc.getElementById('front_section').style['-webkit-filter'] = 'blur(2px)';
		doc.getElementById('progress_bar').style['display'] = 'block';

		// disable text fields to prevent request overlaps
		student_number.disabled = password.disabled = username.disabled = 'disabled';

		// send login request
		request.open('POST', url + 'student/login', true);
		request.setRequestHeader('Content-Type', 'application/json');
		request.send(JSON.stringify({
			username : username.value,
			student_number : student_number.value,
			password : password.value,
			access_token : cookies.get('FOCUSSESSID') || '#'
		}));

		cookies.remove('FOCUSSESSID');

		request.onreadystatechange = function(event) {
			var xhr = event.target,
				response;

			// something is missing
			if (xhr.status === 400 && xhr.readyState === 4) {
				response = JSON.parse(xhr.responseText);
				alert(response.message);
				self.innerHTML = 'Error!';
				self.className = 'sign_in_error';
				resetLoginForm();
			}

			// wrong username or password
			else if (xhr.status === 401 && xhr.readyState === 4) {
				response = JSON.parse(xhr.responseText);
				self.innerHTML = 'Error!';
				self.className = 'sign_in_error';
				resetLoginForm();
				if (username.value === ' ') {
					student_number.value = username.value = password.value = '';
				}
			}

			//success
			else if (xhr.status === 200 && xhr.readyState === 4) {
				response = JSON.parse(xhr.responseText);

				// if application, must connect to localServer
				if (typeof require !== 'undefined') {
					// Send the FOCUSSESSID to local server. Do this until local server sets the session
					request = new XMLHttpRequest();
					request.open('POST', localServer, true);
					request.setRequestHeader('Content-Type', 'application/json');
					request.send(JSON.stringify({
						session : response.access_token
					}));
					request.onreadystatechange = function (event) {
						var xhr = event.target;
						if (xhr.status === 200 && xhr.readyState === 4) {
							loginSuccess(response.access_token, response.instructor);
						}
						else if (xhr.status === 401 && xhr.readyState === 4) {
							alert('Please re-login.');
							self.innerHTML = 'Error!';
							self.className = 'sign_in_error';
							resetLoginForm();
						}
					}
				}

				// browser-based client
				else {
					self.innerHTML = 'Login Success!';
					self.className = 'sign_in_success';
					loginSuccess(response.access_token, response.instructor);
				}
			}

			// unknown problem
			else if (xhr.readyState === 4) {
				alert('It looks like the server is unreacheable in the moment.\n Please consult the instructor.');
				self.innerHTML = 'Error!';
				self.className = 'sign_in_error';
				resetLoginForm();
			}
		}
	}, true);

	doc.getElementById('logout_button').addEventListener('click', function () {
		var logoutRequest = function (url, payload) {
			var request = new XMLHttpRequest();
			request.open('POST', url, true);
			request.setRequestHeader('Content-Type', 'application/json');
			request.send(JSON.stringify(payload));
		};

		socket.disconnect();

		// destroy session in motherServer
		logoutRequest(url + 'student/logout', {access_token : cookies.get('FOCUSSESSID')});
		// destroy session in localServer
		logoutRequest(localServer, {destroy : cookies.get('FOCUSSESSID')});

		// clear cookie
		cookies.remove('FOCUSSESSID');

		doc.getElementById('front_section').className = 'left-to-current';
		doc.getElementById('main_section').className = 'current-to-right';
		student_number.value = password.value = username.value = '';
		resetLoginForm();
	}, true);

	chat_area.addEventListener('keypress', function (e) {
		if (e.ctrlKey && e.keyCode == 10) {
			var li = doc.createElement('li');

			li.appendChild(doc.createTextNode(wbr(e.target.value)));
			chat_content.appendChild(li);

			socket.emit('s_update_chat', e.target.value);

			e.target.value = '';
			chat_content.parentElement.scrollTop = chat_content.parentElement.scrollHeight
		}
	}, true);


	root.addEventListener('dragover' , function (e) {
		chat_area.value = 'Drag file here to upload';
		chat_area.className = 'hover';
		e.preventDefault();
	}, true);

	root.addEventListener('dragleave', resetChatArea, true);
	root.addEventListener('drop' , resetChatArea, true);

	chat_area.addEventListener('drop', function (e) {
		var formData = new FormData(),
			xhr = new XMLHttpRequest(),
			self = e.target,
			files_count = e.dataTransfer.files.length,
			i = files_count;

		e.preventDefault();

		if (!confirm('Are you sure you want to submit this file(s)?')) {
			resetChatArea();
			return false;
		}

		while (i--) {
			formData.append('file', e.dataTransfer.files[i]);
		};

		formData.append('access_token', cookies.get('FOCUSSESSID'));

		self.value = 'Uploading...';
		self.className = 'uploading';
		self.disabled = true;

		xhr.open('POST', url + 'student/submit', true);
		xhr.onload = function () {
			if (xhr.status === 200) {
				setTimeout(function () {
					self.value = 'Success!';
					self.className += ' success';
					setTimeout(function () {
						resetChatArea();
						chat_content.innerHTML += '<li class="incoming">' + JSON.parse(xhr.responseText).message + '</li>';
						socket.emit('s_update_chat', JSON.parse(xhr.responseText).message);
						chat_content.parentElement.scrollTop = chat_content.parentElement.scrollHeight
					}, 500);
				}, 1000);
			} else {
				setTimeout(function () {
					self.value = 'Failed!';
					self.className += ' failed';
					setTimeout(function () {
						resetChatArea();
						chat_content.innerHTML += '<li class="incoming">Failed to submit ' + files_count + ' file' + (files_count > 1 ? 's' : '') + '. Please try again.</li>';
					}, 500);
				}, 500);
			}
		};

		xhr.send(formData);

		return false;
	}, true);


	/**
		Fix UI if via browser
	*/

	if (typeof require === 'undefined') {
		(root.onresize = function () {
			var temp1 = doc.getElementsByTagName('section'),
				i = temp1.length;
			while (i--) {
				temp1[i].style.height = root.innerHeight + 'px';
				temp1[i].style.width = root.innerWidth + 'px';
			}
			temp1 = doc.getElementById('chat_div').style;
			temp1.maxHeight = temp1.height = (root.innerHeight * 0.7) + 'px';
			temp1 = doc.getElementById('chat_area').style;
			temp1.width = (root.innerWidth - 20) + 'px';
			temp1.height = (root.innerHeight * 0.22) + 'px';
		})();
	}


	/**
		Game!
	*/

    (function () {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://ricolindo.uplb.edu.ph:8080/config.json', true);

        xhr.onreadystatechange = function () {
			var data;
            if(xhr.readyState === 4 && xhr.status === 200){
				data = JSON.parse(xhr.responseText);
				url = 'http://' + data.server + ':' + data.port + '/';
            }
			if (xhr.readyState === 4) {
				loginIfCookieExists();
            }
        };
        xhr.send();
    })();

	student_number.focus();
} (this) );
