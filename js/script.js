(function(root){
    var i;

    document.getElementById('sign_in_button').onclick = function () {
        var self = this,
            username = document.getElementById('username_input'),
            password = document.getElementById('password_input');

        if (username.value === "ravenjohn" && password.value === "ravengwapo") {
            self.innerHTML = "SUCCESS!";
            $$.addClass(self, 'sign_in_success');
            setTimeout(function () {
                $$.removeClass(self, 'sign_in_success');
                $$.addClass(document.getElementById('front_section'), 'current-to-left');
                $$.addClass(document.getElementById('feed_section'), 'right-to-current');
                $$.addClass(document.getElementById('nav_section'), 'left-to-current');
                $$.addClass(document.getElementById('header_section'), 'top-to-current');
            }, 1000);
        }
        else {
            self.innerHTML = "ERROR!";
            $$.addClass(self, 'sign_in_error');
            setTimeout(function () {
                $$.removeClass(self, 'sign_in_error');
                self.innerHTML = "SIGN IN!";
                username.focus();
            }, 1000);
        }
    };

    /* page('/records');
    page('/records');
    page('/submissions');
    page('/logs');
    page('/logout'); */
}(this));
