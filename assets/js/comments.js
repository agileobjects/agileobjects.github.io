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
                    this.submitButtonDefaultText = this.submitButton.value;
                    this.submitButtonDefaultTitle = this.submitButton.title;
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
                    if (!$form.valid()) { return false; }

                    if (this.submitButton.value !== 'Confirm comment') {
                        this.submitButton.value = 'Confirm comment';
                        this.submitButton.title = 'Click again to confirm your comment';
                        this.submitButton.classList.add('confirm-button');
                        return false;
                    }

                    ao.formSubmitting($form);

                    this.rememberMe.checked
                        ? this.storeUser(this.name.value, this.identity.value)
                        : this.storeUser('', '');

                    var formData = {
                        postId: ao.getById('post-id').value,
                        commentSite: ao.getById('comment-site').value,
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
                        this.submitButton.value = this.submitButtonDefaultText;
                        this.submitButton.title = this.submitButtonDefaultTitle;
                        this.submitButton.classList.remove('confirm-button');
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

/*
 *Haack.ready(function() {

  let form = Haack.get('commentform')

  if (form) {
    var emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+$/
    var avatarPreview = Haack.get('avatarPreview')
    avatarPreview.onerror = (e) => { tryLoad(e.target, 1) }

    function changeAvatar() {
      let image = avatarPreview
      image.possible = buildPossibleAvatars(Haack.get('identity').value)
      image.currentIndex = 0
      tryLoad(image)
    }

    function tryLoad(image, increment) {
      if (increment) {
        image.currentIndex += increment
      }

      if (image.currentIndex < image.possible.length) {
        image.src = image.possible[image.currentIndex]
      }
      else {
        image.onerror = null
        image.src = image.dataset.fallbacksrc;
      }
    }

    function buildPossibleAvatars(identity) {
      let possibleAvatars = []

      if (identity.match(emailRegex)) {
        possibleAvatars.push('https://secure.gravatar.com/avatar/' + md5(identity) + '?s=80&d=identicon&r=pg')
      } else {
        possibleAvatars.push('https://github.com/' + identity + '.png')
        possibleAvatars.push('https://avatars.io/twitter/' + identity + '/medium')
      }

      return possibleAvatars
    }

    Haack.get('comment-div').oninput = (e) => {
      Haack.get('message').value = e.target.innerText
    }

    Haack.get('identity').onchange = () => {
      changeAvatar()
    }

    function storeUser(name, identity) {
      window.localStorage.name = name;
      window.localStorage.identity = identity;
    }

    function retrieveUser(nameInput, identityInput, rememberCheckbox) {
      var rememberMe = false
      if (window.localStorage.name) {
        nameInput.value = window.localStorage.name;
        rememberMe = true
      }
      if (window.localStorage.identity) {
        identityInput.value = window.localStorage.identity;
        rememberMe = true
      }
      if (rememberMe) {
        rememberCheckbox.checked = true
      }
    }

    Haack.get('commentbutton').onclick = (e) => {
      let status = Haack.get('commentstatus')
      status.innerText = ''

      let missing = Array.from(form.querySelectorAll('[data-required]')).filter(el => el.value === '').map(el => el.name)
      if (missing.length > 0) {
        status.innerText = 'Some required fields are missing - (' + missing.join(', ') + ')'
        return
      }
      let button = e.target
      if (button.innerText != 'Confirm comment') {
        button.innerText = 'Confirm comment'
        button.title = 'Click the button again to confirm the comment'
        button.classList.add('confirm-button')
        return
      }
      let name = Haack.get('name')
      let identity = Haack.get('identity')

      if (Haack.get('remember').checked) {
        storeUser(name.value, identity.value)
      }
      else {
        storeUser('', '')
      }
      Haack.get('avatarInput').value = avatarPreview.src

      button.disabled = true
      button.innerText = 'Posting...'
      identity.value = ""
      form.action = form.dataset.action
      form.submit()
    }

    // Load values from Local Storage.
    retrieveUser(Haack.get('name'), Haack.get('identity'), Haack.get('remember'))
    changeAvatar() // initial load of avatar
  }
})
 */