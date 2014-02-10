(function (root) {
    $$ = {};

    $$.addClass = function (e, c) {
        (e.className && (e.className += " "+c)) || (e.className = c);
    };

    $$.removeClass = function (e, c) {
        e.className = e.className.replace(c,"");
    };

    $$.hasClass = function (e, c) {
        return (" " + e.className + " ").replace(/[\n\t]/g, " ").indexOf(" " + c + " ") > -1;
    };

    root.$$ = $$;
}(this));
