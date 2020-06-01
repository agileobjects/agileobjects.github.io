var Ao = (function () {
    // Helpers
    function doOne(callback) {
        callback.call(this, this.e);
        return this;
    }

    function doAll(callback) {
        var elems = this.e;
        for (var i = 0, l = elems.length; i < l; ++i) {
            callback.call(this, elems[i]);
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

    // Instance members
    var AoObj = function (elemOrId) {
        this._data = {};
        if (typeof elemOrId === 'undefined') {
            single(this, empty);
        }
        else if (typeof elemOrId === 'string') {
            single(this, Ao.get(elemOrId));
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

    var AoPopup = function () {
        AoObj.call(this, 'popup');
    };

    var AoSubmit = function (formAoObj) {
        AoObj.call(this, formAoObj.getByCss('input[type="submit"]'));
    };

    var AoForm = function (form) {
        AoObj.call(this, form);
        this._cover = new AoObj('progress-cover');
        this._popup = new AoPopup();
        this.submit = new AoSubmit(this);
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
        }
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

    AoPopup.prototype = Object.create(AoObj.prototype);

    AoPopup.prototype.show = function (contentId) {
        var content = new AoObj(contentId);
        if (content.getByCss('.message')) {
            this.addClass('with-message');
        }
        this.e.innerHTML = content.e.innerHTML;
        return this;
    };

    AoPopup.prototype.reset = function () {
        return this.removeClass('with-message');
    };

    AoForm.prototype = Object.create(AoObj.prototype);

    AoForm.prototype.validate = function () {
        for (var i = 0, l = this.e.length; i < l; ++i) {
            var input = this.e[i];
            if (!Boolean(input.getAttribute('data-val'))) { continue; }

        }
        return false;
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
    var ao = function (elem) {
        return new AoObj(elem);
    };

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