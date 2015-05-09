window.behaviors.extensions = window.behaviors.extensions || {};
window.behaviors.extensions.appenduri = function(left, right) {
   return left.replace(/[\/\s]+$/g, '') + '/' + right.replace(/^[\/\s]+/g, '');
}
