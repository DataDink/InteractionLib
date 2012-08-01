
///////////////////////////////////////////////////////////////////////////////////////////////
//  Interaction Lib v1.0.1
//  By Mark Nelson, Dave Reed, Thomas Dupont
//
//  Provides common ui interactions based on element behavior mappings.
///////////////////////////////////////////////////////////////////////////////////////////////
//
// Documentation: http://www.markonthenet.com/interactionlib/#documentation.htm
// Samples:       http://www.markonthenet.com/interactionlib/#../Demos/IntLib
//
///////////////////////////////////////////////////////////////////////////////////////////////

(function ($) {
    var defaultInteraction = '';
    var registrations = {};
    // Basic interaction functionality that will be globally accessible
    $.interaction = {
        register: function (name, interaction) {
            if (!defaultInteraction) {
                defaultInteraction = name;
            }
            registrations[name] = interaction;
        },

        serialize: function (element) {
            /// <summary> Searches child elements to create an ajax argument object from named inputs. </summary>
            var values = {};
            var inputs = $(element).find('[name]');
            if ($(element).is('[name]')) { $.merge(inputs, element); }
            inputs.each(function () {
                var input = $(this);
                var name = input.attr('name');
                var isArray = (name.length >= 2) && (name.substr(name.length - 2) === '[]');
                var isRadio = input.is(":radio");
                var isCheck = input.is(":checkbox");
                var isChecked = input.is(":checked");

                if (isCheck && isChecked) { // Handle checkboxes
                    if (typeof (values[name]) === 'undefined' && typeof (values[name + '[0]']) === 'undefined') {
                        values[name] = input.val();
                    } else {
                        if (typeof (values[name]) !== 'undefined') {
                            values[name + '[0]'] = values[name];
                            delete values[name];
                        }
                        var chkIndex = 1;
                        while (typeof (values[name + '[' + chkIndex + ']']) !== 'undefined') {
                            chkIndex++;
                        }
                        values[name + '[' + chkIndex + ']'] = input.val();
                    }
                } else if (isRadio && isChecked) { // Handle radio buttons
                    values[name] = input.val();
                } else if (isArray) { // Handle arrays
                    name = name.substr(0, name.length - 2);
                    var arrIndex = 0;
                    while (typeof (values[name + '[' + arrIndex + ']']) !== 'undefined') {
                        arrIndex++;
                    }
                    values[name + '[' + arrIndex + ']'] = input.val();
                } else if (!isRadio && !isCheck) { // everything else
                    values[name] = input.val();
                }
            });
            return values;
        },

        logerror: function (title, message, info) {
            /// <summary> Logs an error to the console if one is available. </summary>
            if (window.console && window.console.log) {
                window.console.log((title || '') + " : " + (message || '') + ":" + (info || ''));
            }
        }
    };

    // The interaction plugin:
    // Will be auto-wired below, but can optionally be called on an element with custom configuration.
    // $('selector').interaction({action: 'something', mode: 'something'});
    $.fn.interaction = function (configuration) {
        $(this).each(function () {
            var successState = false;
            configuration = configuration || {};
            var element = $(this);
            var form = element.closest('[data-ajaxform-action]');
            var context = {
                form: form,
                element: element,
                query: $.interaction.serialize(form),

                action: configuration.action || element.data('ajaxform-action') || form.data('ajaxform-action'), // Server action url
                method: configuration.method || element.data('ajaxform-method') || form.data('ajaxform-method') || 'POST', // GET or POST
                target: configuration.target || element.data('ajaxform-target') || form.data('ajaxform-target'), // Target selector
                append: configuration.append || element.data('ajaxform-append') || form.data('ajaxform-append'), // Append selector
                prepend: configuration.prepend || element.data('ajaxform-prepend') || form.data('ajaxform-prepend'), // Prepend selector
                mode: configuration.mode || element.data('ajaxform-mode') || form.data('ajaxform-mode') || defaultInteraction, // How this interaction will be handled
                dialogTitle: configuration.dialogTitle || element.data('ajaxdialog-title') || form.data('ajaxdialog-title'), // Title of involved dialog
                dialogCancel: configuration.dialogCancel || element.data('ajaxdialog-cancel') || form.data('ajaxdialog-cancel'), // Selector identifying cancel element in dialog
                dialogWidth: configuration.dialogWidth || element.data('ajaxdialog-width') || form.data('ajaxdialog-width'), // Optionally set the dialog width
                dialogHeight: configuration.dialogHeight || element.data('ajaxdialog-height') || form.data('ajaxdialog-height'), // Optionally set the dialog height
                confirmTitle: configuration.confirmTitle || element.data('ajaxconfirm-title') || form.data('ajaxconfirm-title'), // Optionally set the confirmation dialog title
                confirmMessage: configuration.confirmMessage || element.data('ajaxconfirm-message') || form.data('ajaxconfirm-message'), // Setting a message will trigger a confirmation for this action
                confirmContinue: configuration.confirmContinue || element.data('ajaxconfirm-continue') || form.data('ajaxconfirm-continue') || 'Continue', // Optionally set the confirmation continue button text
                confirmCancel: configuration.confirmCancel || element.data('ajaxconfirm-cancel') || form.data('ajaxconfirm-cancel') || 'Cancel', // Optionally set the confirmation cancel button text

                onError: function (response) {
                    $.interaction.logerror('interaction error', response);
                    element.trigger('ajaxform-error', response);
                },
                onSuccess: function (response) {
                    successState = true;
                    element.trigger('ajaxform-success', response);
                }
            };

            context.onComplete = function (response) {
                if (successState && response && context.target) { $(context.target).html(response); };
                if (successState && response && context.append) { $(response).appendTo(context.append); };
                if (successState && response && context.prepend) { $(response).prependTo(context.prepend); };
                element.trigger('ajaxform-complete', response);
            };

            var doInteraction = function () {
                element.trigger('ajaxform-preprocess');
                try {
                    registrations[context.mode](context);
                } catch (error) {
                    $.interaction.logerror('interaction failure', error);
                    element.trigger('ajaxform-error', error);
                }
            };

            if (context.confirmMessage) {
                var buttons = {};
                buttons[context.confirmContinue] = function () {
                    $(this).dialog('close');
                    doInteraction();
                };
                buttons[context.confirmCancel] = function () {
                    $(this).dialog('close');
                };
                var dlg = $('<div>' + context.confirmMessage + '</div>');
                dlg.dialog({
                    modal: true,
                    title: context.confirmTitle || '',
                    resizable: false,
                    draggable: false,
                    width: context.dialogWidth,
                    height: context.dialogHeight,
                    closeText: 'X',
                    buttons: buttons,
                    close: function () {
                        $(this).dialog('destroy');
                        dlg.html('');
                        dlg.remove();
                    }
                });
            } else {
                doInteraction();
            }
        });
        return $(this);
    };

    // data-ajaxform wire-ups (add new event support here)
    $('[data-ajaxform-events~=click]').live('click.interaction', function () { $(this).interaction(); });
    $('[data-ajaxform-events~=change]').live('change.interaction', function () { $(this).interaction(); });
    $('[data-ajaxform-events~=keyup]').live('keyup.interaction', function () { $(this).interaction(); });
    $('[data-ajaxform-events~=enterkey]').live('keyup.interaction', function (event) {
        if (!event || event.type !== 'keyup' || event.keyCode !== 13) {
            return;
        }
        $(this).interaction();
    });

})(jQuery);

// Interactions (add new interaction support here)
(function ($) {
    // Basic ajax form
    $.interaction.register('form', function (context) {
        var result = '';
        $.ajax(context.action, {
            type: context.method,
            data: context.query,
            dataType: 'HTML',
            cache: false,
            success: function (html) {
                context.onSuccess(html);
                result = html;
            },
            error: function (ex, type, message) {
                result = { ex: ex, type: type, message: message };
                context.onError(!!ex ? ex.responseText : message);
            },
            complete: function () {
                context.onComplete(result);
            }
        });
    });
    // Ajax modal
    $.interaction.register('modal', function (context) {
        var result = '';
        var dlg = $('<div><div class="java-interaction-overlay"></div></div>');
        dlg.dialog({
            modal: true,
            title: context.dialogTitle || '',
            resizable: false,
            draggable: false,
            width: context.dialogWidth,
            height: context.dialogHeight,
            closeText: 'X',
            close: function () {
                $(this).dialog('destroy');
                dlg.html('');
                dlg.remove();
            },
            open: function () {
                var container = $(this);
                $.ajax(context.action, {
                    type: context.method,
                    data: context.query,
                    dataType: 'HTML',
                    cache: false,
                    success: function (html) {
                        result = html;
                        context.onSuccess(result);
                        container.html(html);
                        if (context.dialogCancel) {
                            dlg.find(context.dialogCancel).click(function () {
                                dlg.dialog('close');
                            });
                        }
                    },
                    error: function (ex, type, message) {
                        result = { ex: ex, type: type, message: message };
                        context.onError(!!ex ? ex.responseText : message);
                        container.html(!!ex ? ex.responseText : message);
                    },
                    complete: function () {
                        dlg.find('.java-interaction-overlay').remove();
                        context.onComplete(result);
                    }
                });
            }
        });
    });
    // Async upload
    function doAjaxUpload(context, isMultiFile) {
        var response = '';
        var INTERACTIONUPLOADWRAPPER = '.java-interaction-uploader';
        var file = $('<input name="file" type="file" />'); // File uploads require a file input
        if (isMultiFile) { file.attr('multiple', 'multiple'); }
        var submit = null; // This will be a different function if XHR submits are not available
        var selectFile = function () {
            file.show();
            file.focus();
            file.click();
            file.hide();
        };

        file.change(function () { // File was selected by user
            submit();
        });

        //if XHR is available
        if (window.FormData) {
            context.query.uploadIsXhrCompat = true;
            var url = context.action + ((context.action.indexOf('?') > 0) ? '&' : '?') + $.param(context.query);
            // Wrap file control in an invisible container
            $('#' + INTERACTIONUPLOADWRAPPER).remove();
            var container = $('<div>', { style: 'overflow: hidden !important; display: inline-block !important; width: 0px !important; height: 0px !important; padding: 0px !important; margin: 0px !important; border: none !important;', id: INTERACTIONUPLOADWRAPPER }).insertAfter(context.element);
            container.html(file);
            submit = function () {
                var data = new FormData(); // Create a virtual form
                $.each(file[0].files, function (index) {
                    data.append('file' + (index > 0 ? index : ''), file[0].files[index]);
                });
                var request = new XMLHttpRequest(); // Create the XHR request
                request.open("POST", url);

                request.upload.onprogress = function (e) { // Handle Xhr Progress
                    var position = e.position || e.loaded;
                    var total = e.totalSize || e.total;
                    var value = position / total * 100;
                    context.element.trigger('ajaxform-progress', { position: position, total: total, value: value });
                };
                request.onprogress = request.upload.onprogress;

                request.onload = function (e) { // Handle XHR responses
                    response = e.target.response;
                    var status = e.target.status;
                    try { request.abort(); } catch (ex) { }
                    if (status === 200) {
                        context.onSuccess(response);
                    } else {
                        context.onError(response);
                    }
                    context.onComplete(response);

                };
                request.send(data); // Send the XHR request
            };
            selectFile();
        } else { // if XHR is not available - use iframe (this should eventually die away)
            context.query.uploadIsXhrCompat = false;
            var url = context.action + ((context.action.indexOf('?') > 0) ? '&' : '?') + $.param(context.query);
            // Wrap file control in an invisible iframe with form
            $('#' + INTERACTIONUPLOADWRAPPER).remove();
            var frame = $('<iframe>', { style: 'overflow: hidden !important; display: inline-block !important; width: 0px !important; height: 0px !important; padding: 0px !important; margin: 0px !important; border: none !important;', id: INTERACTIONUPLOADWRAPPER }).insertAfter(context.element);
            frame.one('load', function () { // When the frame is 'ready' add the hidden form
                var uploadBody = $(frame[0].contentDocument.body);
                var uploadForm = $('<form>', { action: url, method: "POST", enctype: "multipart/form-data" });
                file.appendTo(uploadForm);
                uploadBody.html(uploadForm);
                frame.one('load', function (e) { // Unfortunately we have no "fail" detection for form uploads
                    var result = e.target.contentWindow.document.body.innerText;
                    response = e.target.contentWindow.document.body.innerHTML;
                    if (result && result === 'error') { // meh? give SOME way to respond error
                        context.onError(response);
                    } else {
                        context.onSuccess(response);
                    }
                    context.element.trigger('ajaxform-nonxhrcomplete', response);
                    context.onComplete(response);
                });
                submit = function () { // Send the hidden form data
                    uploadForm.submit();
                };
                selectFile();
            });
        }
    };
    $.interaction.register('upload', function (context) { doAjaxUpload(context, false); });
    $.interaction.register('multi-upload', function (context) { doAjaxUpload(context, true); });

})(jQuery);

// data-interaction wire-up (Provides easy in-markup element to plugin registration)
// <input type="text" data-interaction="datePicker" /> (same as calling $('selector').datePicker() )
// configuration values for single plugins can be set using data-configuration-propertyName=""
// <input type="text"
//		  data-interaction="datePicker"
//		  data-configuration-format="mm/dd/yyyy" />
$(function () {
    var INTERACTIONQUERY = '[data-interaction]';

    function wireElements() {
        $(INTERACTIONQUERY).each(function () {
            var element = $(this);
            var interactions = element.data('interaction').split(' ');
            var configured = element.data('interactionsConfigured') || {};
            element.data('interactionsConfigured', configured);
            interactions = $.grep(interactions, function (name) {
                return (!!name && !configured[name]);
            });
            $.each(interactions, function (index, name) {
                configured[name] = true;
                var configuration = {};
                var hasConfiguration = false;
                $.each(element[0].attributes, function (idx, attr) {
                    if (attr.nodeName.indexOf('data-configuration-') === 0) {
                        hasConfiguration = true;
                        var casing = element.attr('data-config-names');
                        var key = attr.nodeName.substring(19);
                        if (casing) {
                            var expression = new RegExp('\\b' + key + '\\b', 'gi');
                            var match = expression.exec(casing);
                            key = !!(match) ? match[0] : key;
                        }
						var numeric = parseFloat(attr.nodeValue);
                        configuration[key] = (numeric || attr.nodeValue.indexOf('0') === 0) ? numeric : attr.nodeValue;
                    }
                });
                if (hasConfiguration) {
                    $.fn[name].apply(element, [configuration]);
                } else {
                    $.fn[name].apply(element);
                }
            });
        });
    };

    function hookJquery(method) {
        var jquerymethod = $.fn[method];
        $.fn[method] = function () {
            var result = jquerymethod.apply(this, arguments);
            wireElements();
            return result;
        };
    };

    $.each(['append', 'prepend', 'after', 'before', 'wrap', 'html'], function (i, v) { hookJquery(v); });
    wireElements();
});



