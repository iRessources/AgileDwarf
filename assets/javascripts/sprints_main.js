(function ($)
{
    Sprints.Coop = function ()
    {
        var o = {};
        var sprints;

        function getHash()
        {
            var hashStr = '';
            for (var i = 0, slen = sprints.length; i < slen; i++)
            {
                var sprint = sprints[i];
                hashStr += sprint.id + sprint.name + sprint.startdate + sprint.enddate + sprint.desc;
                for (var task_id in sprint.tasks)
                {
                    if (!sprint.tasks.hasOwnProperty(task_id))
                        continue;
                    var task = sprint.tasks[task_id];
                    hashStr += task.id + task.owner + task.subject + task.time;
                }
            }

            var hash = 0;
            var ch;
            for (i = 0; i < hashStr.length; i++)
            {
                ch = hashStr.charCodeAt(i);
                hash = ((hash << 5) - hash) + ch;
                hash = hash & hash;
            }
            return hash;
        }

        o.update = function (id, type, action, value)
        {
    /*
            $.ajax(
            {
                cache: false,
                url: '/coop/send',
                type: "GET",
                dataType: "json",
                data : {pid: Sprints.getProjectId(), tag: getHash(), id: id, type: type, value: value, action: action}
            });
    */
        };

        o.start = function (sprAr)
        {
    /*
            sprints = sprAr;

            function waitEvents()
            {
                $.ajax(
                {
                    cache: false,
                    url: '/coop/check',
                    type: "GET",
                    dataType: "json",
                    data : {pid: Sprints.getProjectId(), tag: getHash()},
                    success : function(data)
                    {
                        if (data && data.hasOwnProperty('type'))
                        {
                            if (data.type == 'task')
                            {
                                var task = $('#task\\.' + data.id).get(0).task;
                                switch (data.action)
                                {
                                    case 'subject':
                                        task.setSubject(data.value, true);
                                        break;
                                    case 'owner':
                                        task.setOwner(data.value, true);
                                        break;
                                    case 'time':
                                        task.setTime(data.value, true);
                                        break;
                                    case 'pos':
                                        var posVal = data.value.split('.');
                                        if (posVal.length > 1 && posVal[1].length)
                                            var sprint = $('#sprint\\.' + (+posVal[1])).get(0).sprint;
                                        else
                                            sprint = $('.sprints_column:eq(0) .sprints_panel').get(0).sprint;

                                        task.setPos(+posVal[0], sprint, true);
                                        break;
                                }
                                task.element.addClass('changed');
                                (function (t)
                                {
                                    if (typeof t.timer != 'undefined')
                                        clearTimeout(t.timer);
                                    t.timer = setTimeout(function ()
                                    {
                                        t.removeClass('changed');
                                        t.timer = undefined;
                                    }, 2000);
                                })(task.element);
                            } else
                            {
                            }

                            $.ajax(
                            {
                                url: '/coop/ack',
                                type: "GET",
                                data : {pid: Sprints.getProjectId(), seq: data.seq}
                            });
                        }
                        waitEvents();
                    }
                });
            }

            setTimeout(function() {waitEvents()}, 10000);
            // waitEvents()
    */
        };

        return o;
    }();

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
        this.subject = el.children('.task_subject').text();
        this.pos = el.index();
        this.closed = el.hasClass('closed_task');
        var time = el.children('.task_estimate').text();
        time = +time || 0;
        this.time = time;

        // task property-setters
        this.setSubject = function (val, redraw)
        {
            if (typeof redraw != 'undefined')
                el.children('.task_subject').text(val);
            task.subject = val;
        };
        this.setTime = function (val, redraw)
        {
            if (typeof redraw != 'undefined')
                el.children('.task_estimate').text(val);
            var timeNew = +val || 0;
            sprint.times.updateTaskTime(task, timeNew).update();
            task.time = timeNew;
        };
        this.setOwner = function (val, redraw)
        {
            if (typeof redraw != 'undefined')
                el.children('.task_owner').text(val);
            sprint.times.updateTaskOwner(task, val).update();
            task.owner = val;
        };
        this.setPos = function (val, sprint, redraw)
        {
            if (typeof redraw != 'undefined')
            {
                el.detach();
                if (val > 0)
                    el.insertAfter(sprint.element.children('.task_list').children(':eq(' + (val - 1) + ')'));
                else
                    sprint.element.children('.task_list').prepend(el);
            }

            var oldSprint = task.sprint;
            task.sprint = sprint;
            // update tasks
            delete oldSprint.tasks[task.id];
            sprint.tasks[task.id] = task;
            // update times
            sprint.times.addTask(task).update();
            oldSprint.times.removeTask(task).update();

            task.pos = val;
        };


        // register inline
        var taskInlineOpts =
        {
            submitdata: function (val, settings, element) { return {id: task.id}; },
            id: 'element_id'
        };
        isNew = !!isNew;
        if (isNew)
        {
            $('.task_subject', el).editable(Sprints.getUrl('taskinline'), $.extend({name: 'subject', type: 'ptext', placeholder: Sprints.l('task_subject_placeholder'), callback: function(value, settings)
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
            $('.task_subject', el).editable(Sprints.getUrl('taskinline'), $.extend({name: 'subject', type: 'ptext', placeholder: Sprints.l('task_subject_placeholder'), callback: function (res, settings)
            {
                task.setSubject(res);
                Sprints.Coop.update(task.id, 'task', 'subject', res);
            }}, taskInlineOpts));

            $('.task_estimate', el).editable(Sprints.getUrl('taskinline'), $.extend({name: 'estimated_hours', type: 'ptext', placeholder: Sprints.l('task_estimate_placeholder'), callback: function (res, settings)
            {
                task.setTime(res);
                Sprints.Coop.update(task.id, 'task', 'time', res);
            }}, taskInlineOpts));

            $('.task_owner', el).editable(Sprints.getUrl('taskinline'), $.extend({name: 'assigned_to_id', type: 'select', onblur : 'submit', placeholder: Sprints.l('task_owner_placeholder'),
                data: Sprints.getProjectUsers(), callback: function (res, settings)
                {
                    task.setOwner(res);
                    Sprints.Coop.update(task.id, 'task', 'owner', res);
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
                    url: Sprints.getUrl('tasktip'),
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


            api.elements.content.editable(Sprints.getUrl('taskinline'), $.extend({name: 'description', type: 'textarea', rows: 10, cols: 20, submit: '<br/><button>OK</button>', cancel: '<button>Cancel</button>',
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
                if (checkOwner(task.owner))
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
                url: Sprints.getUrl('taskcreate'),
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
                    task.children('.task_no').html('<a href="' + Sprints.getUrl('issues') + '/' + data + '">#' + data + '</a>');
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
                    url: Sprints.getUrl('sprintinline'),
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
            $('.sprint_end', el).editable(Sprints.getUrl('sprintinline'), $.extend({}, sprintInlineOpts, {name: 'ir_end_date', type: 'datepicker', datepicker:{dateFormat:'yy-mm-dd'}}));
            $('.sprint_start', el).editable(Sprints.getUrl('sprintinline'), $.extend({}, sprintInlineOpts, {name: 'ir_start_date', type: 'datepicker', datepicker:{dateFormat:'yy-mm-dd'}}));
            $('.sprint_name', el).editable(Sprints.getUrl('sprintinline'), $.extend({}, sprintInlineOpts, {name: 'name', type: 'text', callback: function (val, settings)
            {
                $('#sprints_selection_el option[value=' + sprint.id + ']').text(val);
                if (typeof sprintInlineOpts.callback != 'undefined')
                    sprintInlineOpts.callback.apply(this, [val, settings]);
            }}));
            $('.sprint_description', el).editable(Sprints.getUrl('sprintinline'), $.extend({}, sprintInlineOpts, {name: 'description', type: 'textarea', rows: 2, cols: 50, onblur : 'submit',
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
            var task = item[0].task;
            params.fixed_version_id = newSprint.id;
            task.setPos(item.index(), newSprint);
            Sprints.Coop.update(task.id, 'task', 'pos', item.index() + '.' + newSprint.id);
        }, isNew, function(list, params, item)
        {
            var task = item[0].task;
            var sprint = task.sprint;
            task.setPos(item.index(), sprint);
            Sprints.Coop.update(task.id, 'task', 'pos', item.index() + '.' + sprint.id);
        });
    };

    Sprints.ready(function()
    {
        var sprints = [];
        // init sprints
        $('.sprints_panel').each(function()
        {
            sprints.push(new Sprints.Sprint(this));
        });

        sprints.sort(function (a, b)
        {
            return a.id - b.id;
        });

        // create sprint button
        $('.create_sprint').click(function ()
        {
            var date = new Date();
            var name = $('#sprint_template').find('.sprint_name').text() + date.getDate() + '.' + (+date.getMonth() + 1) + '.' + date.getFullYear() + ' ' +
                       date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
            $.ajax(
            {
                url: Sprints.getUrl('sprintcreate'),
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

        Sprints.Coop.start(sprints);
    });
})(jQuery);