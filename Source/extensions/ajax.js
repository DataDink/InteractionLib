window.behaviors.extensions.ajax = function() {
   var instance = this;
   instance.method = 'get';
   instance.uri = '';
   instance.data = {};

   instance.onerror = function() {};
   instance.onsuccess = function() {};
   instance.oncomplete = function() {};

   instance.send = function() {
      var request = (!window.XMLHttpRequest) ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
      var verb = (instance.method || 'get').toLowerCase();
      var usebody = (verb === 'post' || verb === 'put' || verb === 'patch' || verb === 'update');
      var query = !instance.data ? '' : window.behaviors.extensions.toquery(instance.data);
      var uri = usebody ? instance.uri : window.behaviors.extensions.appendquery(instance.uri, query);

      request.open(verb, uri, true);
      request.onreadystatechange = (function(request) { return function() {
         if (request.readyState !== 4) { return; }
         var isSuccess = request.status >= 200 && request.status < 300 || request.status === 304;
         if (isSuccess && instance.onsuccess) { instance.onsuccess.call(request); }
         if (!isSuccess && instance.onerror) { instance.onerror.call(request); }
         if (instance.oncomplete) { instance.oncomplete.call(request); }
      };})(request);
      request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      if (usebody) {
         request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
         request.send(query);
      } else {
         request.send();
      }
   }
}
