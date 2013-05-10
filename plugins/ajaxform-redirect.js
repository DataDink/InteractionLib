(function($) {
    $.interaction.register('page', function(context) {
        if (context.method.toLowerCase().trim() === 'post') { // Create a hidden 'real' form to submit
            var form = $('<form>', { css: { display: 'none' }, method: 'POST', action: context.action })
                .appendTo('body');
            $.each(context.query, function(name, value) {
                $('<input type="hidden" name="' + name + '" />')
                    .appendTo(form)
                    .val(value);
            });
            form.submit();
        } else { // Append the form parameters to the url and redirect
            var url = context.action + '?' + $.param(context.query, true);
            window.location = url;
        }
    });
})(jQuery);