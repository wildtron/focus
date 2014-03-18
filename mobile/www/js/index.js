(function(root){
    var temp,
		_this,
		current,
		url = document.body.getAttribute('data-url'),
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
            var list = document.getElementById('list_ul'),
				temp,
				i,
				transition = function (e) {
					console.dir(e);
                    var s = getStudentBySN(e.target.id);
					current = s;
                    animate(document.getElementById('details_section'), 0);
                    animate(document.getElementById('students_section'), 0);
                    document.getElementById('student_name_div').innerHTML = toTitleCase(s.first_name + ' ' + s.last_name);
                    document.getElementById('details_div').innerHTML = [s._id, 'Status : ' + 'absent', 'Applications :' ].concat(s.applications).join('<br />');
                };
            list.innerHTML = '';
			_this.class.students.forEach(function (s) {
                list.innerHTML += '<li class="absent details_button" id="' + s._id + '">' + toTitleCase(s.first_name + ' ' + s.last_name) + '<button></button></li>';
            });
            temp = document.getElementsByClassName('details_button');
            i = temp.length;
            while (i--) {
                temp[i].addEventListener('click', transition);
                temp[i].addEventListener('touchstart', transition);
            }
        },
		login = function () {
			var username = document.getElementById('username_input'),
				password = document.getElementById('password_input');
			password.disabled = username.disabled = 'disabled';

			// send to server

			xhr('POST', url + 'instructor/login', {
				username : username.value,
				password : password.value
			}, function (response, req) {
				var temp, i;

				if (req.status === 401) {
					this.innerHTML = 'Error!';
					this.className = 'sign_in_error';
					setTimeout(function (self) {
						self.className = '';
						self.innerHTML = 'Sign In';
						password.disabled = username.disabled = '';
						username.focus();
					}, 1000, this);

				}
				else if (req.status === 200) {
					_this = response;
					console.dir(_this);
					initList();
					this.innerHTML = 'Login Success!';
					this.className = 'sign_in_success';
					setTimeout(function (self) {
						document.getElementById('front_section').className = 'current-to-left';
						animate(document.getElementById('front_section'), 0);
						animate(document.getElementById('students_section'), 0);
						self.className = '';
						self.innerHTML = 'Sign In';
						password.value = username.value = password.disabled = username.disabled = '';
					}, 250, this);

				}
			});
		},
		backTransition = function () {
			animate(document.getElementById('details_section'), 1);
			animate(document.getElementById('students_section'), 1);
		},
		logout = function () {
			animate(document.getElementById('front_section'), 1);
			animate(document.getElementById('students_section'), 1);
			document.getElementById('username_input').focus();
		};

    (root.onresize = function () {
        var temp1 = document.getElementsByTagName('section'),
            i = temp1.length;
        while (i--) {
            temp1[i].style.height = root.innerHeight + 'px';
            temp1[i].style.width = root.innerWidth + 'px';
        }
    })();

    temp = document.getElementById('back_button');
	temp.addEventListener('click', backTransition);
	temp.addEventListener('touchstart', backTransition);

    temp = document.getElementById('sign_in_button');
	temp.addEventListener('click', login);
	temp.addEventListener('touchstart', login);

    temp = document.getElementById('logout_button');
	temp.addEventListener('click', logout);
	temp.addEventListener('touchstart', logout);

    document.getElementById('username_input').focus();

}(this));
