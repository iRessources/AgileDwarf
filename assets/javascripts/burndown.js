var Burndown = function ($)
{
    $.noConflict();

    var obj = {};
    var opt = {};
    var settings = {};

    Date.fromMysql = function(mysql)
    {
        if (typeof mysql != 'string')
            return null;
        // 2011/11/03 00:00:00 +0800
        var t = mysql.split(/[\/ \-:]/);
        // [Y, M, D]
        return Date.UTC(t[0], t[1] - 1, t[2]);
    };

    obj.setSettings = function (s)
    {
        settings = s;
    };

    obj.setOptions = function (d, spent, tasks, changes)
    {
        opt = d;

        if (!spent.length || !changes.length)
            return ;

        // spent series
        var cur = 0;
        for (var i = 0, len = spent.length; i < len; i++)
        {
            var curSpent = spent[i];
            cur += curSpent[1];
            curSpent[1] = Math.ceil(cur);
            curSpent[0] = Date.fromMysql(curSpent[0]);
        }

        // rest series
        var rest = [];
        // correct issues dates
        for (var id in tasks)
        {
            if (!tasks.hasOwnProperty(id))
                continue;
            tasks[id].created_on = Date.fromMysql(tasks[id].created_on);
        }
        // loop through changes
        for (i = 0, len = changes.length; i < len; )
        {
            // chart date
            var dateTime = Date.fromMysql(changes[i].created_on), changeDate = dateTime;

            // calculate sum of rest times for issues on the end of day with changes (when all changes was been apllied)
            var sum = 0;
            for (id in tasks)
            {
                if (!tasks.hasOwnProperty(id))
                    continue;
                var task = tasks[id];
                // delete tasks, that was created after current date
                if (task.created_on > dateTime)
                    delete tasks[id];
                else
                {
                    // rest of work = ((100 - done_ratio) * estimate) / 100
                    sum += ((100 - task.done_ratio) * (task.estimated_hours || 0)) / 100;
                }
            }
            // add new point to series
            rest.push([dateTime, Math.ceil(sum)]);

            // rollback changes in this day
            while (dateTime == changeDate)
            {
                if (changes[i].prop_key == 'done_ratio')
                    tasks[changes[i].issueId].done_ratio = changes[i].value;
                else
                    tasks[changes[i].issueId].estimated_hours = changes[i].value;
                // next change
                i++;
                if (i >= len)
                    break;
                changeDate = Date.fromMysql(changes[i].created_on);
            }

        }

        // highchart requries sorting!
        function sortDates(a, b)
        {
            if (a[0] < b[0])
                return -1;
            return 1;
        }
        rest.sort(sortDates);

        // unite dates
        // construct array with all used dates
        var dates = [];
        for (i = 0, len = rest.length; i < len; i++)
            dates.push(rest[i][0]);
        for (i = 0, len = spent.length; i < len; i++)
            dates.push(spent[i][0]);
        dates.sort();
        dates.splice(0, 0, 0);
        // fill rest array with missed values
        var ridx = 0, sidx = 0;
        var rlen = rest.length, slen = spent.length;
        // from 1 to prevent if condition (i != 0 && dates[i-1] ...), some optimization
        for (i = 1, len = dates.length; i < len; i++)
        {
            var date = dates[i];
            // skip doubles
            if (dates[i - 1] == date)
                continue;
            // find place to insert new date
            if (ridx != rlen)
            {
                for (var rdate = rest[ridx][0]; date > rdate;)
                {
                    ridx++;
                    if (ridx >= rlen)
                        break;
                    rdate = rest[ridx][0];
                }
            }
            if (sidx != slen)
            {
                for (var sdate = spent[sidx][0]; date > sdate;)
                {
                    sidx++;
                    if (sidx >= slen)
                        break;
                    sdate = spent[sidx][0];
                }
            }
            // check if non-exists
            if (rdate != date)
            {
                if (ridx != 0)
                    var val = rest[ridx - 1][1];
                else
                    val = 0;
                rest.splice(ridx, 0, [date, val]);
                ridx++;
                rlen++;
            }
            if (sdate != date)
            {
                if (sidx != 0)
                    val = spent[sidx - 1][1];
                else
                    val = 0;
                spent.splice(sidx, 0, [date, val]);
                sidx++;
                slen++;
            }
        }

        opt.series[0].data = rest;
        opt.series[1].data = spent;
    };

    $(function()
    {
        var def =
        {
            chart:
            {
                renderTo: 'burndown',
                type: 'area',
                height: 600
            },
            xAxis:
            {
                title: {enabled: false},
                type: 'datetime'
            },
            plotOptions:
            {
                area:
                {
                    stacking: 'normal',
                    lineColor: '#666666',
                    lineWidth: 1,
                    marker:
                    {
                        lineWidth: 1,
                        lineColor: '#666666'
                    }
                }
            }
        };

        new Highcharts.Chart($.extend(true, def, opt));

        // selections
        $('#sprints_selection select').change(function ()
        {
            location.href = settings.urls.show + '?project_id=' + settings.project_id + '&sprint=' + $(this).val() + '&user=' +  $('#user_selection select').val();
        });
        $('#user_selection select').change(function ()
        {
            location.href = settings.urls.show + '?project_id=' + settings.project_id + '&sprint=' + $('#sprints_selection select').val() + '&user=' +  $(this).val();
        });
    });

    return obj;
}(jQuery);