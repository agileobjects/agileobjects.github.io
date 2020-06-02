(function (ao) {
    (function (web) {
        'use strict';

        var ContactForm = function () {
            function contactForm() {
                this.name = ao.get('contact-form-name');
                this.email = ao.get('contact-form-email');
                this.message = ao.get('contact-form-message');
            };

            contactForm.prototype.handleSend = function (form) {
                var aoForm = ao.form(form);

                if (!aoForm.validate() || !aoForm.submit.confirm()) {
                    return false;
                }

                aoForm.submitting();

                var formData = {
                    name: this.name.value,
                    email: this.email.value,
                    message: this.message.value
                };

                ao.ajax({
                    type: 'post',
                    url: form.action,
                    data: formData,
                    ctx: aoForm,
                    onFail: function() { this.error(); },
                    onSuccess: function() { this.ok(); }
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

        ao.ready(function () {
            web.contactForm = new ContactForm();
        });
    })(Ao.Web || (Ao.Web = {}));
})(Ao);