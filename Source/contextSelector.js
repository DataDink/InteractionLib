(function() {
	/***********************************************************************************/
	/*                      contextSelector Extension                                  */
	/*                                                                                 */
	/* Extends the DOM with the contextSelector method which allows a modified         */
	/* selector model over querySelector and querySelectorAll.                         */
	/*                                                                                 */
	/* Syntax: [context]>>[selector]                                                   */
	/*                                                                                 */
	/* Contexs:                                                                        */
	/*    'parent':   Selects a single matching parent of the current element.         */
	/*    'parents':  Selects all matching parents of the current element.             */
	/*    'child':    Selects a single matching child of the current element.          */
	/*    'children': Selects all matching children of the current element.            */
	/*    'next':     Selects a single matching sibling after the current element.     */
	/*    'nextAll':  Selects all matching siblings after the current element.         */
	/*    'prev':     Selects a single matching sibling before the current element.    */
	/*    'prevAll':  Selects all matching siblings before the current element.        */
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
		var relative = context[itteration];
		while (!!relative) { 
			if (!!relative.matchesSelector && relative.matchesSelector(selector)) { return [relative]; }
			relative = relative[itteration];
		}
	}
	
	function multiple(context, selector, itteration) {
		var matches = [];
		var relative = context[itteration];
		while (!!relative) { 
			if (!!relative.matchesSelector && relative.matchesSelector(selector)) { matches.push(relative); } 
			relative = relative[itteration];		
		}
		return matches;
	}
	
	function select(context, selector, single) {
		var results = toArray(context.querySelectorAll(selector));
		if (!single) { return results; }
		if (results.length === 0) { return results; }
		return [results[0]];
	}
	
	function contextSelect(source, selector) {
		var parts = (selector || '').split('>>', 2), context = (parts[0] || '').replace(/\s+/g, '').toLowerCase(), query = (parts[1] || '');
		if (context === 'parent') { return single(source, query, 'parentNode'); }
		if (context === 'parents') { return multiple(source, query, 'parentNode'); }
		if (context === 'child') { return select(source, query, true); }
		if (context === 'children') { return select(source, query, false); }
		if (context === 'next') { return single(source, query, 'nextSibling'); }
		if (context === 'nextall') { return multiple(source, query, 'nextSibling'); }
		if (context === 'prev') { return single(source, query, 'previousSibling'); }
		if (context === 'prevall') { return multiple(source, query, 'previousSibling'); }
		return toArray(document.querySelectorAll(selector));
	}
	
	function wireExtension(context) {
		context.contextSelector = context.contextSelector
			|| function(selector) { return contextSelect(this, selector); };
	}
	wireExtension(window.Element.prototype);
	wireExtension(window.document);
})();
