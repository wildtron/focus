(function(root){
    var temp1 = document.getElementsByClassName('details_button'),
        data = {
            "1" : {
                name : 'Cedric Abuso',
                studentNumber : '2010-ewan',
                status : 'idle',
                applications : ['google-chrome - Facebook', 'terminal']
            },
            "2" : {
                name : 'Sherwin Ferrer',
                studentNumber : '2010-dikolam',
                status : 'off-task',
                applications : ['**alamna**', 'google-chrome - Facebook', 'terminal']
            },
            "3" : {
                name : 'Raven Lagrimas',
                studentNumber : '2010-43168',
                status : 'active',
                applications : ['notepad++', 'google-chrome - Facebook', 'terminal']
            },
            "4" : {
                id : 4,
                name : 'Carlo Virtucio',
                studentNumber : '2010-ewanko',
                status : 'absent',
                applications : []
            }
        },
        i;

    root.onresize = function () {
        var temp1 = document.getElementsByTagName('section');
        for (i in temp1) {
            if (i > -1) {
                temp1[i].style.height = root.innerHeight + 'px';
                temp1[i].style.width = root.innerWidth + 'px';
            }
        }
    };
    root.onresize();
    
    for (i in temp1) {
        if (i > -1) {
            temp1[i].onclick = function (e) {
                document.getElementById('students_section').className = 'current-to-left';
                document.getElementById('details_section').className = 'right-to-current';
                document.getElementById('student_name_div').innerHTML = data[e.target.id].name;
                document.getElementById('details_div').innerHTML = [data[e.target.id].studentNumber, 'Status : ' + data[e.target.id].status, 'Applications :' ].concat(data[e.target.id].applications).join('<br />');
            };
        }
    }

    document.getElementById('back_button').onclick = function () {
        document.getElementById('details_section').className = 'current-to-right';
        document.getElementById('students_section').className = 'left-to-current';
    };

    document.getElementById('sign_in_button').onclick = function () {
        var self = this,
            username = document.getElementById('username_input'),
            password = document.getElementById('password_input');
        password.disabled = username.disabled = 'disabled';
        if (username.value === 'ravenjohn' && password.value === 'ravengwapo') {
            self.innerHTML = 'Login Success!';
            self.className = 'sign_in_success';
            setTimeout(function () {
                document.getElementById('front_section').className = 'current-to-left';
                document.getElementById('students_section').className = 'right-to-current';
                self.className = '';
                self.innerHTML = 'Sign In';
                password.value = username.value = password.disabled = username.disabled = '';
            }, 250);
        } else {
            self.innerHTML = 'Error!';
            self.className = 'sign_in_error';
            setTimeout(function () {
                self.className = '';
                self.innerHTML = 'Sign In';
                password.disabled = username.disabled = '';
                username.focus();
            }, 1000);
        }
    };
    
    document.getElementById('logout_button').onclick = function () {
        document.getElementById('front_section').className = 'left-to-current';
        document.getElementById('students_section').className = 'current-to-right';
        document.getElementById('username_input').focus();
    };

    document.getElementById('username_input').focus();
}(this));
