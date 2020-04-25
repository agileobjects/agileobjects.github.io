(function ($) {
    (function (ao) {
        (function (web) {
            var ContactForm = function () {
                function contactForm() { };

                contactForm.prototype.handleSend = function (url) {
                    if (!$getById('contact-form').valid()) {
                        return false;
                    }

                    this._$getFormElements().prop('disabled', true);
                    this._$showPopupPanel('sending').hide().removeClass('hidden').fadeIn();

                    var formData = {
                        name: getById('contact-form-name').value,
                        email: getById('contact-form-email').value,
                        message: getById('contact-form-message').value
                    };
                    var that = this;
                    $.ajax(url,
                        {
                            type: 'POST',
                            async: true,
                            data: JSON.stringify(formData)
                        }).fail(function () {
                            that._$showPopupPanel('sent-error');
                        }).done(function () {
                            that._$showPopupPanel('sent-ok');
                        });
                    return false;
                };

                contactForm.prototype.handleSent = function (sent) {
                    this._$getFormElements().prop('disabled', false);
                    sent ? document.location.href = '/' : this._$getPopupPanel().fadeOut();
                };

                contactForm.prototype._$getFormElements = function () {
                    return $('#contact-form input,#contact-form textarea,#contact-form-submit');
                };

                contactForm.prototype._$getPopupPanel = function () {
                    return $getById('popup');
                }

                contactForm.prototype._$showPopupPanel = function (contentId) {
                    return this._$getPopupPanel().html($getById(contentId).html());
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
                web.contactForm = new ContactForm();
            });
        })(ao.Web || (ao.Web = {}));
    })(window.AgileObjects || (window.AgileObjects = {}));
})(jQuery);