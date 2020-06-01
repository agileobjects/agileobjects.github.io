var Ao = (function () {
    // Helpers
    function doOne(callback) {
        callback.call(this, this.e, 0);
        return this;
    }

    function doAll(callback) {
        var elems = this.e;
        for (var i = 0, l = elems.length; i < l; ++i) {
            callback.call(this, elems[i], i);
        }
        return this;
    }

    function isArrayLike(obj) {
        return Boolean(obj) && 'length' in obj && typeof obj.length === 'number';
    }

    var empty = {
        classList: { add: function () { }, remove: function () { } }
    };

    function single(aoObj, elem) {
        aoObj.e = elem;
        aoObj._do = doOne;
    }

    var ao = function (elem) {
        return new AoObj(elem);
    };

    // Instance members
    // AoObj
    var AoObj = function (elemOrId) {
        this._data = {};
        if (typeof elemOrId === 'undefined') {
            single(this, empty);
        }
        else if (typeof elemOrId === 'string') {
            single(this, ao.get(elemOrId));
        }
        else {
            if (isArrayLike(elemOrId)) {
                if (elemOrId.length === 1) {
                    single(this, elemOrId[0]);
                }
                else {
                    this.e = elemOrId;
                    this._do = doAll;
                }
            }
            else {
                single(this, elemOrId);
            }
        }
    };

    AoObj.prototype = {
        getByCss: function (selector) {
            return this.e.querySelector(selector);
        },
        getAllByCss: function (selector) {
            return this.e.querySelectorAll(selector);
        },
        addClass: function (name) {
            return this._do(function (e) {
                e.classList.add(name);
            });
        },
        removeClass: function (name) {
            return this._do(function (e) {
                e.classList.remove(name);
            });
        },
        css: function () {
            var namesAndValues = arguments;
            var l = namesAndValues.length;
            return this._do(function (e) {
                for (var i = 0; i < l;) {
                    e.style[namesAndValues[i++]] = namesAndValues[i++];
                }
            });
        },
        hide: function () {
            var display = this.e.style.display;
            if (!Boolean(this._data.display)) {
                display = getComputedStyle(this.e).getPropertyValue('display');
            }
            if (display === 'none') { return this; }
            this._data.display = display;
            return this.css('display', 'none');
        },
        unhide: function () {
            return this.css('display', this._data.hasOwnProperty('display')
                ? this._data.display : '');
        },
        fadeIn: function () {
            return this.removeClass('fade-out').css('opacity', 0).unhide().addClass('fade-in-down');
        },
        fadeOut: function () {
            this.removeClass('fade-in-down').css('opacity', 1).addClass('fade-out');
            var that = this;
            setTimeout(function () {
                that.hide();
                that = undefined;
            }, 700);
            return this;
        },
        enable: function () {
            return this._do(function (e) {
                e.disabled = false;
            });
        },
        disable: function () {
            return this._do(function (e) {
                e.disabled = true;
            });
        },
        after: function (elemOrAoObj) {
            var originElem = elemOrAoObj instanceof AoObj ? elemOrAoObj.e : elemOrAoObj;
            return this._do(function (e, i) {
                var elem = i === 0 ? originElem : originElem.cloneNode();
                e.parentNode.insertBefore(elem, e.nextSibling);
            });
        },
        on: function (eventTypes, callback) {
            var events = eventTypes.split(' ');
            var l = events.length;
            var that = this;
            var cxtCallback = function () {
                callback.call(that);
            };
            return this._do(function (e) {
                for (var i = 0; i < l; ++i) {
                    e.addEventListener(events[i], cxtCallback);
                }
            });
        }
    };

    // AoSubmit
    var AoSubmit = function (formAoObj) {
        AoObj.call(this, formAoObj.getByCss('input[type="submit"]'));
    };

    AoSubmit.prototype = Object.create(AoObj.prototype);

    AoSubmit.prototype.confirm = function () {
        if (this.e.value === 'Confirm') { return true; }
        this.e.defaultText = this.e.value;
        this.e.defaultTitle = this.e.title;
        this.e.value = 'Confirm';
        this.e.title = 'Click again to confirm';
        this.addClass('confirm-button');
        return false;
    };

    // AoPopup
    var AoPopup = function () {
        AoObj.call(this, 'popup');
    };

    AoPopup.prototype = Object.create(AoObj.prototype);

    AoPopup.prototype.show = function (contentId) {
        var content = ao(contentId);
        if (content.getByCss('.message')) {
            this.addClass('with-message');
        }
        this.e.innerHTML = content.e.innerHTML;
        return this;
    };

    AoPopup.prototype.reset = function () {
        return this.removeClass('with-message');
    };

    // AoValidator
    var emailMatcher = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var validators = {
        required: function () {
            return Boolean(this.e.value);
        },
        email: function () {
            return validators.required.call(this) && emailMatcher.test(this.e.value.toLowerCase());
        }
    };
    var validatorNames = Object.keys(validators);
    var validatorsCount = validatorNames.length;

    var AoValidator = function (input) {
        AoObj.call(this, input);
        this.on('blur keyup', this.validate);
        this._msg = ao(document.createElement('span')).addClass('error-message');
        this.after(this._msg);
        this._validators = [];
        for (var i = 0; i < validatorsCount; ++i) {
            var validatorName = validatorNames[i];
            var msg = input.getAttribute('data-val-' + validatorName);
            if (Boolean(msg)) {
                this._validators.push({ test: validators[validatorName], msg: msg });
            }
        }
    };

    AoValidator.prototype = Object.create(AoObj.prototype);

    AoValidator.prototype.validate = function () {
        for (var i = 0, l = this._validators.length; i < l; ++i) {
            var validator = this._validators[i];
            if (validator.test.call(this) === false) {
                this._msg.e.innerHTML = validator.msg;
                this._msg.removeClass('field-validation-valid').addClass('field-validation-error');
                return false;
            }
        }
        this._msg.removeClass('field-validation-error').addClass('field-validation-valid');
        return true;
    };

    // AoForm
    var AoForm = function (form) {
        AoObj.call(this, form);
        this._cover = ao('progress-cover');
        this._popup = new AoPopup();
        this.submit = new AoSubmit(this);

        this._validators = [];
        for (var i = 0, l = form.length; i < l; ++i) {
            var input = form[i];
            if (!Boolean(input.getAttribute('data-val'))) { continue; }
            this._validators.push(new AoValidator(input));
        }
    };

    AoForm.prototype = Object.create(AoObj.prototype);

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
        this._popup.fadeOut().reset();
        this.enable();
        this._cover.addClass('hidden');
        return this;
    };

    // Static members
    ao.ready = function (callback) {
        if (document.readyState === 'complete' ||
            (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
            window.setTimeout(callback);
            return;
        }

        var completed = function () {
            document.removeEventListener('DOMContentLoaded', completed);
            window.removeEventListener('load', completed);
            callback();
        };

        document.addEventListener('DOMContentLoaded', completed);
        window.addEventListener('load', completed);
    };

    ao.get = function (id) {
        return document.getElementById(id);
    };

    ao.isArrayLike = isArrayLike;

    ao.form = function (form) {
        if (typeof form === 'undefined') {
            form = document.forms[0];
        }
        return new AoForm(form);
    };

    return ao;
})();