(function (root) {
    var _this,
        socket,
        blinkTimer,
		currentChat,
        refreshInterval,
		new_messages = {},
		util = root.util,
		doc = root.document,
		chatBlinkIntervals = {},
        url = 'http://10.0.5.49:8080/',

		/**
			Page Actions
		*/

        login = function () {
            doc.getElementById('username_input').focus();
        },
        feed = function () {
            var active = doc.getElementsByClassName('active_section')[0];

			active.className = 'current-to-' + util.randomEffect();
			doc.getElementById('feed_section').className = util.randomEffect() + '-to-current active_section';

            doc.getElementsByClassName('active_nav')[0] && (doc.getElementsByClassName('active_nav')[0].className = '');
            doc.getElementById('feed_a').className = 'active_nav';
            doc.getElementById('header_title_div').innerHTML = '<span class="twilight">' + _this.class._id + '</span> on <span class="twilight">' + _this.class.room + '</span>';

            root.setTimeout(setupScreenshots, 500);
        },
        records = function () {
            var active = doc.getElementsByClassName('active_section')[0],
                temp = doc.getElementById('records_section_select');

            temp.innerHTML = '';
			_this.classes.forEach(function (c) {
				var option = doc.createElement('option');
				option.setAttribute('value', c);
				option.appendChild(doc.createTextNode(c));
                temp.appendChild(option);
            });

			active.className = 'current-to-' + util.randomEffect();
			doc.getElementById('records_section').className = util.randomEffect() + '-to-current active_section';

            doc.getElementsByClassName('active_nav')[0] && (doc.getElementsByClassName('active_nav')[0].className = '');
            doc.getElementById('records_a').className = 'active_nav';
            doc.getElementById('header_title_div').innerHTML = 'RECORDS';

			getRecords();
        },
        submissions = function () {
            var active = doc.getElementsByClassName('active_section')[0],
				temp;

			active.className = 'current-to-' + util.randomEffect();
			doc.getElementById('submissions_section').className = util.randomEffect() + '-to-current active_section';

            doc.getElementsByClassName('active_nav')[0].className = '';
            doc.getElementById('submissions_a').className = 'active_nav';
            doc.getElementById('header_title_div').innerHTML = 'SUBMISSIONS';
			temp = doc.getElementById('section_submissions_select');
			temp.innerHTML = '';
			_this.classes.forEach(function (c) {
				var option = doc.createElement('option');
				option.setAttribute('value', c);
				option.appendChild(doc.createTextNode(c));
                temp.appendChild(option);
			});
			doc.getElementById('students_submissions_select').innerHTML = '<option value="all">Everyone</option>';

			getFiles();
        },
        logs = function () {
            var active = doc.getElementsByClassName('active_section')[0],
				temp;
            if (active.id !== 'logs_section') {
                active.className = 'current-to-' + util.randomEffect();
                doc.getElementById('logs_section').className = util.randomEffect() + '-to-current active_section';
            }
            doc.getElementsByClassName('active_nav')[0].className = '';
            doc.getElementById('logs_a').className = 'active_nav';
            doc.getElementById('header_title_div').innerHTML = 'LOGS';
			temp = doc.getElementById('section_logs_select');
			temp.innerHTML = '';
			_this.classes.forEach(function (a) {
				temp.innerHTML += '<option value="'+a+'">'+a+'</option>';
			});
			temp = new Date();
			temp.setDate(temp.getDate() - 7);
			doc.getElementById('from_logs_input').value = temp.toJSONLocal().substring(0, 10);
			doc.getElementById('to_logs_input').value = (new Date()).toJSONLocal().substring(0, 10);
			root.setTimeout(getLogs, 500);
        },
        logout = function () {
			clearInterval(refreshInterval);
            util.xhr('POST', url + 'instructor/logout');
            doc.getElementsByClassName('active_nav')[0].className = '';
            doc.getElementsByClassName('active_section')[0].className = 'current-to-' + util.randomEffect();
            doc.getElementById('front_section').className = util.randomEffect() + '-to-current';
            doc.getElementById('nav_section').className = 'current-to-left';
            doc.getElementById('header_section').className = 'current-to-top';
            page.show('login');
        },


		/**
			Helpers functions
		*/

        buildWindow = function (s) {
			var window_div = doc.createElement('div'),
				img = doc.createElement('img'),
				button = doc.createElement('button'),
				dom = doc.getElementById('feed_body_div'),
				temp;

			window_div.setAttribute('id', s._id);
			window_div.className = 'window_div off';

			img.setAttribute('src', 'http://' + s.ip_address + ':8286/?command=jpeg' + '&hash=' + s.hash + '&salt=' + s.salt);
			img.setAttribute('alt', util.toTitleCase(s.first_name) + '\'s Computer');
			img.setAttribute('title', 'Click to open VNC');
			img.setAttribute('width', 350);
			img.setAttribute('height', 200);
			img.setAttribute('data-sn', s._id);
			img.setAttribute('onerror', 'javascript:this.src="/img/not-connected.png";this.parentNode&&(this.parentNode.className="window_div not_connected")');

			button.className = 'chat_button';
			button.setAttribute('id', s._id + '_chat_button');
			button.setAttribute('title', 'Chat with '+ util.toTitleCase(s.first_name));

			window_div.appendChild(img);
			window_div.appendChild(doc.createTextNode(s.name +' | '+ s._id));
			window_div.appendChild(button);

			window_div.innerHTML += '<div class="unit_mngr_div"> \
						<button title="Shutdown" class="shutdown"></button>  \
						<button title="Lock" class="lock"></button>  \
						<button title="Logout" class="logout"></button> \
						<button title="Process List" class="proc_list"></button> \
						<div class="proc_list_div"></div> \
					</div>';

			if (temp = doc.getElementById(s._id)) {
				temp.parentNode.replaceChild(window_div, temp);
			}
			else {
				dom.appendChild(window_div);
			}
			util.xhr(
				'GET',
				'http://' + s.ip_address + ':8286/?command=jpeg' + '&hash=' + s.hash + '&salt=' + s.salt,
				{},
				function (data, req) {
					var window = doc.getElementById(s._id);
					if (req.status === 200) {
						if (''+req.getResponseHeader('X-Client-Locked') !== 'false') {
							window.className = window.className.replace(/off|active|idle/g, 'locked');
							window.childNodes[0].setAttribute('src', '/img/click-to-unlock.png');
						}
					}
				}
			);
		},
		setupScreenshots = function () {
            var dom = doc.getElementById('feed_body_div');
            dom.innerHTML = '';
            _this.class.students.forEach(buildWindow);
            dom.innerHTML += '<br class="clearfix" />';
            doc.getElementById('scrnsht_interval_input').value = cookies.get('interval') || 10;
			root.onfocus();
            startAutoRefresh();
        },
        startAutoRefresh = function (e) {
            var interval;
            if (e) {
                interval = e.target.value;
				if (isNaN(interval) || interval < 3) {
					e.target.value = cookies.get('interval') || 10;
				}
            }
            else {
                interval = doc.getElementById('scrnsht_interval_input').value;
            }
			cookies.set('interval', interval);
            clearInterval(refreshInterval);
            refreshInterval = setInterval(function () {
                var students = _this.class.students,
					i = students.length,
                    temp;
                while (i--) {
                    temp = doc.getElementById(students[i]._id);
                    if (!temp.classList.contains('locked') &&
						!temp.classList.contains('not_connected')
						) {
                        temp.childNodes[0].setAttribute('src', 'http://' + students[i].ip_address +
						':8286/?command=jpeg' +
						'&hash=' + students[i].hash +
						'&salt=' + students[i].salt
						);
					}
                }
            }, (+interval) * 1000);
        },
        buildChatHistory = function (history) {
            var dom = doc.getElementById('chat_list');
            dom.innerHTML = '';
			history.forEach(function (h) {
				var li = doc.createElement('li');
				li.appendChild(doc.createTextNode(h.message));
                if (h.from_student)
                    li.className = "incoming";
				dom.appendChild(li);
			});
            dom.scrollTop = dom.scrollHeight;
        },
        getStudentBySN = function (sn) {
            var cache = _this.class.students,
                i = cache.length;
            while (i--)
                if (cache[i]._id === sn)
                    return cache[i];
        },
		getFiles = function (e) {
			util.xhr('GET', url + 'section/getStudentsWithFiles?'
				+ 'section_id=' + doc.getElementById('section_submissions_select').value
				+ '&exer_number=' + doc.getElementById('exer_number_submissions_select').value
				+ '&student_number=' + doc.getElementById('students_submissions_select').value
				+ '&order=date'
				, {}, function (res, req) {
				var temp1 = doc.getElementById('students_submissions_select'),
					temp2 = doc.getElementById('files_div');
				if (req.status === 200) {
					if (!e || e.target.id === 'section_submissions_select') {
						temp1.innerHTML = '<option value="all">Everyone</option>';
					}
					temp2.innerHTML = '';
					if (res.length === 0) {
						temp2.innerHTML = 'No file found :(';
					}
					else {
						res.forEach(function (s) {
							if (!e || e.target.id === 'section_submissions_select') {
								temp1.innerHTML += '<option value="' + s._id + '">' + s.name + '</option>';
							}
							s.files&&s.files.forEach(function (f) {
								temp2.innerHTML += '	\
							<div class="file_div">	\
								<img onclick="window.open(\'/student/getFile?path=' + f.path + '\');" class="'+f.name.split('.')[1]+'" src="img/file-icon.png"	 alt="'+f.name+'" width="128" height="128" title="Click to Download\r\n\
Owner: ' + s.name +'\r\n\
File Name: ' + f.name + '\r\n\
Version: ' + f.version + '\r\n\
Size: ' + f.size + ' bytes\r\n\
Date: ' + new Date(f.date) + '"/>	\
								<div class="file_name_div">'+f.name+' v'+f.version+'</div>	\
							</div>';
							});
						});
					}
				} else {
					logout();
				}
			});
		},
		getRecords = function (e) {
			util.xhr('GET', url + 'section/getAttendance?section_id=' + doc.getElementById('records_section_select').value,
			{}, function (res, req) {
				var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
					table = doc.getElementById('attendance_table'),
					tableString = '',
					maxDays = 0,
					maxHolder,
					curDays;
				if (req.status === 200) {
					res.students.map(function (s) {
						curDays = 0;
						s.datesAttended = [];
						res.records.forEach(function (r) {
							if (r.student_number === s._id) {
								curDays++;
								s.datesAttended.push(r.date);
							}
						});
						if (curDays >= maxDays) {
							maxDays = curDays;
							maxHolder = s;
						}
						return s;
					});
				}

				tableString = '<tr><th colspan="2">Students</th>';
				maxHolder.datesAttended.forEach(function (d) {
					var a = d.split('/');
					tableString += '<th>' + months[(+a[0])-1] + ' ' + a[1] + '</th>';
				});
				tableString += '<th>Total Number of Absences</th></tr>';

				res.students.forEach(function (s) {
					var i,
						j = maxHolder.datesAttended.length;
					tableString += '<tr><td>' + s._id + '</td><td>' + s.name + '</td>';
					for (i=0; i < j; i++) {
						tableString += '<td>' + ((~s.datesAttended.indexOf(maxHolder.datesAttended[i])) ? 'P' : '<span class="blood">A</span>') +'</td>';
					}
					tableString += '<td>' + (maxDays - s.datesAttended.length)  + '</td></tr>'
				});

				table.innerHTML = tableString;
			});
		},
		getLogs = function (e) {
			var _from = new Date(doc.getElementById('to_logs_input').value),
				_fromPlusOne = new Date(_from.getTime() + (24 * 60 * 60 * 1000));;
			util.xhr('GET', url + 'instructor/getLogs?'
				+ 'section_id=' + doc.getElementById('section_logs_select').value
				+ '&from=' + +new Date(doc.getElementById('from_logs_input').value)
				+ '&to=' +  +_fromPlusOne
				+ '&student_number=' + doc.getElementById('students_logs_select').value
				, {}, function (res, req) {
				var temp1 = doc.getElementById('students_logs_select'),
					temp2 = doc.getElementById('log_div'),
					pre = doc.createElement('pre'),
					i, j;
				pre.setAttribute('id', 'logs_pre');
				temp2.innerHTML = '';
				temp2.appendChild(pre);
				if (req.status === 200) {
					if (!e || e.target.id === 'section_logs_select') {
						temp1.innerHTML = '<option value="all">Everyone</option>';
						res.students.forEach(function (s) {
							var option = doc.createElement('option');
							option.setAttribute('value', s);
							option.appendChild(doc.createTextNode(s));
							temp1.appendChild(option);
						});
					}
					for (i=0, j = res.logs.length; i < j; i++) {
						root.setTimeout(function (l) {
							var date = new Date(l.date);
							date = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + util.pad(date.getMinutes()) + ':' + util.pad(date.getSeconds());
							pre.innerHTML += date + ' ' + l.name + ' ' + l.log + '<br />';
							temp2.scrollTop = temp2.scrollHeight;
						}, 0, res.logs[i]);
					}
				} else {
					logout();
				}
			});
		},
		connectSocket = function () {
			util.loadScript(url + 'socket.io/socket.io.js',
			function () {
				socket = io.connect(url);

				socket.emit('i_join_room', cookies.get('focus'));

				socket.on('warning', function (data) {
					console.log('warning');
					console.dir(data);
				});

				socket.on('student_leave', function (sn) {
					var window = doc.getElementById(sn);
					if (window) {
						window.className = 'window_div not_connected';
						window.childNodes[0].setAttribute('src', '/img/not-connected.png');
					}
				});

				socket.on('history', buildChatHistory);

				socket.on('online', function (s) {
					if (s) {
						var student = getStudentBySN(s._id);
						if (student) {
							student.ip_address = s.ip_address;
							student.salt = s.salt;
							student.hash = s.hash;
							student.vnc = s.vnc;
						}
						else {
							_this.class.students.push(s);
						}
						buildWindow(s);
					}
				});

				socket.on('update_chat', function (student_number, message) {
					var student = getStudentBySN(student_number),
						dom = doc.getElementById('chat_list'),
						li = doc.createElement('li');

					if (currentChat === student_number) {
						li.className = 'incoming';
						li.appendChild(doc.createTextNode(message));
						dom.appendChild(li);
						dom.scrollTop = dom.scrollHeight;
					}
					else {
						doc.getElementById(student_number + '_chat_button').style.backgroundImage = 'url(../img/chat-new-icon.png)';
					}

					new_messages[student_number] = util.toTitleCase(student.first_name);
					root.onfocus();
				});

				socket.on('status', function (sn, status) {
					console.log('status update', sn, status);
					var window = doc.getElementById(sn);
					if (window && !window.classList.contains('locked'))
						window.className = 'window_div ' + status;
				});

				socket.on('disconnect', function () {
					console.log('got disconnected from the server');
				});

				socket.on('reconnecting', function () {
					console.log('reconnecting');
				});

				socket.on('reconnect', function () {
					console.log('successfully reconnected');
					socket.emit('i_join_room', cookies.get('focus'));
				});
			});
		},
		loginIfCookieExists = function () {
			if (cookies.has('focus')) {
				doc.getElementById('username_input').value = doc.getElementById('password_input').value = ' ';
				doc.getElementById('sign_in_button').click();
			}
		};


	/**
		Attach Events
	*/


	root.onfocus = function () {
		var names = '',
			i;

		clearInterval(blinkTimer);
		if (Object.keys(new_messages).length) {
			for (i in new_messages) {
				names += new_messages[i] + ', ';
			}
			blinkTimer = setInterval(function (title) {
				doc.title = doc.title == ":FOCUS" ? title : ":FOCUS";
			}, 1000,  names.replace(/,\s$/, '') + ' messaged you');
		}
		else {
			doc.title = ':FOCUS';
		}
		for (i in new_messages) {
			if (!chatBlinkIntervals[i]) {
				var temp = setInterval(function (i) {
						var window = doc.getElementById(i);
						if (window.classList.contains('new_message')) {
							window.classList.remove('new_message');
						}
						else {
							window.classList.add('new_message');
						}
					}, 800, i);
				chatBlinkIntervals[i] = temp;
			}
		}
	};

    root.onresize = function () {
        var temp1 = doc.getElementsByClassName('section_div'),
            i;
        for (i in temp1) {
            if (i > -1) {
                temp1[i].style.height = root.innerHeight - 74 + 'px',
                temp1[i].style.width = root.innerWidth - 70 + 'px';
            }
        }
        temp1 = doc.getElementsByTagName('section');
        for (i in temp1) {
            if (i > -1) {
                temp1[i].id !== 'header_section' && (temp1[i].style.height = root.innerHeight + 'px');
                temp1[i].id !== 'nav_section' && (temp1[i].style.width = root.innerWidth + 'px');
            }
        }
        doc.getElementById('header_title_div').style.width = root.innerWidth - 290 + 'px';
    };
    root.onresize();

    doc.getElementById('sign_in_button').addEventListener('click', function (e) {
        var self = e.target,
            username = doc.getElementById('username_input'),
            password = doc.getElementById('password_input');

        password.disabled = username.disabled = 'disabled';

        util.xhr(
			'POST',
			url + 'instructor/login',
			{
				username : username.value,
				password : password.value
			},
			function (response, req) {
				if (req.status === 401) {
					self.innerHTML = 'ERROR!';
					self.className = 'sign_in_error';
					root.setTimeout(function () {
						self.className = '';
						self.innerHTML = 'SIGN IN!';
						password.disabled = username.disabled = '';
						username.focus();
					}, 1000);
				}
				else if (req.status === 200) {
					_this = response;
					doc.getElementById('user_greeting_b').innerHTML = (response.sex === 'F' ? 'Ma\'am ' : 'Sir ') + response.last_name;

					self.innerHTML = 'SUCCESS!';
					self.className = 'sign_in_success';
					root.setTimeout(function () {
						var temp;
						doc.getElementById('front_section').className = 'active_section';
						doc.getElementById('nav_section').className = 'left-to-current';
						doc.getElementById('header_section').className = 'top-to-current';
						self.className = '';
						self.innerHTML = 'SIGN IN!';
						password.value = username.value = password.disabled = username.disabled = '';

						if (_this.class.students) {
							connectSocket();
							page.show('feed');
							temp = doc.getElementById('scrnsht_interval_input');
							["keyup", "mouseup", "keypress"].map(function (ev) {
								temp.addEventListener(ev, startAutoRefresh, false);
							});
						}
						else {
							doc.getElementById('feed_a').remove();
							page.show('records');
						}
					}, 250);
				}
			},
			function (e) {
				console.dir(e);
				throw e;
			},
			{
				'Access-Control-Allow-Credentials' : 'true'
			}
		);
    }, true);

    doc.getElementById('feed_body_div').addEventListener('click', function (e) {
        var temp = e.target,
			window = util.getClosestWindow(temp),
            student = getStudentBySN(window.id),
			ip;

		if (typeof student === 'undefined') return;
		ip = 'http://' + student.ip_address + ':8286';
        if (temp.nodeName === 'BUTTON') {
            switch (temp.className) {
                case 'lock' :   util.xhr(
									'POST',
									ip,
									{
										command : 'lock',
										hash : student.hash,
										salt : student.salt
									},
									function (data) {
										if (data.status === 'Locking') {
											window.className = window.className.replace(/off|active|idle/g, 'locked');
											window.childNodes[0].setAttribute('src', '/img/click-to-unlock.png');
										}
									}
								);
                                break;
                case 'shutdown' :
								if (!confirm("Are you sure you want to shutdown this computer?")) return;
								util.xhr(
									'POST',
									ip,
									{
										command : 'shutdown',
										hash : student.hash,
										salt : student.salt
									},
									function (data) {
										console.dir(data);
									}
								);
                                break;
                case 'logout' :
								if (!confirm("Are you sure you want to logout this computer?")) return;
								util.xhr(
									'POST',
									ip,
									{
										command : 'logoff',
										hash : student.hash,
										salt : student.salt
									},
									function (data) {
										console.dir(data);
									}
								);
                                break;
				case 'proc_list' :
								temp = window.childNodes[3].childNodes[9];
								if (student.proc_list_opened) {
									delete student.proc_list_opened;
									temp.style.display = 'none';
									return;
								}
								student.proc_list_opened = true;
								temp.style.display = 'block';
								temp.innerHTML = 'Process List :<br />';
								util.xhr(
									'POST',
									ip,
									{
										command : 'a',
										hash : student.hash,
										salt : student.salt
									},
									function (data, req) {
										var b = doc.createElement('b');
										b.className = 'twilight';
										if (req.status === 200) {
											student.active_process = data.status;
											b.appendChild(doc.createTextNode('Active: ' + data.status.replace('<:>', '-').replace(/"/gi, '')));
											temp.appendChild(b);
											temp.appendChild(doc.createElement('br'));
										}
									}
								);
								util.xhr(
									'POST',
									ip,
									{
										command : 'proclist',
										hash : student.hash,
										salt : student.salt
									},
									function (data, req) {
										if (req.status === 200) {
											student.process_list = data.status;
											data.status.forEach(function (s, i) {
												temp.appendChild(doc.createTextNode(s));
												if (i != data.status.length - 1)
													temp.appendChild(doc.createElement('br'));
											});
										}
									}
								);
								break;
                case 'chat_button' :
									window.classList.remove('new_message');
                                    doc.getElementById('chat_name_div').innerHTML = temp.getAttribute('title');
                                    doc.getElementById('chat_div').style.display = 'block';
                                    temp.style.backgroundImage = 'url(../img/chat-icon.png)';
                                    doc.getElementById('chat_textarea').setAttribute('data-sn', student._id);
                                    doc.getElementById('chat_textarea').focus();
									currentChat = student._id;
									socket.emit('i_get_history', student._id);
                                break;
            }
        }
        else if (temp.nodeName === 'IMG') {
            if (window.classList.contains('locked')) {
                util.xhr(
					'POST',
					ip,
					{
						command : 'unlock',
						hash : student.hash,
						salt : student.salt
					},
					function (data) {
						window.childNodes[0].setAttribute('src', ip + '/?command=jpeg' + '&hash=' + student.hash + '&salt=' + student.salt);
						window.className = window.className.replace(/locked|off|active/g, 'off');
					}
				);
            }
            else {
                root.open(student.vnc, '_blank');
            }
        }
    }, true);

    doc.getElementById('chat_name_div').addEventListener('click', function (e) {
		currentChat = null;
        e.target.parentNode.style.display = 'none';
    }, true);

    doc.getElementById('chat_textarea').addEventListener('keypress', function (e) {
        var sn = e.target.getAttribute('data-sn'),
            student = getStudentBySN(sn),
            list = doc.getElementById('chat_list'),
			li = doc.createElement('li');
        if (e.ctrlKey && e.keyCode == 10) {
            socket.emit('i_update_chat', e.target.value, sn);
            li.appendChild(doc.createTextNode(util.wbr(e.target.value)));
			list.appendChild(li);
            list.scrollTop = list.scrollHeight;
            e.target.value = '';
        }
		if (new_messages[sn]) {
			delete new_messages[sn];
			root.onfocus();
		}
    }, true);

    doc.getElementById('chat_textarea').addEventListener('focus', function (e) {
		var sn = e.target.getAttribute('data-sn');
		if (new_messages[sn]) {
			clearInterval();
			delete new_messages[sn];
			clearInterval(chatBlinkIntervals[sn]);
			delete chatBlinkIntervals[sn];
			root.onfocus();
		}
	});

	doc.getElementById('lock_all_button').addEventListener('click', function (e) {
		if (confirm("Are you sure you want to lock all computers?")) {
			_this.class.students.forEach(function (student) {
				var window = doc.getElementById(student._id);
				(function (window, student) {
					util.xhr(
						'POST',
						'http://' + student.ip_address + ':8286',
						{
							command : 'lock',
							hash : student.hash,
							salt : student.salt
						},
						function (data) {
							window.childNodes[0].setAttribute('src', '/img/click-to-unlock.png');
							window.className = window.className.replace(/off|active|idle/g, 'locked');
						}
					);
				})(window, student);
			});
		}
	}, true);

	doc.getElementById('unlock_all_button').addEventListener('click', function (e) {
		if (confirm("Are you sure you want to unlock all computers?")) {
			_this.class.students.forEach(function (student) {
				var window = doc.getElementById(student._id);
				(function (window, student) {
					var ip = 'http://' + student.ip_address + ':8286';
					util.xhr(
						'POST',
						ip,
						{
							command : 'unlock',
							hash : student.hash,
							salt : student.salt
						},
						function (data) {
							window.childNodes[0].setAttribute('src', ip + '/?command=jpeg' + '&hash=' + student.hash + '&salt=' + student.salt);
							window.className = window.className.replace(/locked|off|active/g, 'off');
						}
					);
				})(window, student);
			});
		}
	}, true);

	doc.getElementById('shutdown_all_button').addEventListener('click', function (e) {
		if (confirm("Are you sure you want to shutdown all computers?")) {
			_this.class.students.forEach(function (student) {
				var window = doc.getElementById(student._id);
				(function (window, student) {
					util.xhr(
						'POST',
						'http://' + student.ip_address + ':8286',
						{
							command : 'shutdown',
							hash : student.hash,
							salt : student.salt
						},
						function (data) {
							console.dir(data);
						}
					);
				})(window, student);
			});
		}
	}, true);

	doc.getElementById('share_file_input').addEventListener('change', function (e) {
		var files_count = e.target.files.length,
			shareCount = 0,
			successShare = 0,
			total_students = _this.class.students.length,
			failShares = [];

		if (!files_count)
			return false;

		if (!confirm('Are you sure you want to share this file to everyone?')) {
			return false;
		}

		if (files_count > 1) {
			alert('Only one file can be shared at a time');
			return false;
		}

		e.preventDefault();

		_this.class.students.forEach(function (s) {
			var formData = new FormData(),
				xhr = new XMLHttpRequest();

			formData.append('file', e.target.files[0]);
			formData.append('command', s.randString);
			formData.append('hash', s.hash);
			formData.append('salt', s.salt);

			xhr.open('POST', 'http://' + s.ip_address + ':8286/upload', true);
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4 && xhr.status === 200) {
					shareCount++;
					if (++successShare === total_students) {
						alert('File successfully shared to everyone online');
					}
					if (shareCount === total_students) {
						alert('Failed to share file to : ' + failShares.join(', '));
					}
				} else if (xhr.readyState === 4) {
					shareCount++;
					failShares.push(s.name);
					if (shareCount === total_students) {
						alert('Failed to share file to : ' + failShares.join(', '));
					}
				}
			};
			xhr.send(formData);
		});
	});

	doc.body.addEventListener('keyup', function (e) {
		if (e.keyCode === 27) {
			document.getElementById('chat_div').style.display = 'none';
		}
	});

	doc.getElementById('section_submissions_select').addEventListener('change', getFiles, true);
	doc.getElementById('exer_number_submissions_select').addEventListener('change', getFiles, true);
	doc.getElementById('students_submissions_select').addEventListener('change', getFiles, true);

	doc.getElementById('records_section_select').addEventListener('change', getRecords, true);

	doc.getElementById('section_logs_select').addEventListener('change', getLogs, true);
	doc.getElementById('students_logs_select').addEventListener('change', getLogs, true);
	doc.getElementById('from_logs_input').addEventListener('click', getLogs, true);
	doc.getElementById('from_logs_input').addEventListener('keyup', getLogs, true);
	doc.getElementById('to_logs_input').addEventListener('click', getLogs, true);
	doc.getElementById('to_logs_input').addEventListener('keyup', getLogs, true);

	/**
		Setup pages
	*/

    page('feed', feed);
    page('records', records);
    page('submissions', submissions);
    page('logs', logs);
    page('logout', logout);
    page('*', login);
    page.show('');


	/**
		Get configurations
	*/
	util.xhr(
		'GET',
		'http://ricolindo.uplb.edu.ph:8080/config.json',
		{},
		function (data) {
			url = 'http://' + data.server + ':' + data.port + '/';
			loginIfCookieExists();
		},
		function () {
			console.dir('Unable to get config from ricolindo. Using default values.');
			loginIfCookieExists();
		}
	);
}(this));
