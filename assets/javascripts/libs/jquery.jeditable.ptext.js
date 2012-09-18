$.editable.addInputType('ptext', {
    element : function(settings, original)
    {
        var input = $(document.createElement('input'));
        input.attr('type','text');
        if (settings.width  != 'none') { input.attr('width', settings.width);  }
        if (settings.height != 'none') { input.attr('height', settings.height); }
        input.attr('autocomplete','off');
        input.attr('placeholder', settings.placeholder);
        $(this).append(input);
        input.textPlaceholder();
        return input;
    }
});
