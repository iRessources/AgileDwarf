// Task object
Sprints.Task = function (el, sprint, isNew)
{
    var task = this;

    // parent sprint
    this.sprint = sprint;

    // HTML-binding
    if (el instanceof jQuery)
    {
        el[0].task = this;
    } else
    {
        el.task = this;
        el = $(el);
    }
    this.element = el;

    // id
    this.id = el.prop('id').substr('task.'.length);

    // task properties
    this.owner = el.children('.task_owner').text();
    this.closed = el.hasClass('closed_task');
    var time = el.children('.task_estimate').text();
    time = +time || 0;
    this.time = time;

    // register inline
    var taskInlineOpts =
    {
        submitdata: function (val, settings, element) { return {id: task.id}; },
        id: 'element_id'
    };
    isNew = !!isNew;
    if (isNew)
    {
        $('.task_subject', el).editable('/adtaskinl/inplace', $.extend({name: 'subject', type: 'ptext', placeholder: Sprints.l('task_subject_placeholder'), callback: function(value, settings)
        {
            var inlineEl = $(this);
            inlineEl.editable('destroy');
            addTaskInlines();
            task.element.removeClass('new');
        }}, taskInlineOpts)).click();
    } else
        addTaskInlines(isNew);
    function addTaskInlines()
    {
        $('.task_subject', el).editable('/adtaskinl/inplace', $.extend({name: 'subject', type: 'ptext', placeholder: Sprints.l('task_subject_placeholder')}, taskInlineOpts));

        $('.task_estimate', el).editable('/adtaskinl/inplace', $.extend({name: 'estimated_hours', type: 'ptext', placeholder: Sprints.l('task_estimate_placeholder'), callback: function (res, settings)
        {
            var timeNew = +res || 0;
            sprint.times.updateTaskTime(task, timeNew).update();
            task.time = timeNew;
        }}, taskInlineOpts));

        $('.task_owner', el).editable('/adtaskinl/inplace', $.extend({name: 'assigned_to_id', type: 'select', onblur : 'submit', placeholder: Sprints.l('task_owner_placeholder'),
            data: Sprints.getProjectUsers(), callback: function (res, settings)
            {
                sprint.times.updateTaskOwner(task, res).update();
                task.owner = res;
            }}, taskInlineOpts));
    }

    // tooltip
    $('.task_desc', el).qtip(
    {
        content:
        {
            text: '...',
            ajax:
            {
                url: '/adtaskinl/tooltip',
                data: {id: task.id}
            }
        },
        show: { solo: true }
    }).click(function()
    {
        var api = $(this).qtip('api');
        // already opened
        if (!api.get('hide.event'))
            return ;
        api.set(
        {
            'content.ajax': {},
            'hide.event': false
        });


        api.elements.content.editable('/adtaskinl/inplace', $.extend({name: 'description', type: 'textarea', rows: 10, cols: 20, submit: '<br/><button>OK</button>', cancel: '<button>Cancel</button>',
                                                                  onblur: 'submit', event: 'taskdescedit', callback: function (res, settings)
        {
            api.set({'hide.event': 'mouseleave'});
            api.hide();
        }, onreset: function ()
        {
            api.set({'hide.event': 'mouseleave'});
            api.hide();
        }}, taskInlineOpts)).trigger('taskdescedit');
        api.redraw();
    });
};

// Sprint object
Sprints.Sprint = function (el, isNew)
{
    var sprint = this;

    // HTML-binding
    if (el instanceof jQuery)
    {
        el[0].sprint = this;
    } else
    {
        el.sprint = this;
        el = $(el);
    }
    this.element = el;

    // id of sprint
    this.id = el.prop('id').substr('sprint.'.length);

    // times
    this.times = (function ()
    {
        var obj = {};
        var data = {};

        function checkOwner(owner)
        {
            if (!owner)
                return false;
            if (!data.hasOwnProperty(owner))
                data[owner] = 0;
            return true;
        }

        obj.removeTask = function (task)
        {
            if (!checkOwner(task.owner))
                return obj;
            data[task.owner] -= task.time;
            return obj;
        };

        obj.addTask = function (task)
        {
            if (!checkOwner(task.owner))
                return obj;
            data[task.owner] += task.time;
            return obj;
        };

        obj.updateTaskTime = function (task, newTime)
        {
            if (!checkOwner(task.owner))
                return obj;
            data[task.owner] -= (task.time - newTime);
            return obj;
        };

        obj.updateTaskOwner = function (task, newOwner)
        {
            if (!checkOwner(task.owner))
                return obj;
            data[task.owner] -= task.time;
            data[newOwner] += task.time;
            return obj;
        };

        obj.update = function ()
        {
            var times = '';
            for (var owner in data)
            {
                if (!data.hasOwnProperty(owner))
                    continue;
                times += '<div class="sprint_time">' + owner + ': ' + data[owner] + '</div>';
            }
            sprint.element.children('.time_list').html(times);
            return obj;
        };

        return obj;
    })();

    // tasks
    this.tasks = {};
    $(".sc_task", el).each(function()
    {
        var task = new Sprints.Task(this, sprint);
        sprint.tasks[task.id] = task;
        sprint.times.addTask(task);
    });
    this.times.update();

    // "create task" button
    $('.add_task', el).on('click', function ()
    {
        $.ajax(
        {
            url: "/adtaskinl/create",
            data:
            {
                subject: Sprints.l('task_subject_placeholder'),
                fixed_version_id: sprint.id
            },
            success: function (data)
            {
                var task = $('#task_template').children(':eq(0)').clone().prependTo($('.task_list', el));
                task.prop('id', 'task.' + data);
                el.sortable("refresh");
                task.children('.task_no').html('<a href="/issues/' + data + '">#' + data + '</a>');
                var taskObj = new Sprints.Task(task, sprint, true);
                sprint.tasks[task.id] = taskObj;
                sprint.times.addTask(taskObj);
            }
        });
    });

    // "fold" button
    $('.fold_sprint', el).on('click', function ()
    {
        var self = $(this);
        if (el.hasClass('folded_sprint'))
        {
            // el.children('.task_list').children().show();
            el.removeClass('folded_sprint');
            self.prop('src', Sprints.getPluginUrl('images', 'fold_sprint.png'));
        } else
        {
            // el.children('.task_list').children().hide();
            el.addClass('folded_sprint');
            self.prop('src', Sprints.getPluginUrl('images', 'unfold_sprint.png'));
        }
    });

    // "close sprint" button
    $('.close_sprint', el).on('click', function ()
    {
        var self = $(this);

        function changeStatus(status)
        {
            $.ajax(
            {
                url: "/adsprintinl/inplace",
                data:
                {
                    id: sprint.id,
                    status: status
                },
                success: function (data)
                {
                    // was not changed
                    if (data != status)
                        return ;
                    if (data == 'open')
                    {
                        self.prop('src', Sprints.getPluginUrl('images', 'close_sprint.png'));
                        el.removeClass('closed_sprint');
                    } else
                    {
                        self.prop('src', Sprints.getPluginUrl('images', 'closed_sprint.png'));
                        el.addClass('closed_sprint');
                    }
                }
            });
        }

        if (el.hasClass('closed_sprint'))
        {
            changeStatus('open');
        } else
        {
            // status = 'closed';
            var allow = true;
            $.each(sprint.tasks, function()
            {
                if (!this.closed)
                {
                    allow = false;
                    return false;
                }
            });
            if (!allow)
            {
                $("#sprint_close_error").dialog(
                {
                    modal: true,
                    buttons:{ Ok: function(){ $(this).dialog( "close" ); } }
                });
                return ;
            }
            $("#sprint_close_confirm").dialog(
            {
                resizable: false,
                modal: true,
                buttons:
                {
                    Ok: function()
                    {
                        changeStatus('closed');
                        $(this).dialog("close");
                    },
                    Cancel: function()
                    {
                        $(this).dialog("close");
                    }
                }
            });
        }
    });

    // register inline
    var sprintInlineOpts =
    {
        submitdata: function (val, settings, element) { return {id: sprint.id}; },
        id: 'element_id'
    };
    // for new sprints we need to show unexpanded inlines
    isNew = !!isNew;
    if (isNew)
    {
        var sprintUnfilledInline = {'sprint_end': true, 'sprint_start': true, 'sprint_name': true};
        sprintInlineOpts.onblur = 'ignore';
        sprintInlineOpts.disableDatapicker = true;
        sprintInlineOpts.callback = function(value, settings)
        {
            var inlineEl = $(this);
            var unfilledCount = 0;
            for (var className in sprintUnfilledInline)
            {
                if (!sprintUnfilledInline.hasOwnProperty(className))
                    continue;
                if (inlineEl.hasClass(className))
                    sprintUnfilledInline[className] = false;
                if (sprintUnfilledInline[className])
                    unfilledCount++;
            }
            if (!unfilledCount)
            {
                delete sprintInlineOpts.onblur;
                delete sprintInlineOpts.callback;
                delete sprintInlineOpts.disableDatapicker;
                $('.sprint_end, .sprint_start, .sprint_name', el).editable('destroy');
                addSprintInlines();
                sprint.element.removeClass('new');
            }
        };
    }
    function addSprintInlines(expand)
    {
        $('.sprint_end', el).editable('/adsprintinl/inplace', $.extend({}, sprintInlineOpts, {name: 'ir_end_date', type: 'datepicker'}));
        $('.sprint_start', el).editable('/adsprintinl/inplace', $.extend({}, sprintInlineOpts, {name: 'ir_start_date', type: 'datepicker'}));
        $('.sprint_name', el).editable('/adsprintinl/inplace', $.extend({}, sprintInlineOpts, {name: 'name', type: 'text', callback: function (val, settings)
        {
            $('#sprints_selection_el option[value=' + sprint.id + ']').text(val);
            if (typeof sprintInlineOpts.callback != 'undefined')
                sprintInlineOpts.callback.apply(this, [val, settings]);
        }}));
        $('.sprint_description', el).editable('/adsprintinl/inplace', $.extend({}, sprintInlineOpts, {name: 'description', type: 'textarea', rows: 2, cols: 50, onblur : 'submit',
                                                                                              placeholder: Sprints.l('sprint_description_placeholder')}));
        if (expand)
        {
            $('.sprint_end, .sprint_start, .sprint_name', el).click();
            $('.sprint_end form :input:visible:first').datepicker('enable');
            $('.sprint_start form :input:visible:first').datepicker('enable');
        }
    }
    addSprintInlines(isNew);

    // drag and drop support
    Sprints.bindDnD(function(newList, params, oldList, item)
    {
        var newSprint = newList.parents('.sprints_panel')[0].sprint;
        var oldSprint = oldList.parents('.sprints_panel')[0].sprint;
        params.fixed_version_id = newSprint.id;
        var task = item[0].task;
        // update tasks
        delete oldSprint.tasks[task.id];
        newSprint.tasks[task.id] = task;
        // update times
        newSprint.times.addTask(task).update();
        oldSprint.times.removeTask(task).update();
    }, isNew);
};

Sprints.ready(function()
{
    var sprints = [];
    // init sprints
    $('.sprints_panel').each(function()
    {
        sprints.push(new Sprints.Sprint(this));
    });

    // create sprint button
    $('.create_sprint').click(function ()
    {
        var date = new Date();
        var name = $('#sprint_template').find('.sprint_name').text() + date.getDate() + '.' + (+date.getMonth() + 1) + '.' + date.getFullYear() + ' ' +
                   date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        $.ajax(
        {
            url: "/adsprintinl/create",
            data: {name: name},
            success: function (data)
            {
                var panel = $('#sprint_template').children(':eq(0)').clone().insertAfter('.sprints_column:eq(1) :eq(0)');
                panel.find('.sprint_name').text(name);
                panel.prop('id', 'sprint.' + data);
                sprints.push(new Sprints.Sprint(panel, true));
                $('#sprints_selection_el').append('<option value="' + data + '">' + name + '</option>');
            }
        });
    });

    // "show closed sprints" checkbox
    $("#show_closed_sprints input").change(function()
    {
        if ($(this).prop('checked'))
            $('.closed_sprint').css('display', 'block');
        else
            $('.closed_sprint').css('display', 'none');
    });

    // filter by sprint
    $('#sprints_selection_el').change(function()
    {

        var id = $(this).val();
        if (id == 'all')
        {
            $('#sprints_sprints .sprints_panel').show();
            return ;
        }
        $('#sprints_sprints .sprints_panel').hide();
        $('#sprint\\.' + id).show();
    });

    // highlight hovered element
    $(".sprints_column").on('mouseover', '.sc_task', function ()
    {
        $(this).addClass('active');
    }).on('mouseout', '.sc_task', function ()
    {
        $(this).removeClass('active');
    });
});
