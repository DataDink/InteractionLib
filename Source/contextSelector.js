(function() {
	/***********************************************************************************/
	/*                      contextSelector(All) Extension                             */
	/*                                                                                 */
	/* Extends the DOM with both contextSelector and contextSelectorAll methods        */
	/* which allow a slightly extended selector model over querySelector(All).         */
	/*                                                                                 */
	/* Syntax: [context]>>[selector]                                                   */
	/*                                                                                 */
	/* Contexs:                                                                        */
	/*    'parent': Selects parent(s) of the current element matching the selector.    */
	/*    'next': Selects sibling(s) after the current element matching the selector.  */
	/*    'prev': Selects sibling(s) before the current element matching the selector. */
	/*                                                                                 */
	/***********************************************************************************/
	
	function wirePolyfill(context) {
		context.matchesSelector = context.matchesSelector
			|| context.webkitMatchesSelector
			|| context.mozMatchesSelector
			|| context.msMatchesSelector
			|| context.oMatchesSelector
			|| function(selector) {
				var container = this.parent || document, matches = container.querySelectorAll(selector), i = -1;
				while(matches[++i] && matches[i] != this);
				return !!matches[i];
			};
	}
	wirePolyfill(window.Element.prototype);
	wirePolyfill(window.document);
	
	function toArray(collection) { return !collection ? [] : Array.prototype.slice.call(collection, 0); }
	
	function single(context, selector, itteration) {
		var sibling = context[itteration];
		while (!!sibling) { 
			if (!!sibling.matchesSelector && sibling.matchesSelector(selector)) { return sibling; }
			sibling = sibling[itteration];
		}
	}
	
	function multiple(context, selector, itteration) {
		var matches = [];
		var sibling = context[itteration];
		while (!!sibling) { 
			if (!!sibling.matchesSelector && sibling.matchesSelector(selector)) { matches.push(sibling); } 
			sibling = sibling[itteration];		
		}
		return matches;
	}
	
	function contextSelect(source, selector, selectionMethod, matchMethod) {
		var parts = (selector || '').split('>>', 2), context = (parts[0] || '').replace(/s+/g, '').toLowerCase(), query = (parts[1] || '');
		if (context === 'parent') { return matchMethod(source, query, 'parentNode'); }
		if (context === 'next') { return matchMethod(source, query, 'nextSibling'); }
		if (context === 'prev') { return matchMethod(source, query, 'previousSibling'); }
		if (!context) { return toArray(source[selectionMethod](selector)); }
	}
	
	function wireExtension(context) {
		context.contextSelector = context.contextSelector
			|| function(selector) { return contextSelect(this, selector, this.querySelector, single); };
		context.contextSelectorAll = context.contextSelectorAll
			|| function(selector) { return contextSelect(this, selector, this.querySelectorAll, multiple); };
	}
	wireExtension(window.Element.prototype);
	wireExtension(window.document);
})();
