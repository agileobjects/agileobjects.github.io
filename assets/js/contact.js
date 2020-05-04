(function ($) {
    (function (ao) {
        (function (web) {
            var ContactForm = function () {
                function contactForm() { };

                contactForm.prototype.handleSend = function (form) {
                    var $form = $(form);

                    if (!$form.valid()) { return false; }

                    ao.formSubmitting($form);

                    var formData = {
                        name: ao.getById('contact-form-name').value,
                        email: ao.getById('contact-form-email').value,
                        message: ao.getById('contact-form-message').value
                    };

                    $.ajax({
                        type: 'post',
                        url: form.action,
                        data: formData,
                        xhrFields: {
                            withCredentials: false
                        }
                    }).fail(function () {
                        ao.formError();
                    }).done(function () {
                        ao.formError();
                        ao.formOk();
                    });

                    return false;
                };

                contactForm.prototype.handleSent = function (sent) {
                    if (sent) {
                        document.location.href = '/';
                        return;
                    }
                    ao.formReset(ao.$getById('contact-form'));
                };

                return contactForm;
            }();

            $(function () {
                web.contactForm = new ContactForm();
            });
        })(ao.Web || (ao.Web = {}));
    })(window.AgileObjects || (window.AgileObjects = {}));
})(jQuery);