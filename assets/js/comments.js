(function (ao) {
    (function (web) {
        var Avatar = function () {
            function avatar() {
                var that = this;

                this.possibles = [];
                this.currentIndex = 0;
                this.image = ao.get('avatar-preview');
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

                if (ao.isEmail(identity)) {
                    possibles.push('https://secure.gravatar.com/avatar/' + md5(identity) + '?s=50&d=identicon&r=pg');
                } else {
                    possibles.push('https://github.com/' + identity + '.png?size=50');
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

                this.comment = ao.get('comment');
                this.name = ao.get('name');
                this.identity = ao.get('identity');
                this.email = ao.get('email');
                this.rememberMe = ao.get('remember');
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
                var aoForm = ao.form(form);

                if (!aoForm.validate() || !aoForm.submit.confirm()) {
                    return false;
                }

                aoForm.submitting();

                this.rememberMe.checked
                    ? this.storeUser(this.name.value, this.identity.value)
                    : this.storeUser('', '');

                var formData = {
                    postId: ao.get('post-id').value,
                    message: this.comment.value,
                    name: this.name.value,
                    avatar: this.avatar.image.src
                };

                if (ao.isEmail(this.identity.value)) {
                    formData.email = this.identity.value;
                }

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

            commentForm.prototype.handlePosted = function (successful) {
                if (successful) {
                    this.comment.value = '';
                }
                ao.form().reset();
            };

            return commentForm;
        }();

        ao(function () {
            web.commentForm = new CommentForm();
            web.commentForm.load();
        });
    })(ao.Web || (ao.Web = {}));
})(Ao);