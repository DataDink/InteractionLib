function setEventingPolyfills(obj) {
   obj.addEventListener = obj.addEventListener || function(name, handler) { this.attachEvent('on' + name, handler); };
   obj.removeEventListener = obj.removeEventListener || function(name, handler) { this.detachEvent('on' + name, handler); };
}
setEventingPolyfills(window.Element.prototype);
setEventingPolyfills(window.document);
setEventingPolyfills(window);
