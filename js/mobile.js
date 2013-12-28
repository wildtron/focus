(function(root){

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
                document.getElementById('main_section').className = 'right-to-current';
                self.className = '';
                self.innerHTML = 'Login via SystemOne';
                password.value = username.value = password.disabled = username.disabled = '';
            }, 250);
        } else {
            self.innerHTML = 'Error!';
            self.className = 'sign_in_error';
            setTimeout(function () {
                self.className = '';
                self.innerHTML = 'Login via SystemOne';
                password.disabled = username.disabled = '';
                username.focus();
            }, 1000);
        }
    };
    
    document.getElementById('logout_button').onclick = function () {
        document.getElementById('front_section').className = 'left-to-current';
        document.getElementById('main_section').className = 'current-to-right';
        document.getElementById('username_input').focus();
    };

    document.getElementById('username_input').focus();
}(this));
