(function() {
   var parser = document.createElement('div');
   window.behaviors.extensions.parse = function(html) {
      var content = [];
      parser.innerHTML = html;
      var content = window.behaviors.extensions.toarray(parser.childNodes);
      while (parser.firstChild) { parser.removeChild(parser.firstChild); }
      return content;
   };
})();
