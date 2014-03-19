// (function (root) {
	root = this;
    var _this,
        socket,
		currentChat,
        refreshInterval,
		new_messages = {},
		util = root.util,
		doc = root.document,
        url = 'http://192.168.1.52:3000/',

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

            setTimeout(setupScreenshots, 500);
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
			setTimeout(getLogs, 500);
        },
        logout = function () {
			clearInterval(refreshInterval);
            _this = null;
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

        setupScreenshots = function () {
            var dom = doc.getElementById('feed_body_div');
            dom.innerHTML = '';
            _this.class.students.forEach(function (s){
				var window_div = doc.createElement('div'),
					img = doc.createElement('img'),
					button = doc.createElement('button');
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
				window_div.appendChild(doc.createTextNode(util.toTitleCase(s.first_name + ' ' + s.last_name) +' | '+ s._id));
				window_div.appendChild(button);

                window_div.innerHTML += '<div class="unit_mngr_div"> \
                            <button title="Shutdown" class="shutdown"></button>  \
                            <button title="Lock" class="lock"></button>  \
                            <button title="Logout" class="logout"></button> \
                        </div>';

				dom.appendChild(window_div);
            });
            dom.innerHTML += '<br class="clearfix" />';

            doc.getElementById('scrnsht_interval_input').value = cookies.get('interval') || 10;
            startAutoRefresh();
        },
        startAutoRefresh = function (e) {
            var interval;
            if (e) {
                interval = e.target.value;
            }
            else {
                interval = doc.getElementById('scrnsht_interval_input').value;
            }
            doc.cookie = 'interval='+interval+';path=/;';
            // console.log('Setting auto-refresh to ', interval);
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
				if (req.readyState === 4 && req.status === 200) {
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
								temp1.innerHTML += '<option value="'+s._id+'">'+util.toTitleCase(s.first_name + ' ' + s.last_name)+'</option>';
							}
							s.files&&s.files.forEach(function (f) {
								temp2.innerHTML += '	\
							<div class="file_div">	\
								<img onclick="window.open(\'/student/getFile?path=' + f.path + '\');" class="'+f.name.split('.')[1]+'" src="img/file-icon.png"	 alt="'+f.name+'" width="128" height="128" title="Click to Download\r\n\
File Name: '+f.name+'\r\n\
Version: '+f.version+'\r\n\
Size: '+f.size+' bytes\r\n\
Date: '+new Date(f.date)+'"/>	\
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
				if (req.readyState === 4 && req.status === 200) {
					res.students.map(function (s) {
						curDays = 0;
						s.datesAttended = []
						res.records.forEach(function (r) {
							if (r.student_number === s._id) {
								curDays++;
								s.datesAttended.push(r.date);
							}
						});
						if (curDays > maxDays) {
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
					tableString += '<tr><td>' + s._id + '</td><td>' + util.toTitleCase(s.name) + '</td>';
					for (i=0; i < j; i++) {
						tableString += '<td>' + ((~s.datesAttended.indexOf(maxHolder.datesAttended[i])) ? 'P' : '<span class="blood">A</span>') +'</td>';
					}
					tableString += '<td>' + (maxDays - s.datesAttended.length)  + '</td></tr>'
				});

				table.innerHTML = tableString;
			});
		},
		getLogs = function (e) {
			util.xhr('GET', url + 'instructor/getLogs?'
				+ 'section_id=' + doc.getElementById('section_logs_select').value
				+ '&from=' + +new Date(doc.getElementById('from_logs_input').value)
				+ '&to=' +  +new Date(doc.getElementById('to_logs_input').value)
				+ '&student_number=' + doc.getElementById('students_logs_select').value
				, {}, function (res, req) {
				var temp1 = doc.getElementById('students_logs_select'),
					temp2 = doc.getElementById('log_div');
				if (req.readyState === 4 && req.status === 200) {
					if (!e || e.target.id === 'section_logs_select') {
						temp1.innerHTML = '<option value="all">Everyone</option>';
						res.students.forEach(function (s) {
							var option = doc.createElement('option');
							option.setAttribute('value', s);
							option.appendChild(doc.createTextNode(s));
							temp1.appendChild(option);
						});
					}
					temp2.innerHTML = '<pre>';
					res.logs.forEach(function (l) {
						var date = new Date(l.date);
						date = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
						temp2.innerHTML += date + ' ' + l.name + ' ' + l.log + '<br />';
					});
					temp2.innerHTML += '</pre>';
					temp2.scrollTop = temp2.scrollHeight;
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
				socket.on('disconnect', function (sn) {
					var window = doc.getElementById(sn);
					if (window)
						window.className = 'window_div not_connected';
				});
				socket.on('history', buildChatHistory);
				socket.on('online', function (sn) {
					var temp = doc.getElementById(sn._id),
						student = getStudentBySN(sn._id);
					student.ip_address = sn.ip_address;
					student.salt = sn.salt;
					student.hash = sn.hash;
					temp.className = temp.className.replace('not_connected', 'active');
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
					var window = doc.getElementById(sn);
					if (window)
						window.className = 'window_div ' + status;
				});
			});
		};

	/**
		Attach Events
	*/


	root.onfocus = function () {
		var blinkTimer,
			names = '',
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

        util.xhr('POST', url + 'instructor/login', {
            username : username.value,
            password : password.value
        }, function (response, req) {
            if (req.readyState === 4 && req.status === 401) {
                self.innerHTML = 'ERROR!';
                self.className = 'sign_in_error';
                setTimeout(function () {
                    self.className = '';
                    self.innerHTML = 'SIGN IN!';
                    password.disabled = username.disabled = '';
                    username.focus();
                }, 1000);
            }
            else if (req.readyState === 4 && req.status === 200){
                _this = response;
                doc.getElementById('user_greeting_b').innerHTML = (response.sex === 'F' ? 'Ma\'am ' : 'Sir ') + response.last_name;

                self.innerHTML = 'SUCCESS!';
                self.className = 'sign_in_success';
                setTimeout(function () {
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
        }, function (e) {
            console.dir(e);
            throw e;
        }, {'Access-Control-Allow-Credentials' : 'true'});
    }, true);

    doc.getElementById('feed_body_div').addEventListener('click', function (e) {
        var temp = e.target,
			window = util.getClosestWindow(temp),
            student = getStudentBySN(window.id),
			ip;

		if (typeof student === 'undefined') return;
		ip = 'http://' + student.ip_address + ':8286';
        if (temp.nodeName === 'BUTTON') {
            switch(temp.className) {
                case 'lock' :   util.xhr('POST', ip, {command : 'lock', hash : student.hash, salt : student.salt}, function (data) {
                                    if (data.status === 'Locking') {
                                        window.childNodes[0].setAttribute('src', '/img/click-to-unlock.png');
                                        window.className = window.className.replace(/off|active|idle/g, 'locked');
                                    }
                                });
                                break;
                case 'shutdown' :   util.xhr('POST', ip, {command : 'shutdown', hash : student.hash, salt : student.salt}, function (data) {
                                    console.dir(data);
                                });
                                break;
                case 'logout' :   util.xhr('POST', ip, {command : 'logout', hash : student.hash, salt : student.salt}, function (data) {
                                    console.dir(data);
                                });
                                break;
                case 'chat_button' :
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
                util.xhr('POST', ip, {command : 'unlock', hash : student.hash, salt : student.salt}, function (data) {
                    if (data.status === 'Unlocking') {
                        window.childNodes[0].setAttribute('src', ip);
                        window.className = window.className.replace(/locked|off|active/g, 'active');
                    }
                });
            }
            else {
                root.open(student.vnc);
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
            list = doc.getElementById('chat_list');
        if (e.ctrlKey && e.keyCode == 10) {
            socket.emit('i_update_chat', e.target.value, sn);
            list.innerHTML += '<li>' + e.target.value + '</li>';
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
			delete new_messages[sn];
			root.onfocus();
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


	/**
		Game!
	*/

    page.show('');

    if (cookies.has('focus')) {
		doc.getElementById('username_input').value = doc.getElementById('password_input').value = ' ';
		doc.getElementById('sign_in_button').click();
	}
// }(this));
