window.behaviors.extensions = window.behaviors.extensions || {};
window.behaviors.extensions.appendquery = function(uri, query) {
   var join = uri.indexOf('?') >= 0 ? '&' : '?';
   return uri.replace(/[\/\s]+$/g, '') + join + query.replace(/^[\/\s&\?]+/g, '');
}
