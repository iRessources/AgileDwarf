jQuery(function ()
{
    jQuery.noConflict();
    jQuery('#settings_stcolumncount').change(function ()
    {
        var count = $(this).val();
        jQuery('#stcolumns p:lt(' + count + ')').show();
        jQuery('#stcolumns p:gt(' + (count - 1) + ')').hide();
    }).change();
});