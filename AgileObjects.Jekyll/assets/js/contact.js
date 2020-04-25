(function ($) {
    (function (ao) {
        (function (web) {
            var ContactForm = function() {
                function contactForm() {};

                contactForm.prototype.handleSend = function(url) {
                    if (!$getById('contact-form').valid()) {
                        return false;
                    }

                    this._$getFormElements().prop('disabled', true);
                    this._$showPopupPanel('sending').hide().removeClass('hidden').fadeIn();

                    var formData = {
                        name: getById('name').value,
                        email: getById('email').value,
                        message: getById('message').value
                    };
                    var that = this;
                    $.ajax(url,
                        {
                            type: 'POST',
                            async: true,
                            data: JSON.stringify(formData)
                        }).fail(function() {
                        that._$showPopupPanel('send-error');
                    }).done(function() {
                        that._$showPopupPanel('sent');
                    });
                    return false;
                };

                contactForm.prototype.handleSent = function(sent) {
                    this._$getFormElements().prop('disabled', false);
                    sent ? document.location.href = '/' : this._$getPopupPanel().fadeOut();
                };

                contactForm.prototype._$getFormElements = function() {
                    return $('#contact-form input,#contact-form textarea,#contact-form-submit');
                };

                contactForm.prototype._$getPopupPanel = function() {
                    return $getById('popup');
                }

                contactForm.prototype._$showPopupPanel = function(contentId) {
                    return this._$getPopupPanel().html(getById(contentId).outerHTML);
                };

                function $getById(id) {
                    return $(getById(id));
                };

                function getById(id) {
                    return document.getElementById(id);
                };

                return contactForm;
            }();

            $(function () {
                return web.contactForm = new ContactForm();
            });
        })(ao.Web || (ao.Web = {}));
    })(window.AgileObjects || (window.AgileObjects = {}));
})(jQuery);