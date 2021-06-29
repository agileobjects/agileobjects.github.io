$(function () {
    var i, l, terms = document.location.search.substring(1).split('&'), term = '';
    for (i = 0, l = terms.length; i < l; ++i) {
        term = terms[i].split('=');
        if (term[0] === 't') {
            term = term[1];
            break;
        }
    }
    var hlCode = document.querySelectorAll('pre code.language-cs'),
        hlLength = hlCode.length,
        termsRegex = new RegExp('\\b(' + term + ')\\b', 'g'),
        typeRegex = /(new<\/span>\W+|class<\/span> <span class="hljs-title">|public<\/span>\W+|: <span class="hljs-title">|&lt;)([A-Z][^& \(\[\]]+)( |{|\(|\[\]&gt;|&gt;)/g,
        genericTypeRegex = /(I{0,1}Dictionary|IEnumerable|IReadOnlyCollection|I{0,1}Collection|I{0,1}List)&lt;/g,
        observer = new MutationObserver(function (mutations) {
            for (i = 0, l = mutations.length; i < l; ++i) {
                var mutation = mutations[i];
                if (mutation.attributeName === 'class') {
                    var innerHtml = mutation.target.innerHTML
                        .replace(termsRegex, '<span class="hljs-type">$1</span>')
                        .replace(typeRegex, '$1<span class="hljs-type">$2</span>$3')
                        .replace(genericTypeRegex, '<span class="hljs-type">$1</span>&lt;');
                    mutation.target.innerHTML = innerHtml;
                }
            }
        }),
        config = { attributes: true };

    for (i = 0; i < hlLength; ++i) {
        observer.observe(hlCode[i], config);
    }
    alert(termsRegex);
});