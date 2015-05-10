(function() {
   var staparent = document.createElement('div');
   function wirePolyfill(context) {
      context.matches = context.matches
         || context.matchesSelector
			|| context.webkitMatchesSelector
			|| context.mozMatchesSelector
			|| context.msMatchesSelector
			|| context.oMatchesSelector
			|| function(selector) {
            var rigparent = !this.parent, container = (rigparent ? staparent : this.parent);
            if (rigparent) { staparent.appendChild(this); }
            var matches = container.querySelectorAll(selector), i = -1;
				while(matches[++i] && matches[i] != this);
            if (rigparent) { staparent.removeChild(this); }
				return !!matches[i];
			};
	}
	wirePolyfill(window.Element.prototype);
	wirePolyfill(window.document);
})();
