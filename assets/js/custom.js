(function (ao) {
    (function (web) {
        'use strict';
        
        var MenuToggle = ao.derive(function () {
            this._base.call(this, 'menu-toggle');

            this.click(function (evt) {
                ao(document.body).toggleClass('menu--opened');
                this.blur();
                evt.preventDefault();
            });

            ao(window).on('resize orientationchange', function () {
                if (this.isMobile()) {
                    ao(document.body).removeClass('menu--opened');
                }
            }, this);
        });

        MenuToggle.prototype.isMobile = function () {
            return this.css('display') !== 'none';
        };

        ao(function () {
            web.MenuToggle = new MenuToggle();
        });
    })(ao.Web || (ao.Web = {}));
}(Ao));
