var Ao = (function () {
    'use strict';

    // Helpers
    function doNothing() { }

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
        classList: { add: doNothing, remove: doNothing },
        style: {},
        addEventListener: doNothing,
        dispatchEvent: doNothing
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
        } else if (typeof elemOrId === 'string') {
            single(this, ao.get(elemOrId));
        } else {
            if (elemOrId === window || elemOrId === document || elemOrId === document.body) {
                single(this, elemOrId);
            }
            else if (isArrayLike(elemOrId)) {
                if (elemOrId.length === 1) {
                    single(this, elemOrId[0]);
                } else {
                    this.e = elemOrId;
                    this._do = doAll;
                }
            } else {
                single(this, elemOrId);
            }
        }
    };

    function registerOrDispatch(eventName, callback, ctx) {
        if (typeof callback === 'function') {
            return this.on(eventName, callback, ctx);
        }
        this.e.dispatchEvent(new Event(eventName));
        return this;
    }

    AoObj.prototype = {
        getByCss: function(selector) {
            return this.e.querySelector(selector);
        },
        getAllByCss: function(selector) {
            return this.e.querySelectorAll(selector);
        },
        html: function(updatedHtml) {
            if (typeof updatedHtml === 'string') {
                this.e.innerHTML = updatedHtml;
                return this;
            }
            return this.e.innerHTML;
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
        toggleClass: function (name) {
            return this._do(function (e) {
                e.classList.contains(name)
                    ? e.classList.remove(name)
                    : e.classList.add(name);
            });
        },
        css: function () {
            if (arguments.length === 1) {
                var name = arguments[0];
                if (typeof name === 'string') {
                    return getComputedStyle(this.e).getPropertyValue(name);
                }
            }
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
        on: function (eventTypes, callback, ctx) {
            var events = eventTypes.split(' ');
            var l = events.length;
            var that = ctx || this;
            var cxtCallback = function (evt) {
                callback.call(that, evt);
            };
            return this._do(function (e) {
                for (var i = 0; i < l; ++i) {
                    e.addEventListener(events[i], cxtCallback);
                }
            });
        },
        click: function (callback, ctx) {
            return registerOrDispatch.call(this, 'click', callback, ctx);
        },
        blur: function (callback, ctx) {
            return registerOrDispatch.call(this, 'blur', callback, ctx);
        },
        keyup: function (callback, ctx) {
            return registerOrDispatch.call(this, 'keyup', callback, ctx);
        },
        clear: function() {
            return this.html('');
        }
    };

    ao.derive = function (ctor) {
        ctor.prototype = Object.create(AoObj.prototype);
        ctor.prototype._base = AoObj;
        return ctor;
    };

    // AoSubmit
    var AoSubmit = ao.derive(function (formAoObj) {
        AoObj.call(this, formAoObj.getByCss('input[type="submit"]'));
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

    // AoPopup
    var AoPopup = ao.derive(function () {
        AoObj.call(this, 'popup');
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

    var AoValidator = ao.derive(function (input) {
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

    ao.merge = function (to, from) {
        for (var propertyName in from) {
            if (from.hasOwnProperty(propertyName)) {
                to[propertyName] = from[propertyName];
            }
        }
        return to;
    };

    ao.serialize = function (obj) {
        var str = [];
        for (var propertyName in obj) {
            if (obj.hasOwnProperty(propertyName)) {
                str.push(encodeURIComponent(propertyName) + '=' + encodeURIComponent(obj[propertyName]));
            }
        }
        return str.join('&');
    };

    // Ajax
    function getXhr() {
        return window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
    }

    var AjaxOpts = function () { };
    AjaxOpts.prototype = { type: 'GET', async: true };
    AjaxOpts.prototype.onFail = doNothing;
    AjaxOpts.prototype.onSuccess = doNothing;

    var done = 4;

    ao.ajax = function (userOpts) {
        var opts = ao.merge(new AjaxOpts(), userOpts);
        var xhr = getXhr();
        xhr.open(opts.type, opts.url, opts.async);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === done) {
                var response = {};
                if (Boolean(xhr.responseText)) {
                    try {
                        response.data = JSON.parse(xhr.responseText);
                    } catch (parseErr) {
                        response.data = xhr.responseText;
                    }
                }
                response.statusCode = xhr.status;
                var ctx = opts.hasOwnProperty('ctx') ? opts.ctx : null;
                if (xhr.status >= 400) {
                    opts.onFail.call(ctx, response);
                } else {
                    try {
                        opts.onSuccess.call(ctx, response);
                    } catch (err) {
                        response.error = err;
                        opts.onFail.call(ctx, response);
                    }
                }
            }
        };
        if (opts.hasOwnProperty('data') === false) {
            xhr.send();
            return;
        }
        var dataType, data;
        if (opts.hasOwnProperty('isJson') && opts.isJson === true) {
            dataType = 'json';
            data = JSON.stringify(opts.data);
        } else {
            dataType = 'x-www-form-urlencoded';
            data = ao.serialize(opts.data);
        }
        xhr.setRequestHeader('Content-Type', 'application/' + dataType);
        xhr.send(data);
    };

    ao.form = function (form) {
        if (typeof form === 'undefined') {
            form = document.forms[0];
        }
        return new AoForm(form);
    };

    return ao;
})();