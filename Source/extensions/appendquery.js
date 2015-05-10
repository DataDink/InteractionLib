window.behaviors.extensions.appendquery = function(uri, query) {
   query = (query || '').replace(/^[\/\s&\?]+/g, ''); uri = (uri || '').replace(/[\/\s]+$/g, '');
   if (!query) { return uri; } if (!uri) { return query; }
   return uri + (uri.indexOf('?') >= 0 ? '&' : '?') + query;
}
