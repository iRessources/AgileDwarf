$(function ()
{
    $('#settings_stcolumncount').change(function ()
    {
        var count = $(this).val();
        $('#stcolumns p:lt(' + count + ')').show();
        $('#stcolumns p:gt(' + (count - 1) + ')').hide();
    }).change();
});