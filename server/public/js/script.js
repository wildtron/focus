//(function (root) {
root = this;
    var temp,
        _this,
        socket,
        refreshInterval,
        url = document.body.attributes['data-url'].value,
        toTitleCase = function (str) {
            return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        },
        randomEffect = function () {
            return ['top', 'bottom', 'left', 'right'][parseInt(Math.random() * 4, 10)];
        },
        getCookie = function (cookie) {
            return (document.cookie.split(';').filter(function (a) {
                return a.split('=')[0] === cookie;
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
        records = function (a) {
            var active = document.getElementsByClassName('active_section')[0],
                temp = document.getElementById('records_section_select');
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
            var active = document.getElementsByClassName('active_section')[0];
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
        },
        logs = function () {
            var active = document.getElementsByClassName('active_section')[0];
            if (active.id !== 'logs_section') {
                active.className = 'current-to-' + randomEffect();
                document.getElementById('logs_section').className = randomEffect() + '-to-current active_section';
            }
            document.getElementsByClassName('active_nav')[0].className = '';
            document.getElementById('logs_a').className = 'active_nav';
            document.getElementById('header_title_div').innerHTML = 'LOGS';
        },
        logout = function () {
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
                    <div class="window_div ' + (students[i].status || "idle") + '" id="'+ students[i]._id +'" data-ip="' + students[i].ip_address + '"> \
                        <img src="http://'+ students[i].ip_address +':8286" alt="'+ toTitleCase(students[i].first_name) + '\'s Computer" title="' + students[i].ip_address + '" width="350" height="200" />    \
                        '+ toTitleCase(students[i].first_name + ' ' + students[i].last_name) +' | '+ students[i]._id +' \
                        <button class="chat" title="Chat with '+ toTitleCase(students[i].first_name) + '"></button>   \
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
                var i = _this.class.students.length,
                    temp;
                while (i--) {
                    temp = document.getElementById(_this.class.students[i]._id);
                    if (!temp.classList.contains('locked'))
                        temp.childNodes[1].setAttribute('src', 'http://' + _this.class.students[i].ip_address + ':8286');
                }
            }, (+interval) * 1000);
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
        }, function (response) {
            var temp, i;
            if (response.message) {
                self.innerHTML = 'ERROR!';
                self.className = 'sign_in_error';
                setTimeout(function () {
                    self.className = '';
                    self.innerHTML = 'SIGN IN!';
                    password.disabled = username.disabled = '';
                    username.focus();
                }, 1000);
            }
            else {
                _this = response;
                document.getElementById('user_greeting_b').innerHTML = ((response.sex === 'F') ? "Ma'am " : "Sir ") + response.last_name;

                
                if (_this.class) {
                    socket = io.connect(url);
                    socket.emit('create_rooms', {
                        'access_token' : getCookie('focus'),
                        'students' : _this.class.students.map(function(a){return a._id})
                    });
                    socket.on('warning', function (data) {
                        alert(data);
                    });
                    console.log('socket emit');
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
                    page.show('feed');

                    temp = document.getElementById('scrnsht_interval_input');

                    ["keyup", "mouseup", "keypress"].map(function (ev) {
                        temp.addEventListener(ev, startAutoRefresh, false);
                    });
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
            window,
            ip;
        if (temp.nodeName === 'BUTTON') {
            window = temp.parentNode.parentNode;
            ip = 'http://' + window.dataset.ip + ':8286';
            switch(temp.className) {
                case 'lock' :   xhr('POST', ip, {method : 'lock'}, function (data) {
                                    if (data.status === 'Locking') {
                                        window.childNodes[1].setAttribute('src', '/img/click-to-unlock.png');
                                        window.className = window.className.replace(/off|active|idle/g, 'locked');
                                    }
                                });
                                break;
                case 'shutdown' :   xhr('POST', ip, {method : 'shutdown'}, function (data) {
                                    console.dir(data);
                                });
                                break;
                case 'logout' :   xhr('POST', ip, {method : 'logout'}, function (data) {
                                    console.dir(data);
                                });
                                break;
                case 'chat' :   
                                break;
            }
        }
        else if (temp.nodeName === 'IMG') {
            window = temp.parentNode;
            ip = 'http://' + window.dataset.ip + ':8286';
            if (window.classList.contains('locked')) {
                xhr('POST', ip, {method : 'unlock'}, function (data) {
                    if (data.status === 'Unlocking') {
                        window.childNodes[1].setAttribute('src', ip);
                        window.className = window.className.replace(/locked|off|active/g, 'idle');
                    }
                });
            }
            else {
                temp = document.getElementById('fs_shot');
                temp.setAttribute('src', ip);
                temp.style.width = root.innerWidth + 'px';
                temp.style.height = root.innerHeight + 'px';
            }
        }
        console.dir(temp);
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

    page('feed', feed);
    page('records', records);
    page('submissions', submissions);
    page('logs', logs);
    page('logout', logout);
    page('*', login);

    page.show('');

    getCookie('focus') && document.getElementById('sign_in_button').click() && console.log('ra');
//}(this));
