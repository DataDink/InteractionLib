Interaction Lib (1.0.0 Documentation)
=====================================

by Mark Nelson, Dave Reed, Thomas Dupont

This is a jQuery plugin library designed to support easy wiring for common ajax and UI interactions.
For code samples and additional documentation please [visit my blog](http://markernet.blogspot.com/2012/02/interactionlib-sample-code.html).
(Never fear! There will be more code samples! I promise!)

Requirements:
-------------
* jQuery
* jQueryUI


What it does:
-------------
* At its core it allows you to send an ajax request to the server and post the results on your page or in a modal dialog completely configured in your markup via a minimal amount of data attributes (no javascript needed).
* Can facilitate the wiring of other jquery plugins directly from your markup, also with a minimal amount of attributes.
* Greatly decreases the amount of time it takes to produce interactive pages.
* Greatly decreases the amount of maintenance required for interactive pages.

The data-ajaxform attributes and what they do:
----------------------------------------------
* data-ajaxform-action
    * Sets the server URL for the interaction.
    * Can be placed directly on an event-element or a containing element.
    * The URL can contain configuration parameters or the action-element can contain inputs and work in much the same way a regular `<form>` would.
* data-ajaxform-method (optional)
    * Can be set to GET or POST.
    * Defaults to POST
* data-ajaxform-events
    * Sets the element to be an event-element that will trigger the interaction.
    * Can be placed directly on an action-element or contained within an action-element to work much like a submit button or control would in a regular `<form>`
    * Supports "click", "change", "keyup", and a custom event "enterkey".
    * Can be extended to support additional proper and/or custom events.
* data-ajaxform-target (optional)
    * Defaults to no value
    * Sets the jQuery selector that will identify the element to place the server response within.
    * The contents of the targeted element(s) will be replaced with the response.
* data-ajaxform-append (optional)
    * Defaults to no value
    * Sets the jQuery selector that will identify the element to append the server response to.
    * The contents of the targeted element(s) will be appended to the response.
* data-ajaxform-prepend (optional)
    * Defaults to no value
    * Sets the jQuery selector that will identify the element to prepend the server response to.
    * The contents of the targeted element(s) will be prepended to the response.
* data-ajaxform-mode (optional)
    * Defaults to "form"
    * Sets the behavior of the interaction 
    * Can be set to "form", "modal", "upload", "multi-upload" by default. (see below for behavior descriptions)
    * Behaviors can be extended to support additional behaviors.
* data-ajaxdialog-title (optional)
    * Defaults to no value
    * Sets the title of the dialog created with the "modal" behavior.
* data-ajaxdialog-cancel (optional)
    * Defaults to no value
    * Sets the jQuery selector that will identify elements loaded into the "modal" dialog that can be clicked to close the dialog.
* data-ajaxdialog-width (optional)
    * Defaults to no value
    * Sets a fixed width of any dialog produced by the interaction.
* data-ajaxdialog-height (optional)
    * Defaults to no value
    * Sets a fixed height of any dialog produced by the interaction
* data-ajaxconfirm-title (optional)
    * Defaults to no value
    * Sets the title of the dialog used to confirm the interaction (if applicable)
* data-ajaxconfirm-message (optional)
    * Defaults to no value
    * Triggers a confirmation dialog to be shown before performing the interaction to prompt the user to confirm the interaction.
* data-ajaxconfirm-continue (optional)
    * Defaults to "Continue"
    * Sets the text of the "Continue" button on the confirmation dialog displayed for this interaction (if applicable)
* data-ajaxconfirm-cancel (optional)
    * Defaults to "Cancel"
    * Sets the text of the "Cancel" button on the confirmation dialog displayed for this interaction (if applicable)

The data-interaction attributes and what they do
------------------------------------------------
* data-interaction
    * Executes the jQuery plugin on the element
    * Example: data-interaction="datepicker" is the same as $('selector').datepicker();
* data-configuration-x (optional)
    * Sets the configuration value 'x' when wiring the element to the plugin
    * Example: data-configuration-format="mm/dd/yyyy" is the same as $('selector').datepicker({format: 'mm/dd/yyyy'});
* data-config-names (optional)
    * Used as a casing key to define proper casing for configuration property names if they are case sensitive. (because attribute names are not) 

The ajaxform modes/behaviors
----------------------------
* form
    * Default behavior
    * Sends data to the url specified in the data-ajaxform-action attribute
    * Places the response markup on the page at the location specified by the data-ajaxform-target, data-ajaxform-append, or data-ajaxform-prepend attributes
    * Triggered by the event specified by the data-ajaxform-events attribute
* modal
    * Behaves exactly as 'form' except the output will be sent to a jQueryUI modal dialog
* upload
    * Behaves exactly as 'form' except the user will be prompted to select files which will then be sent with the request.
* multi-upload
    * Behaves exactly as 'upload' except the file prompt given to the user will have multi-select enabled (where available) 

The ajaxform events/triggers
----------------------------
* click
    * Causes the interaction to occur when the element is clicked
* keyup
    * Causes the interaction to occur when the input receives a key stroke
* change
    * Causes the interaction to occur when the input's value is considered to be changed
* enterkey
    * Causes the interaction to occur when the input receives a key stroke from the enter key
