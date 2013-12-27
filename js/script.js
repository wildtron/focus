(function(root){

    var randomEffect = function () {
        switch (parseInt(Math.random() * 4, 10)) {
        case 0: return 'top';
        case 1: return 'bottom';
        case 2: return 'left';
        case 3: return 'right';
        };
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

    var login = function () {
        document.getElementById('username_input').focus();
    };
    
    var feed = function () {
        var active = document.getElementsByClassName('active_section')[0];
        if (!+active.attributes['data-order'].value) {
            active.className = '';
            document.getElementById('feed_section').className = randomEffect() + '-to-current active_section';
        } else if (active.id !== 'feed_section'){
            active.className = 'current-to-' + randomEffect();
            document.getElementById('feed_section').className = randomEffect() + '-to-current active_section';
        }
        document.getElementsByClassName('active_nav')[0] && (document.getElementsByClassName('active_nav')[0].className = '');
        document.getElementById('feed_a').className = 'active_nav';
        document.getElementById('header_title_div').innerHTML = 'CMSC 190-2 <span class="twilight">X-3L</span> on <span class="twilight">PC Lab 8</span>';
    };

    var records = function (a) {
        var active = document.getElementsByClassName('active_section')[0];
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
    };

    var submissions = function () {
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
    };

    var logs = function () {
        var active = document.getElementsByClassName('active_section')[0];
        if (active.id !== 'logs_section') {
            active.className = 'current-to-' + randomEffect();
            document.getElementById('logs_section').className = randomEffect() + '-to-current active_section';
        }
        document.getElementsByClassName('active_nav')[0].className = '';
        document.getElementById('logs_a').className = 'active_nav';
        document.getElementById('header_title_div').innerHTML = 'LOGS';
    };

    document.getElementById('sign_in_button').onclick = function () {
        var self = this,
            username = document.getElementById('username_input'),
            password = document.getElementById('password_input');
        password.disabled = username.disabled = 'disabled';
        if (username.value === 'ravenjohn' && password.value === 'ravengwapo') {
            self.innerHTML = 'SUCCESS!';
            self.className = 'sign_in_success';
            setTimeout(function () {
                document.getElementById('front_section').className = 'current-to-' + randomEffect() + ' active_section';
                document.getElementById('nav_section').className = 'left-to-current';
                document.getElementById('header_section').className = 'top-to-current';
                self.className = '';
                self.innerHTML = 'SIGN IN!';
                password.disabled = username.disabled = '';
                page.show('feed');
            }, 250);
        } else {
            self.innerHTML = 'ERROR!';
            self.className = 'sign_in_error';
            setTimeout(function () {
                self.className = '';
                self.innerHTML = 'SIGN IN!';
                password.disabled = username.disabled = '';
                username.focus();
            }, 1000);
        }
    };
    
    var logout = function () {
        document.getElementsByClassName('active_nav')[0].className = '';
        document.getElementsByClassName('active_section')[0].className = 'current-to-' + randomEffect();
        document.getElementById('front_section').className = randomEffect() + '-to-current';
        document.getElementById('nav_section').className = 'current-to-left';
        document.getElementById('header_section').className = 'current-to-top';
        page.show('login');
    };

    page('feed', feed);
    page('records', records);
    page('submissions', submissions);
    page('logs', logs);
    page('logout', logout);
    page('*', login);

    page.show('');
}(this));
