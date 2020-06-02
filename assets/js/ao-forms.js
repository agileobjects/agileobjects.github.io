(function (ao) {
    // AoSubmit
    var AoSubmit = ao.derive(function (formAoObj) {
        this._base.call(this, formAoObj.getByCss('input[type="submit"]'));
    });

    AoSubmit.prototype.confirm = function () {
        if (this.e.value === 'Confirm') { return true; }
        this.e.defaultText = this.e.value;
        this.e.defaultTitle = this.e.title;
        this.e.value = 'Confirm';
        this.e.title = 'Click again to confirm';
        this.addClass('confirm-button');
        return false;
    };

    AoSubmit.prototype.reset = function () {
        this.e.value = this.e.defaultText;
        this.e.title = this.e.defaultTitle;
        this.removeClass('confirm-button');
    };

    // AoPopup
    var AoPopup = ao.derive(function () {
        this._base.call(this, 'popup');
    });

    AoPopup.prototype.show = function (contentId) {
        var content = ao(contentId);
        if (content.getByCss('.message')) {
            this.addClass('with-message');
        }
        this.html(content.html());
        return this;
    };

    AoPopup.prototype.reset = function () {
        return this.removeClass('with-message');
    };

    // AoValidator
    var validators = {
        required: function () {
            return Boolean(this.e.value);
        },
        email: function () {
            return ao.isEmail(this.e.value);
        }
    };
    var validatorNames = Object.keys(validators);
    var validatorsCount = validatorNames.length;

    var AoValidator = ao.derive(function (input) {
        this._base.call(this, input);

        this.on('blur keyup', this.validate);
        this._msg = ao(this.e.nextElementSibling);
        if (this._msg.e.classList.contains('error-message') === false) {
            this._msg = ao(document.createElement('span')).addClass('error-message');
            this.after(this._msg);
        }
        this._validators = [];
        for (var i = 0; i < validatorsCount; ++i) {
            var validatorName = validatorNames[i];
            var msg = input.getAttribute('data-val-' + validatorName);
            if (Boolean(msg)) {
                this._validators.push({ test: validators[validatorName], msg: msg });
            }
        }
    });

    AoValidator.prototype.validate = function () {
        for (var i = 0, l = this._validators.length; i < l; ++i) {
            var validator = this._validators[i];
            if (validator.test.call(this) === false) {
                this._msg.html(validator.msg);
                this._msg.removeClass('field-validation-valid').addClass('field-validation-error');
                return false;
            }
        }
        this._msg.removeClass('field-validation-error').addClass('field-validation-valid');
        return true;
    };

    // AoForm
    var AoForm = ao.derive(function (form) {
        this._base.call(this, form);

        this._cover = ao('progress-cover');
        this._popup = new AoPopup();
        this.submit = new AoSubmit(this);

        this._validators = [];
        for (var i = 0, l = form.length; i < l; ++i) {
            var input = form[i];
            if (!Boolean(input.getAttribute('data-val'))) { continue; }
            this._validators.push(new AoValidator(input));
        }
    });

    AoForm.prototype.validate = function () {
        var result = true;
        for (var i = 0, l = this._validators.length; i < l; ++i) {
            if (this._validators[i].validate() === false) {
                result = false;
            }
        }
        return result;
    };

    AoForm.prototype.submitting = function () {
        this._cover.removeClass('hidden');
        this.disable();
        this._popup.show('progress').hide().removeClass('hidden').fadeIn();
        return this;
    };

    AoForm.prototype.ok = function () {
        this._popup.show('complete-ok');
        return this;
    };

    AoForm.prototype.error = function () {
        this._popup.show('complete-error');
        return this;
    };

    AoForm.prototype.reset = function () {
        this._popup.fadeOut(function () { this.reset(); });
        this.submit.reset();
        this.enable();
        this._cover.addClass('hidden');
        return this;
    };

    ao.form = function (form) {
        if (typeof form === 'undefined') {
            form = document.forms[0];
        }
        return new AoForm(form);
    };
})(Ao);