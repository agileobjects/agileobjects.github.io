/**
 * Main JS file for theme behaviours
 */
(function (ao) {
    (function (web) {
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

        ao.ready(function () {
            web.MenuToggle = new MenuToggle();
        });
    })(Ao.Web || (Ao.Web = {}));
}(Ao));
