//(function (root) {
root = this;
    var temp,
        _this,
        socket,
		currentChat,
        refreshInterval,
        url = document.body.attributes['data-url'].value,
		getClosestWindow = function (e) {
			try {
				while (1) {
					if (e.parentNode.classList.contains('window_div'))
						return e.parentNode;
					e = e.parentNode;
				}
			} catch (e) {
				return {id : ''};
			}
		},
        toTitleCase = function (str) {
            return str.replace(/\w\S*/g, function (txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
        },
        randomEffect = function () {
            return ['top', 'bottom', 'left', 'right'][parseInt(Math.random() * 4, 10)];
        },
        getCookie = function (cookie) {
            return (document.cookie.split(';').filter(function (a) {
                return a.split('=')[0].replace(/\s+/g, '') === cookie;
            })[0] || '=').split('=')[1];
        },
        login = function () {
            document.getElementById('username_input').focus();
        },
        feed = function () {
            var active = document.getElementsByClassName('active_section')[0];
            if (!+active.attributes['data-order'].value) {
                active.className = 'current-to-' + randomEffect();
                document.getElementById('feed_section').className = randomEffect() + '-to-current active_section';
            } else if (active.id !== 'feed_section'){
                active.className = 'current-to-' + randomEffect();
                document.getElementById('feed_section').className = randomEffect() + '-to-current active_section';
            }
            document.getElementsByClassName('active_nav')[0] && (document.getElementsByClassName('active_nav')[0].className = '');
            document.getElementById('feed_a').className = 'active_nav';
            document.getElementById('header_title_div').innerHTML = '<span class="twilight">' + _this.class._id + '</span> on <span class="twilight">' + _this.class.room + '</span>';

            setTimeout(function(){
                setupScreenshots(_this.class.students);
            }, 500);
        },
        records = function () {
            var active = document.getElementsByClassName('active_section')[0],
                temp = document.getElementById('records_section_select'),
				i;
            temp.innerHTML = '';
            for (i = _this.classes.length; i--;) {
                temp.innerHTML += '<option value="' + _this.classes[i] + '">' + _this.classes[i] + '</option>';
            }
            if (+active.attributes['data-order'].value < 2) {
                active.className = 'current-to-' + randomEffect();
                document.getElementById('records_section').className = randomEffect() + '-to-current active_section';
            } else if(active.id !== 'records_section') {
                active.className = 'current-to-' + randomEffect();
                document.getElementById('records_section').className = randomEffect() + '-to-current active_section';
            }
            document.getElementsByClassName('active_nav')[0].className = '';
            document.getElementById('records_a').className = 'active_nav';
            document.getElementById('header_title_div').innerHTML = 'RECORDS';
        },
        submissions = function () {
            var active = document.getElementsByClassName('active_section')[0],
				temp;
            if (+active.attributes['data-order'].value < 3) {
                active.className = 'current-to-' + randomEffect();
                document.getElementById('submissions_section').className = randomEffect() + '-to-current active_section';
            } else if(active.id !== 'submissions_section') {
                active.className = 'current-to-' + randomEffect();
                document.getElementById('submissions_section').className = randomEffect() + '-to-current active_section';
            }
            document.getElementsByClassName('active_nav')[0].className = '';
            document.getElementById('submissions_a').className = 'active_nav';
            document.getElementById('header_title_div').innerHTML = 'SUBMISSIONS';
			temp = document.getElementById('section_submissions_select');
			temp.innerHTML = '';
			_this.classes.forEach(function (a) {
				temp.innerHTML += '<option value="'+a+'">'+a+'</option>';
			});
			document.getElementById('students_submissions_select').innerHTML = '<option value="all">Everyone</option>';
			getFiles();
        },
        logs = function () {
            var active = document.getElementsByClassName('active_section')[0],
				temp;
            if (active.id !== 'logs_section') {
                active.className = 'current-to-' + randomEffect();
                document.getElementById('logs_section').className = randomEffect() + '-to-current active_section';
            }
            document.getElementsByClassName('active_nav')[0].className = '';
            document.getElementById('logs_a').className = 'active_nav';
            document.getElementById('header_title_div').innerHTML = 'LOGS';
			temp = document.getElementById('section_logs_select');
			temp.innerHTML = '';
			_this.classes.forEach(function (a) {
				temp.innerHTML += '<option value="'+a+'">'+a+'</option>';
			});
			document.getElementById('from_logs_input').value = (new Date().toJSON().substring(0, 9)) + '1';
			document.getElementById('to_logs_input').value = new Date().toJSON().substring(0, 10);
			setTimeout(getLogs, 500);
        },
        logout = function () {
			clearInterval(refreshInterval);
            _this = null;
            xhr('POST', url + 'instructor/logout');
            document.getElementsByClassName('active_nav')[0].className = '';
            document.getElementsByClassName('active_section')[0].className = 'current-to-' + randomEffect();
            document.getElementById('front_section').className = randomEffect() + '-to-current';
            document.getElementById('nav_section').className = 'current-to-left';
            document.getElementById('header_section').className = 'current-to-top';
            page.show('login');
        },
        setupScreenshots = function (students) {
            var status,
                temp,
                i = students.length,
                dom = document.getElementById('feed_body_div'),
                now = new Date();
            document.getElementById('scrnsht_interval_input').value = getCookie('interval') || 10;
            dom.innerHTML = '';
            while (i--) {
                dom.innerHTML += '  \
                    <div class="window_div ' + (students[i].status || "active") + '" id="'+ students[i]._id +'" data-ip="' + students[i].ip_address + '"> \
                        <img src="http://'+ students[i].ip_address +
						':8286/?command=jpeg' +
						'&hash=' + students[i].hash +
						'&salt=' + students[i].salt +
						'" alt="'+ toTitleCase(students[i].first_name) + '\'s Computer" title="Click to open VNC" width="350" height="200" onerror="javascript : this.parentNode&&(this.parentNode.className=\'window_div not_connected\')&&(this.src=\'/img/not-connected.png\');"/>    \
                        '+ toTitleCase(students[i].first_name + ' ' + students[i].last_name) +' | '+ students[i]._id +' \
                        <button class="chat_button" title="Chat with '+ toTitleCase(students[i].first_name) + '" id="' + students[i]._id + '_chat_button"></button>   \
                        <div class="unit_mngr_div"> \
                            <button title="Shutdown" class="shutdown"></button>  \
                            <button title="Lock" class="lock"></button>  \
                            <button title="Logout" class="logout"></button> \
                        </div> \
                    </div>';
            }
            startAutoRefresh();
            dom.innerHTML += '<br class="clearfix" />';
        },
        startAutoRefresh = function (e) {
            var interval;
            if (e) {
                interval = e.target.value;
            }
            else {
                interval = document.getElementById('scrnsht_interval_input').value;
            }
            document.cookie = 'interval='+interval+';path=/;';
            // console.log('Setting auto-refresh to ', interval);
            clearInterval(refreshInterval);
            refreshInterval = setInterval(function () {
                var students = _this.class.students,
					i = students.length,
                    temp;
                while (i--) {
                    temp = document.getElementById(students[i]._id);
                    if (!temp.classList.contains('locked') &&
						!temp.classList.contains('not_connected')
						)
                        temp.childNodes[1].setAttribute('src', 'http://' + students[i].ip_address +
						':8286/?command=jpeg' +
						'&hash=' + students[i].hash +
						'&salt=' + students[i].salt
						);
                }
            }, (+interval) * 1000);
        },
        buildChatHistory = function (history) {
            var dom = document.getElementById('chat_list');
            dom.innerHTML = '';
			history.forEach(function (h) {
                if (h.from_student)
                    dom.innerHTML += '<li class="incoming">' + h.message + '</li>';
                else
                    dom.innerHTML += '<li>' + h.message + '</li>';
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
        blinkTitle = function () {
            var timer = "",
                isBlurred = false;
            root.onblur =function() {
                isBlurred = true;
                timer = root.setInterval(function() {
                    document.title = document.title == "Company" ? "Company - flash text" : "Company";
                }, 1000);
            }
            root.onfocus = function() {
                isBlurred = false;
                document.title = "Company";
                clearInterval(timer);
            }
        },
		getFiles = function (e) {
			xhr('GET', url + 'section/getStudentsWithFiles?'
				+ 'section_id=' + document.getElementById('section_submissions_select').value
				+ '&exer_number=' + document.getElementById('exer_number_submissions_select').value
				+ '&student_number=' + document.getElementById('students_submissions_select').value
				+ '&order=date'	// + document.getElementById('order_submissions_select').value
				, {}, function (res, req) {
				var temp1 = document.getElementById('students_submissions_select'),
					temp2 = document.getElementById('files_div');
				if (req.status === 200) {
					if (!e || e.target.id === 'section_submissions_select') {
						temp1.innerHTML = '<option value="all">Everyone</option>';
					}
					temp2.innerHTML = '';
					res.forEach(function (s) {
						if (!e || e.target.id === 'section_submissions_select') {
							temp1.innerHTML += '<option value="'+s._id+'">'+toTitleCase(s.first_name + ' ' + s.last_name)+'</option>';
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
				} else {
					logout();
				}
			});
		},
		getLogs = function (e) {
			xhr('GET', url + 'instructor/getLogs?'
				+ 'section_id=' + document.getElementById('section_logs_select').value
				+ '&from=' + document.getElementById('from_logs_input').value
				+ '&to=' + document.getElementById('to_logs_input').value
				+ '&student_number=' + document.getElementById('students_logs_select').value
				, {}, function (res, req) {
				var temp1 = document.getElementById('students_logs_select'),
					temp2 = document.getElementById('log_div');
				if (req.status === 200) {
					if (!e || e.target.id === 'section_logs_select') {
						temp1.innerHTML = '<option value="all">Everyone</option>';
						res.students.forEach(function (s) {
							temp1.innerHTML += '<option value="'+s+'">'+s+'</option>';
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
		};


    root.onresize = function () {
        var temp1 = document.getElementsByClassName('section_div'),
            i;
        for (i in temp1) {
            if (i > -1) {
                temp1[i].style.height = root.innerHeight - 74 + 'px',
                temp1[i].style.width = root.innerWidth - 70 + 'px';
            }
        }
        temp1 = document.getElementsByTagName('section');
        for (i in temp1) {
            if (i > -1) {
                temp1[i].id !== 'header_section' && (temp1[i].style.height = root.innerHeight + 'px');
                temp1[i].id !== 'nav_section' && (temp1[i].style.width = root.innerWidth + 'px');
            }
        }
        document.getElementById('header_title_div').style.width = root.innerWidth - 290 + 'px';
    };
    root.onresize();

    document.getElementById('sign_in_button').addEventListener('click', function () {
        var self = this,
            username = document.getElementById('username_input'),
            password = document.getElementById('password_input');

        password.disabled = username.disabled = 'disabled';

        xhr('POST', url + 'instructor/login', {
            username : username.value,
            password : password.value
        }, function (response, req) {
            var temp, i;
            if (req.status === 401) {
                self.innerHTML = 'ERROR!';
                self.className = 'sign_in_error';
                setTimeout(function () {
                    self.className = '';
                    self.innerHTML = 'SIGN IN!';
                    password.disabled = username.disabled = '';
                    username.focus();
                }, 1000);
            }
            else if (req.status === 200){
                _this = response;
                document.getElementById('user_greeting_b').innerHTML = ((response.sex === 'F') ? "Ma'am " : "Sir ") + response.last_name;

                if (_this.class.students) {
                    socket = io.connect(url);
                    socket.emit('i_join_room', getCookie('focus'));
                    socket.on('warning', function (data) {
                        console.log('warning');
						console.dir(data);
                    });
					socket.on('disconnect', function (sn) {
						console.log('disconnect');
						console.log(sn);
					});
					socket.on('history', buildChatHistory);
					socket.on('online', function (sn) {
						var temp = document.getElementById(sn._id),
							student = getStudentBySN(sn._id);
						student.ip_address = sn.ip_address;
						student.salt = sn.salt;
						student.hash = sn.hash;
						temp.className = temp.className.replace('not_connected', 'active');
					});
                    socket.on('update_chat', function (student_number, message) {
                        var student = getStudentBySN(student_number),
							dom = document.getElementById('chat_list');
						if (currentChat === student_number) {
							dom.innerHTML += '<li class="incoming">' + message + '</li>';
							dom.scrollTop = dom.scrollHeight;
						} else {
							document.getElementById(student_number + '_chat_button').style.backgroundImage = 'url(../img/chat-new-icon.png)';
						}
                    });
                }

                self.innerHTML = 'SUCCESS!';
                self.className = 'sign_in_success';
                setTimeout(function () {
                    document.getElementById('front_section').className = 'active_section';
                    document.getElementById('nav_section').className = 'left-to-current';
                    document.getElementById('header_section').className = 'top-to-current';
                    self.className = '';
                    self.innerHTML = 'SIGN IN!';
                    password.value = username.value = password.disabled = username.disabled = '';

                    if (_this.class.students) {
                        page.show('feed');
                        temp = document.getElementById('scrnsht_interval_input');

                        ["keyup", "mouseup", "keypress"].map(function (ev) {
                            temp.addEventListener(ev, startAutoRefresh, false);
                        });
                    }
                    else {
                        document.getElementById('feed_a').remove();
                        page.show('records');
                        alert('You have no class as of this time...');
                    }
                }, 250);
            }
        }, function (e) {
            console.dir(e);
            throw e;
        }, {
            'Access-Control-Allow-Credentials' : 'true'
        });
    });

    document.getElementById('feed_body_div').addEventListener('click', function (e) {
        var temp = e.target,
			window = getClosestWindow(temp),
            student = getStudentBySN(window.id),
			ip;
		if (typeof student.ip_address === 'undefined') return;
		ip = 'http://' + student.ip_address + ':8286';
        if (temp.nodeName === 'BUTTON') {
            switch(temp.className) {
                case 'lock' :   xhr('POST', ip, {command : 'lock', hash : student.hash, salt : student.salt}, function (data) {
                                    if (data.status === 'Locking') {
                                        window.childNodes[1].setAttribute('src', '/img/click-to-unlock.png');
                                        window.className = window.className.replace(/off|active|idle/g, 'locked');
                                    }
                                });
                                break;
                case 'shutdown' :   xhr('POST', ip, {command : 'shutdown', hash : student.hash, salt : student.salt}, function (data) {
                                    console.dir(data);
                                });
                                break;
                case 'logout' :   xhr('POST', ip, {command : 'logout', hash : student.hash, salt : student.salt}, function (data) {
                                    console.dir(data);
                                });
                                break;
                case 'chat_button' :
                                    document.getElementById('chat_name_div').innerHTML = temp.getAttribute('title');
                                    document.getElementById('chat_div').style.display = 'block';
                                    temp.style.backgroundImage = 'url(../img/chat-icon.png)';
                                    document.getElementById('chat_textarea').setAttribute('data-sn', student._id);
                                    document.getElementById('chat_textarea').focus();
									currentChat = student._id;
									socket.emit('i_get_history', student._id);
                                break;
            }
        }
        else if (temp.nodeName === 'IMG') {
            if (window.classList.contains('locked')) {
                xhr('POST', ip, {command : 'unlock', hash : student.hash, salt : student.salt}, function (data) {
                    if (data.status === 'Unlocking') {
                        window.childNodes[1].setAttribute('src', ip);
                        window.className = window.className.replace(/locked|off|active/g, 'active');
                    }
                });
            }
            else {
                root.open(student.vnc);
            }
        }
    });

    document.body.addEventListener('keyup', function (e) {
        var temp;
        if (e.keyCode === 27) {
            temp = document.getElementById('fs_shot');
            temp.setAttribute('src', '//:0');
            temp.style.height = temp.style.width = '0px';
        }
        else if(e.keyCode === 32) {
            temp = document.getElementById('fs_shot');
            temp.setAttribute('src', temp.getAttribute('src'));
        }
    });

    document.getElementById('chat_name_div').addEventListener('click', function (e) {
		currentChat = '';
        e.target.parentNode.style.display = 'none';
    });

    document.getElementById('chat_textarea').onkeypress = function (e) {
        var sn = e.target.getAttribute('data-sn'),
            student = getStudentBySN(sn),
            list = document.getElementById('chat_list');
        if (e.ctrlKey && e.keyCode == 10) {
            socket.emit('i_update_chat', e.target.value, sn);
            list.innerHTML += '<li>' + e.target.value + '</li>';
            list.scrollTop = list.scrollHeight;
            e.target.value = '';
        }
    };

	document.getElementById('section_submissions_select').addEventListener('change', getFiles);
	document.getElementById('exer_number_submissions_select').addEventListener('change', getFiles);
	document.getElementById('students_submissions_select').addEventListener('change', getFiles);
	// document.getElementById('order_submissions_select').addEventListener('change', getFiles);

	document.getElementById('section_logs_select').addEventListener('change', getLogs);
	document.getElementById('students_logs_select').addEventListener('change', getLogs);
	document.getElementById('from_logs_input').addEventListener('click', getLogs);
	document.getElementById('to_logs_input').addEventListener('click', getLogs);

    page('feed', feed);
    page('records', records);
    page('submissions', submissions);
    page('logs', logs);
    page('logout', logout);
    page('*', login);

    page.show('');

    getCookie('focus') && document.getElementById('sign_in_button').click();
//}(this));
