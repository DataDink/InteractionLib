window.behaviors.extensions.values = function(input) {
   var name = input.getAttribute('name') || input.getAttribute('data-name');
   if (!name) { return false; }
   var values = [];
   if (input.matches('select')) {
      for (var i = 0; i < input.options.length; i++) {
         if (input.options[i].selected) { values.push(input.options[i].value); }
      }
   } else if (input.matches('input[type=checkbox]') || input.matches('input[type=radio]')) {
      if (!input.checked) { return false; }
      else { values.push(input.value); }
   } else if ('value' in input && input.value) {
      values.push(input.value);
   } else {
      values.push(input.getAttribute('data-value'));
   }
   return { name: name, values: values };
}
