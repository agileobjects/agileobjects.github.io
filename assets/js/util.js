(function ($) {
    (function (ao) {
        ao.$getById = function (id) {
            return $(this.getById(id));
        };

        ao.getById = function (id) {
            return document.getElementById(id);
        };

        ao.formSubmitting = function($form) {
            this._coverForm();
            this._$getFormElements($form).prop('disabled', true);
            this._$showPopup('progress').hide().removeClass('hidden').fadeIn();
        };

        ao.formReset = function($form) {
            this._$getPopup().fadeOut().removeClass('with-message');
            this._$getFormElements($form).prop('disabled', false);
            this._uncoverForm();
        }

        ao.formOk = function() {
            this._$showPopup('complete-ok');
        }

        ao.formError = function() {
            this._$showPopup('complete-error');
        }

        ao._$showPopup = function(contentId) {
            var $popup = this._$getPopup();
            var $content = ao.$getById(contentId);
            if ($content.find('.message:first').length) {
                $popup.addClass('with-message');
            }
            return $popup.html($content.html());
        }

        ao._$getFormElements = function ($form) {
            return $form.find('input,textarea');
        };

        ao._coverForm = function () {
            this._$getFormCover().removeClass('hidden');
        };

        ao._uncoverForm = function () {
            this._$getFormCover().addClass('hidden');
        };

        ao._$getFormCover = function() {
            return ao.$getById('progress-cover');
        };

        ao._$getPopup = function () {
            return ao.$getById('popup');
        }
    })(window.AgileObjects || (window.AgileObjects = {}));
})(jQuery);