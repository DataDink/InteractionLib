window.behaviors.extensions.appenduri = function(left, right) {
   left = left.replace(/[\/\s]+$/g, ''); right = right.replace(/^[\/\s]+/g, '');
   if (!left) { return right; } if (!right) { return left; }
   return left + '/' + right;
}
