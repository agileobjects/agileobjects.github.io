(function ($) {
    (function (ao) {
        (function (web) {
            var ContactForm = function () {
                function contactForm() {
                    this.name = ao.getById('contact-form-name');
                    this.email = ao.getById('contact-form-email');
                    this.message = ao.getById('contact-form-message');
                    this.submitButton = ao.getById('contact-form-submit');
                };

                contactForm.prototype.handleSend = function (form) {
                    var $form = $(form);

                    if (!$form.valid() || !ao.submitConfirm(this.submitButton)) {
                        return false;
                    }

                    ao.formSubmitting($form);

                    var formData = {
                        name: this.name.value,
                        email: this.email.value,
                        message: this.message.value
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