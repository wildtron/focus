(function(root){
	var motherServer = '192.168.1.52',
		port = 3000,
		localServer = 'http://localhost:10610',
		url = 'http://' + motherServer + ':' + port + '/',
		socket,
		setSessionTimer,

		/**
			Cached DOM elements
		*/
		doc = root.document;
		chat_area = doc.getElementById('chat_area'),
		chat_content = doc.getElementById('chat_content'),
		username = doc.getElementById('username_input'),
		student_number = doc.getElementById('student_number_input'),
		password = doc.getElementById('password_input'),

		/**
			Helper functions
		*/

		toTitleCase = function (str) {
			return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		},
		connectSocket = function () {
			loadScript(url + 'socket.io/socket.io.js',
			function () {
				socket = io.connect(url);
				socket.emit('s_join_room', cookies.get('FOCUSSESSID'));
				socket.on('history', function (history) {
					history.forEach(function (h) {
						if (h.from_student)
							chat_content.innerHTML += '<li>' + h.message + '</li>';
						else
							chat_content.innerHTML += '<li class="incoming">' + h.message + '</li>';
					});
					chat_content.parentElement.scrollTop = chat_content.parentElement.scrollHeight;
				});
				socket.on('update_chat', function (message) {
					chat_content.innerHTML += '<li class="incoming">' + message + '</li>';
					chat_content.parentElement.scrollTop = chat_content.parentElement.scrollHeight;
				});
				socket.on('warning', function (message) {
					console.dir('warning');
					console.dir(message);
				});
				socket.on('disconnect', function () {
					console.log('disconnect');
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
		};


	root.ondrop = root.ondragover = function(e) { e.preventDefault(); return false; };

	if (typeof require !== 'undefined') {
		require('nw.gui').Window.get().on('close', root.minimize);
	}

	doc.getElementById('sign_in_button').addEventListener('click', function (e) {
		var self = e.target,
			response,
			front = doc.getElementById('front_section'),
			progress = doc.getElementById('progress_bar'),
			request = new XMLHttpRequest(),
			loginSuccess = function () {
				cookies.set('FOCUSSESSID', response.access_token, 10800);
				cookies.set('name', toTitleCase(response.first_name + ' ' + response.last_name), 10800);
				cookies.set('student_number', student_number.value, 10800);

				connectSocket();

				doc.getElementById('name_div').innerHTML = cookies.get('name');
				self.innerHTML = 'Login Success!';
				self.className = 'sign_in_success';

				setTimeout(function () {
					doc.getElementById('front_section').className = 'current-to-left';
					doc.getElementById('main_section').className = 'right-to-current';
					self.className = '';
					self.innerHTML = 'Login via SystemOne';
					student_number.disabled = student_number.value = password.value = username.value = password.disabled = username.disabled = '';
					chat_area.focus();
				}, 250);
			};

		front.style['-webkit-filter'] = 'blur(2px)';
		progress.style['display'] = 'block';
		student_number.disabled = password.disabled = username.disabled = 'disabled';
		request.open('POST', url + 'student/login', true);
		request.setRequestHeader('Cookie', document.cookie);
		request.setRequestHeader('Access-Control-Allow-Credentials', true);
		request.setRequestHeader('Content-Type', 'application/json');
		request.send(JSON.stringify({
			username : username.value,
			student_number : student_number.value,
			password : password.value
		}));

		request.onreadystatechange = function(event) {
			var xhr = event.target;

			if (xhr.status == 401 && xhr.readyState == 4) {
				self.innerHTML = 'Error!';
				front.style['-webkit-filter'] = '';
				progress.style.display = 'none';
				self.className = 'sign_in_error';
				setTimeout(function () {
					self.className = '';
					self.innerHTML = 'Login via SystemOne';
					student_number.disabled = password.disabled = username.disabled = '';
					username.focus();
				}, 2000);
			}
			else if (xhr.status == 0 && xhr.readyState == 4) {
				front.style['-webkit-filter'] = '';
				progress.style['display'] = 'none';
				alert('It looks like the server is unreacheable in the moment.\n Please consult the instructor.');
				student_number.disabled = password.disabled = username.disabled = '';
			}
			else if (xhr.status == 200 && xhr.readyState == 4) {
				response = JSON.parse(xhr.responseText);

				// set progress bar
				front.style['-webkit-filter'] = '';
				progress.style['display'] = 'none';


				// if application, must connect to localServer
				if (typeof require !== 'undefined') {
					// Send the FOCUSSESSID to local server. Do this until local server sets the session
					request = new XMLHttpRequest();
					request.open('POST', localServer, true);
					request.setRequestHeader('Content-Type', 'application/json');
					request.send(JSON.stringify({
						session : cookies.get('FOCUSSESSID')
					}));
					request.onreadystatechange = function(event){
						var xhr = event.target;

						if (xhr.status == 200 && xhr.readyState == 4) {
							loginSuccess();
						}
						else if (xhr.status == 401 && xhr.readyState == 4) {
							alert('Please re-login.');
							doc.getElementById('logout_button').click();
						}
					}
				}

				// browser-based client
				else {
					loginSuccess();
				}
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

		// destroy session in motherServer
		logoutRequest(url + 'student/logout', {access_token : cookies.get('FOCUSSESSID')});
		// destroy session in localServer
		logoutRequest(localServer, {destroy : cookies.get('FOCUSSESSID')});

		// clear cookies
		cookies.remove('FOCUSSESSID');
		cookies.remove('first_name');
		cookies.remove('last_name');
		cookies.remove('student_number')

		chat_content.innerHTML = '<li class="incoming"><b>Welcome! </b><br />To send a message press Ctrl+Enter.<br />To send a file, drag and drop it on the text area below.</li>';
		doc.getElementById('front_section').className = 'left-to-current';
		doc.getElementById('main_section').className = 'current-to-right';
		username.focus();
	}, true);

	chat_area.addEventListener('keypress', function (e) {
		if (e.ctrlKey && e.keyCode == 10) {
			var li = doc.createElement('li');

			li.appendChild(doc.createTextNode(e.target.value));
			chat_content.appendChild(li);

			e.target.value = '';
			chat_content.parentElement.scrollTop = chat_content.parentElement.scrollHeight

			socket.emit('s_update_chat', e.target.value);
		}
	}, true);

	chat_area.addEventListener('dragend', function (e) {
		var self = e.target;
		self.disabled = false;
		self.className = '';
		self.value = '';
	}, true);

	chat_area.addEventListener('dragstart' , function () {
		var self = e.target;
		self.value = 'Drag file here to upload';
		self.className = 'hover';
	}, true);

	chat_area.addEventListener('drop', function (e) {
		var formData = new FormData(),
			xhr = new XMLHttpRequest(),
			self = e.target,
			files_count = e.dataTransfer.files.length;

		e.preventDefault();

		if (!confirm('Are you sure you want to submit this file(s)?')) {
			return false;
		}

		e.dataTransfer.files.forEach(function (f) {
			formData.append('file', f);
		});

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
						self.disabled = false;
						self.className = self.value = '';
						chat_content.innerHTML += '<li class="incoming">' + JSON.parse(xhr.responseText).message + '</li>';
						socket.emit('update_chat', {
							message : JSON.parse(xhr.responseText).message,
							student_number : cookies.get('student_number')
						});
						chat_content.parentElement.scrollTop = chat_content.parentElement.scrollHeight
					}, 500);
				}, 1000);
			} else {
				setTimeout(function () {
					self.value = 'Failed!';
					self.className += ' failed';
					setTimeout(function () {
						self.disabled = false;
						self.className = self.value = '';
						chat_content.innerHTML += '<li class="incoming">Failed to submit ' + files_count + ' file' + (files_count > 1 ? 's' : '') + '. Please try again.</li>';
					}, 500);
				}, 500);
			}
		};

		xhr.send(formData);

		return false;
	}, true);



	if(cookies.has('FOCUSSESSID')){
	/*
	 * This is not yet complete. When FOCUSSESSID exists, the client should check from the motherServer
	 * if it is a valid session. If it is not, the session is destroyed and the client is logged out
	 * But if it exists, the server renews the session so that it is updated
	 */
		password.value = ' ';
		doc.getElementById('sign_in_button').click();
	}

	username.focus();
}(this));
