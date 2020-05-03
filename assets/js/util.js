(function ($) {
    (function (ao) {
        ao.$getById = function (id) {
            return $(getById(id));
        };

        ao.getById = function (id) {
            return document.getElementById(id);
        };
    })(window.AgileObjects || (window.AgileObjects = {}));
})(jQuery);