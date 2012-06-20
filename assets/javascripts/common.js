var Sprints = function ()
{
    var settings = {};
    var obj = {};

    var readyList = [];

    obj.setOptions = function (opt)
    {
        settings = opt;
    };

    obj.getProjectUsers = function ()
    {
        return settings.project_users;
    };

    obj.getProjectId = function ()
    {
        return settings.project_id;
    };

    obj.l = function(s)
    {
        return settings.lang[s];
    };

    obj.getPluginUrl = function (folder, name)
    {
        var url = settings.plugin_path;
        if (folder)
            url += '/' + folder;
        if (name)
            url += '/' + name;
        return url;
    };

    obj.bindDnD = function (onChangeColumn, redraw)
    {
        var item, newList, oldList, oldPosition;
        if (redraw)
            $(".task_list").sortable('destroy');
        $(".task_list").sortable(
        {
            connectWith: ".task_list",
            start: function (ev, ui)
            {
                item = ui.item;
                newList = oldList = ui.item.parent();
                oldPosition = item.index();
            },
            stop: function (ev, ui)
            {
                var newPos = item.index();
                var prev = null;
                if (newPos != 0)
                    prev = item.parent().children(":eq(" + (newPos - 1) + ")");
                // fill common ajax params
                var id = item.prop('id');
                if (!id)
                    return;
                var params = {id: id.substr('task.'.length)};
                if (prev)
                {
                    id = prev.prop('id');
                    if (id)
                        params.prev = id.substr('task.'.length);
                } else
                    params.prev = '';
                // change position
                if (newList == oldList)
                {
                    // really move?
                    if (oldPosition != newPos)
                    {
                        $.ajax(
                        {
                            url: "/tasks/update",
                            data: params
                        });
                    }
                } else
                {
                    onChangeColumn(newList, params, oldList, item);
                    $.ajax(
                    {
                        url: "/tasks/update",
                        data: params
                    });
                }
            },
            change: function (ev, ui)
            {
                if (ui.sender)
                    newList = ui.placeholder.parent();
            }
        });
    };

    obj.ready = function (ready)
    {
        if (typeof ready != 'function')
            return ;
        readyList.push(ready);
    };

    $.ajaxSetup({type: 'POST'});

    $(document).ajaxSend(function(event, request, ajaxSettings)
    {
        if (typeof ajaxSettings.data != 'undefined')
        {
            ajaxSettings.data += '&';
        }else
        {
            ajaxSettings.data = '';
            // if s.data is empty, jquery do not add content-type to xhr-header
            request.setRequestHeader( "Content-Type", ajaxSettings.contentType);
        }
        ajaxSettings.data += "project_id=" + settings['project_id'];
        if (settings.protect_against_forgery)
            ajaxSettings.data += "&" + settings.request_forgery_protection_token + "=" + encodeURIComponent(settings.form_authenticity_token);
    });

    $(function()
    {
        for (var i = 0, len = readyList.length; i < len; ++i)
            readyList[i]();
    });

    return obj;
}();
