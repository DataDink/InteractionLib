window.behaviors.add('ajax-view', function() {
   var container = this;
   var request = new window.behaviors.extensions.ajax();
   request.uri = container.getAttribute('href') || container.getAttribute('data-href');
   if (!request.uri) { return; }
   request.onsuccess = function() {
      container.innerHTML = this.responseText;
   };
   request.send();
})
