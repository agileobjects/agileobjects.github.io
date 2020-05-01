(function ($) {
    (function (ao) {
        (function (web) {
            var ContactForm = function () {
                function contactForm() { };

                contactForm.prototype.handleSend = function (url) {
                    var $form = $getById('contact-form');
                    if (!$form.valid()) {
                        return false;
                    }

                    this._coverForm();
                    this._$getFormElements().prop('disabled', true);
                    this._$showPopupPanel('sending').hide().removeClass('hidden').fadeIn();

                    var formData = {
                        name: getById('contact-form-name').value,
                        email: getById('contact-form-email').value,
                        message: getById('contact-form-message').value
                    };
                    var that = this;
                    $.ajax({
                        type: 'post',
                        url: url,
                        data: formData,
                        xhrFields: {
                            withCredentials: false
                        }
                    }).fail(function () {
                        that._$showPopupPanel('sent-error');
                    }).done(function () {
                        that._$showPopupPanel('sent-ok');
                    });
                    return false;
                };

                contactForm.prototype.handleSent = function (sent) {
                    if (sent) {
                        document.location.href = '/';
                        return;
                    }
                    this._$getFormElements().prop('disabled', false);
                    this._uncoverForm();
                    this._$getPopupPanel().fadeOut();
                };

                contactForm.prototype._$getFormElements = function () {
                    return $('#contact-form input,#contact-form textarea,#contact-form-submit');
                };

                contactForm.prototype._coverForm = function () {
                    this._$getFormCover().removeClass('hidden');
                };

                contactForm.prototype._uncoverForm = function () {
                    this._$getFormCover().addClass('hidden');
                };

                contactForm.prototype._$getFormCover = function () {
                    return $getById('contact-form-cover');
                }

                contactForm.prototype._$showPopupPanel = function (contentId) {
                    return this._$getPopupPanel().html($getById(contentId).html());
                };

                contactForm.prototype._$getPopupPanel = function () {
                    return $getById('popup');
                }

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