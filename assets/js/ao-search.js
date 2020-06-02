(function (ao) {
    'use strict';

    var SearchOpts = function () { };
    SearchOpts.prototype = {
        min: 3,
        json: [],
        template: '<li><a href="{url}" title="{desc}">{title}</a></li>',
        noResults: 'No results found',
        limit: 10
    };

    function isRelevant(key) {
        switch (key) {
            case 13:
            case 16:
            case 20:
            case 37:
            case 38:
            case 39:
            case 40:
            case 91:
                return false;

            default:
                return true;
        }
    }

    var AoSearch = function (userOpts) {
        this._ready = false;
        this._opts = ao.merge(new SearchOpts(), userOpts);

        ao.ajax({
            type: 'GET',
            url: this._opts.url,
            ctx: this,
            onSuccess: function (response) {
                this._opts.json = response.data;
                this._ready = true;
                this._search();
            }
        });

        this._input = ao(this._opts.input).keyup(function (evt) {
            if (isRelevant(evt.which)) {
                this._search();
            }
        }, this);

        this._output = ao(this._opts.output);
    };

    AoSearch.prototype._search = function () {
        if (this._ready === false) { return; }
        this._output.clear();
        var key = this._input.e.value.trim();
        if (Boolean(key) && key.length >= this._opts.min) {
            this._render(this._getMatches(key));
        }
    };

    function isMatch(keys, value) {
        if (!Boolean(value)) { return false; }
        value = value.trim().toLowerCase();

        return (keys.filter(function (word) {
            return value.indexOf(word) >= 0;
        }).length === keys.length);
    }

    AoSearch.prototype._getMatches = function (key) {
        var results = this._opts.json;
        var l = results.length;
        var limit = this._opts.limit;
        var matches = [];
        var keys = key.toLowerCase().split(' ');
        for (var i = 0; i < l && matches.length <= limit; ++i) {
            var result = results[i];
            for (var propertyName in result) {
                if (result.hasOwnProperty(propertyName) && isMatch(keys, result[propertyName])) {
                    matches.push(result);
                    break;
                }
            }
        }
        return matches;
    };

    var placeholderRe = /\{(.*?)\}/g;

    function renderResult(match) {
        return this._opts.template.replace(placeholderRe, function (_, prop) {
            return match[prop] || _;
        });
    }

    AoSearch.prototype._render = function (matches) {
        var l = matches.length;
        if (l === 0) {
            this._output.html(this._opts.noResults);
            return;
        }
        var output = [];
        for (var i = 0; i < l; ++i) {
            output.push(renderResult.call(this, matches[i]));
        }
        this._output.html(output.join('\n'));
    };

    ao.search = function (userOpts) {
        return new AoSearch(userOpts);
    };
})(Ao);