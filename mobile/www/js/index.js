(function(root){
    var data = [
            {
                name : 'Cedric Abuso',
                studentNumber : '2010-ewan',
                status : 'idle',
                applications : ['google-chrome - Facebook', 'terminal']
            },
            {
                name : 'Sherwin Ferrer',
                studentNumber : '2010-dikolam',
                status : 'off',
                applications : ['**alamna**', 'google-chrome - Facebook', 'terminal']
            },
            {
                name : 'Raven Lagrimas',
                studentNumber : '2010-43168',
                status : 'active',
                applications : ['notepad++', 'google-chrome - Facebook', 'terminal', 'minesweeper', 'focus.js', 'npm shit', 'asfasf aasf sf', 'asdf as fasf asdf a', 'Firefox', 'Safari']
            },
            {
                name : 'Carlo Virtucio',
                studentNumber : '2010-ewanko',
                status : 'absent',
                applications : []
            }
        ],
        animate = function (o, d) {
            var end_value = parseFloat(o.style.width),
                delta = end_value / 600 / 0.06,
                frame = 0,
                handle = setInterval(function() {
                    var value = delta * (frame += 1);
                    o.style.left === '' && (o.style.left = '0px');
                    o.style.left = parseFloat(o.style.left) + ((d ? 1 : -1) * delta) + 'px';
                    value >= end_value && clearInterval(handle);
                }, 1 / 0.06);
        },
        initList = function () {
            var temp,
                list = document.getElementById('list_ul');
                i = data.length;
            list.innerHTML = '';
            while (i--) {
                list.innerHTML += '<li class="' + data[i].status + ' details_button" id="' + i + '_li">' + data[i].name + '<button></button></li>';
            }
            temp = document.getElementsByClassName('details_button');
            i = temp.length;
            while (i--) {
                temp[i].onclick = function (e) {
                    var student = data[parseInt(e.target.id, 10)];
                    animate(document.getElementById('details_section'), 0);
                    animate(document.getElementById('students_section'), 0);
                    document.getElementById('student_name_div').innerHTML = student.name;
                    document.getElementById('details_div').innerHTML = [student.studentNumber, 'Status : ' + student.status, 'Applications :' ].concat(student.applications).join('<br />');
                };
            }
        };

    (root.onresize = function () {
        var temp1 = document.getElementsByTagName('section'),
            i = temp1.length;
        while (i--) {
            temp1[i].style.height = root.innerHeight + 'px';
            temp1[i].style.width = root.innerWidth + 'px';
        }
    })();

    document.getElementById('back_button').onclick = function () {
        animate(document.getElementById('details_section'), 1);
        animate(document.getElementById('students_section'), 1);
    };

    document.getElementById('sign_in_button').onclick = function () {
        var username = document.getElementById('username_input'),
            password = document.getElementById('password_input');
        password.disabled = username.disabled = 'disabled';

        // send to server

        if (username.value === 'ravenjohn' && password.value === 'ravengwapo') {
            this.innerHTML = 'Login Success!';
            this.className = 'sign_in_success';
            initList();
            setTimeout(function (self) {
                document.getElementById('front_section').className = 'current-to-left';
                animate(document.getElementById('front_section'), 0);
                animate(document.getElementById('students_section'), 0);
                self.className = '';
                self.innerHTML = 'Sign In';
                password.value = username.value = password.disabled = username.disabled = '';
            }, 250, this);
        } else {
            this.innerHTML = 'Error!';
            this.className = 'sign_in_error';
            setTimeout(function (self) {
                self.className = '';
                self.innerHTML = 'Sign In';
                password.disabled = username.disabled = '';
                username.focus();
            }, 1000, this);
        }
    };

    document.getElementById('logout_button').onclick = function () {
        animate(document.getElementById('front_section'), 1);
        animate(document.getElementById('students_section'), 1);
        document.getElementById('username_input').focus();
    };

    document.getElementById('username_input').focus();

}(this));
