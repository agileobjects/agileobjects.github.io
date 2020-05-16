(function ($) {
    (function (ao) {
        (function (web) {
            web.emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+$/;

            var Avatar = function () {
                function avatar() {
                    var that = this;

                    this.possibles = [];
                    this.currentIndex = 0;
                    this.image = ao.getById('avatar-preview');
                    this.imageDefault = this.image.src;
                    this.image.onerror = function () { that.tryLoad(true); }
                }

                avatar.prototype.load = function (identity) {
                    this.possibles = this.buildPossibles(identity.value);
                    this.currentIndex = 0;
                    this.tryLoad();
                }

                avatar.prototype.buildPossibles = function (identity) {
                    var possibles = [];

                    if (identity.match(web.emailRegex)) {
                        possibles.push('https://secure.gravatar.com/avatar/' + md5(identity) + '?s=80&d=identicon&r=pg');
                    } else {
                        possibles.push('https://github.com/' + identity + '.png');
                        possibles.push('https://avatars.io/twitter/' + identity + '/medium');
                    }

                    return possibles;
                }

                avatar.prototype.tryLoad = function (increment) {
                    if (increment) {
                        ++this.currentIndex;
                    }

                    if (this.currentIndex < this.possibles.length) {
                        this.image.src = this.possibles[this.currentIndex];
                        return;
                    }

                    this.image.onerror = null;
                    this.image.src = this.imageDefault;
                };

                return avatar;
            }();

            var CommentForm = function () {
                function commentForm() {
                    this.avatar = new Avatar();

                    this.comment = ao.getById('comment');
                    this.name = ao.getById('name');
                    this.identity = ao.getById('identity');
                    this.email = ao.getById('email');
                    this.rememberMe = ao.getById('remember');
                    this.submitButton = ao.getById('comment-submit');
                };

                commentForm.prototype.load = function () {
                    var that = this;

                    this.identity.onchange = function () {
                        that.avatar.load(this);
                    }

                    this.retrieveUser();

                    if (this.identity.value) {
                        this.avatar.load(this.identity);
                    }
                };

                commentForm.prototype.retrieveUser = function () {
                    var remember = false;
                    if (window.localStorage.name) {
                        this.name.value = window.localStorage.name;
                        remember = true;
                    }
                    if (window.localStorage.identity) {
                        this.identity.value = window.localStorage.identity;
                        remember = true;
                    }
                    if (remember) {
                        this.rememberMe.checked = true;
                    }
                };

                commentForm.prototype.storeUser = function (name, identity) {
                    window.localStorage.name = name;
                    window.localStorage.identity = identity;
                };

                commentForm.prototype.handlePost = function (form) {
                    var $form = $(form);

                    if (!$form.valid() || !ao.submitConfirm(this.submitButton)) {
                        return false;
                    }

                    ao.formSubmitting($form);

                    this.rememberMe.checked
                        ? this.storeUser(this.name.value, this.identity.value)
                        : this.storeUser('', '');

                    var formData = {
                        postId: ao.getById('post-id').value,
                        message: this.comment.value,
                        name: this.name.value,
                        avatar: this.avatar.image.src
                    };

                    if (this.identity.value.match(web.emailRegex)) {
                        formData.email = this.identity.value;
                    }

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
                        ao.formOk();
                    });

                    return false;
                };

                commentForm.prototype.handlePosted = function (successful) {
                    var $form = ao.$getById('comment-form');
                    if (successful) {
                        this.comment.value = '';
                        ao.submitReset(this.submitButton);
                    }
                    ao.formReset($form);
                };

                commentForm.prototype._getName = function () {
                    return ao.getById('name');
                };

                commentForm.prototype._getIdentity = function () {
                    return ao.getById('identity');
                };

                commentForm.prototype._getRememberMe = function () {
                    return ao.getById('remember');
                };

                return commentForm;
            }();

            $(function () {
                web.commentForm = new CommentForm();
                web.commentForm.load();
            });
        })(ao.Web || (ao.Web = {}));
    })(window.AgileObjects || (window.AgileObjects = {}));
})(jQuery);