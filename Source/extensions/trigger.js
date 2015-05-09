window.behaviors.extensions = window.behaviors.extensions || {};
window.behaviors.extensions.trigger = function(elements, name, detail) {
   var evt = new CustomEvent(name, { bubbles: true, detail: detail });
   if (elements.dispatchEvent) { elements.dispatchEvent(evt); }
   else {
      elements = window.behaviors.extensions.toarray(elements);
      for (var i = 0; i < elements.length; i++) {
         elements[i].dispatchEvent(evt);
      }
   }
}
