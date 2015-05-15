window.behaviors.extensions.ajax = function() {
   var instance = this;
   instance.send = function(method, uri, data, success, error, callback) {
      var request = new window.behaviors.extensions.ajax.request(method, uri, data);
      request.send(function(ajax) {
         var succeeded = this.status >= 200 && this.status < 300 || this.status === 304;
         if (succeeded && success) { success.call(this); }
         if (!succeeded && error) { error.call(this); }
         if (callback) { callback.call(this); }
      });
   }
};

window.behaviors.extensions.ajax.request = function(method, uri, data) {
   var instance = this;
   instance.method = method;
   instance.uri = uri;
   instance.data = data;

   instance.send = function(callback) {
      var verb = (method || 'get').toLowerCase();
      var usebody = (verb === 'post' || verb === 'put' || verb === 'patch' || verb === 'update');
      var request = {
         method: instance.method,
         uri: instance.uri,
         data: instance.data || {},
         query: !instance.data ? '' : window.behaviors.extensions.toquery(instance.data)
      }
      request.requestUri = usebody ? request.uri : window.behaviors.extensions.appendquery(request.uri, request.query);

      var ajax = (!window.XMLHttpRequest) ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
      ajax.open(request.method, request.requestUri, true);
      ajax.onreadystatechange = (function(ajax) { return function() {
         if (ajax.readyState !== 4) { return; }
         var response = new window.behaviors.extensions.ajax.response(request, ajax);
         callback.call(response, ajax);
      };})(ajax);
      ajax.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      if (usebody) {
         ajax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
         ajax.send(request.query);
      } else {
         ajax.send();
      }
   }
};

window.behaviors.extensions.ajax.response = function(request, ajax) {
   this.uri = request.uri;
   this.method = request.method;
   this.data = request.data;
   this.query = request.query;
   this.requestUri = request.requestUri;
   this.status = ajax.status;
   this.type = ajax.responseType;
   this.response = ajax.responseText;
};
