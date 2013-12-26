(function(root){
    var temp1 = document.getElementById('sign_in_button'),
        i;

    temp1.onclick = function () {
        var self = this,
            username = document.getElementById('username_input').value,
            password = document.getElementById('password_input').value;
        
        if (username === "ravenjohn" && password === "ravengwapo") {
            
        }
        else {
            self.innerHTML = "ERROR!";
            $$.addClass(self, 'sign_in_error');
            setTimeout(function () {
                $$.removeClass(self, 'sign_in_error');
                self.innerHTML = "SIGN IN!";
            }, 1000);
        }
        return false;
    };
}(this));
