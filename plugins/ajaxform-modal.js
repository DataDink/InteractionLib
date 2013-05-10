(function ($) {
    $.interaction.register('modal', function (context) {
        var result = '';
        var dlg = $('<div><div class="java-interaction-overlay"></div></div>');
        dlg.dialog({
            modal: true, resizable: false, draggable: false, closeText: 'X', width: context.dialogWidth, height: context.dialogHeight, title: context.dialogTitle || '',
            close: function () {
                $(this).dialog('destroy');
                dlg.html('');
                dlg.remove();
            },
            open: function () {
                var container = $(this);
                $.ajax(context.action, {
                    type: context.method, data: context.query, cache: false, dataType: 'HTML',
                    success: function (html) {
                        result = html;
                        context.onSuccess(result);
                        container.html($.interaction.parseResponse(html));
                        if (context.dialogCancel) {
                            dlg.find(context.dialogCancel).click(function () {
                                dlg.dialog('close');
                            });
                        }
                    },
                    error: function (ex, type, message) {
                        result = { ex: ex, type: type, message: message };
                        context.onError(!!ex ? ex.responseText : message);
                        container.html($.interaction.parseResponse(!!ex ? ex.responseText : message));
                    },
                    complete: function () {
                        dlg.find('.java-interaction-overlay').remove();
                        var dlgContainer = dlg.closest('.ui-dialog');
                        var top = $(window).height() / 2 - dlgContainer.height() / 2 + $(window).scrollTop();
                        dlgContainer.css('top', top + 'px');
                        context.onComplete(result);
                    }
                });
            }
        });
    });
})(jQuery);