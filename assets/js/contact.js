(function (ao) {
    (function (web) {
        'use strict';

        var ContactForm = function () {
            function contactForm() {
                this._name = ao.get('contact-form-name');
                this._email = ao.get('contact-form-email');
                this._message = ao.get('contact-form-message');
                this._recaptcha = ao.validator('contact-form-recaptcha');
            };

            contactForm.prototype.recaptchaValid = function () {
                this._recaptcha.setValid(true);
            };

            contactForm.prototype.handleSend = function (form) {
                var aoForm = ao.form(form);

                if (!aoForm.validate() || !aoForm.submit.confirm()) {
                    return false;
                }

                aoForm.submitting();

                var formData = {
                    name: this._name.value,
                    email: this._email.value,
                    message: this._message.value
                };

                formData['g-recaptcha-response'] = this._recaptcha.e.value;

                ao.ajax({
                    type: 'post',
                    url: form.action,
                    data: formData,
                    ctx: aoForm,
                    onFail: function () { this.error(); },
                    onSuccess: function () { this.ok(); }
                });

                return false;
            };

            contactForm.prototype.handleSent = function (sent) {
                if (sent) {
                    document.location.href = '/';
                    return;
                }
                ao.form().reset();
            };

            return contactForm;
        }();

        ao(function () {
            web.contactForm = new ContactForm();
            window.recaptchaValid = function () { web.contactForm.recaptchaValid(); };
        });
    })(ao.Web || (ao.Web = {}));
})(Ao);