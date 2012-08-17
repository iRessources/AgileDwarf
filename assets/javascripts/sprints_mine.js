(function ($)
{
    Sprints.ready(function()
    {
        var Task = function (el, panel)
        {
            var task = this;

            // parent panel
            this.panel = panel;

            // HTML-binding
            el.task = this;
            el = $(el);
            this.element = el;

            // id
            this.id = el.prop('id').substr('task.'.length);

            // task properties
            this.closed = el.hasClass('closed_task');
            var time = el.find('.task_estimate').text();
            time = +time || 0;
            this.est = time;
            this.done = (+el.children('.task_doneratio_value').text() / 100) * time;
            this.spent = +el.find('.task_spent_time').text();
            this.owner = el.find('.task_owner').text();

            // register inline
            var taskInlineOpts =
            {
                submitdata: function (val, settings) {return {id: task.id};},
                id: 'element_id'
            };
            $('.task_subject', el).editable(Sprints.getUrl('taskinline'), $.extend({name: 'subject', type: 'ptext', placeholder: Sprints.l('task_subject_placeholder')}, taskInlineOpts));
            // done ratio
            $('.task_doneratio_value', el).editable(Sprints.getUrl('taskinline'), $.extend({name: 'done_ratio', type: 'ptext', width: 50, callback: function (res, settings)
            {
                res = +res;
                $(this).siblings('.task_row').children('.task_doneratio_slide').slider('value', res);
                var timeNew = (res / 100) * task.est;
                panel.times.updateTaskDone(task, timeNew).update();
                task.done = timeNew;
            }}, taskInlineOpts));
            // estimate
            $('.task_estimate', el).editable(Sprints.getUrl('taskinline'), $.extend({name: 'estimated_hours', type: 'ptext', placeholder: Sprints.l('task_estimate_placeholder'), callback: function (res, settings)
            {
                // update estimate
                res = +res || 0;
                panel.times.updateTaskEst(task, res);
                task.est = res;
                // update done
                var timeNew = (res / 100) * task.est;
                panel.times.updateTaskDone(task, timeNew).update();
                task.done = timeNew;
            }}, taskInlineOpts));
            // spent
            $('.task_add_spent_value', el).editable(Sprints.getUrl('taskspent'), $.extend({name: 'hours', type: 'text', placeholder: 'X', width: 50, event: 'addspent', callback: function (res, settings)
            {
                $(this).html('X');
                var spent = el.find('.task_spent_time');
                var timeNew = +spent.text() + (+res);
                spent.text(timeNew);
                panel.times.updateTaskSpent(task, timeNew).update();
                task.spent = timeNew;
            }}, taskInlineOpts));
            // owner
            $('.task_owner', el).editable(Sprints.getUrl('taskinline'), $.extend({name: 'assigned_to_id', type: 'select', onblur : 'submit', placeholder: Sprints.l('task_owner_placeholder'),
                data: Sprints.getProjectUsers(), callback: function (res, settings)
                {
                    panel.times.updateTaskOwner(task, res).update();
                    task.owner = res;
                }}, taskInlineOpts));

            // done ratio slider
            $(".task_doneratio_slide", el).each(function ()
            {
                var self = $(this);
                var valEl = self.parent().siblings('.task_doneratio_value');
                self.slider({range: "min", step: 10, value: +valEl.text(), slide: function (event, ui)
                {
                    valEl.text(ui.value);
                }, change: function(event, ui)
                {
                    // we call this event by changing value property, do not affect
                    if (typeof event.originalEvent == 'undefined')
                        return ;
                    $.ajax(
                    {
                        url: Sprints.getUrl('taskinline'),
                        data: {id: self.parents('.sc_task').prop('id').substr('task.'.length), done_ratio: ui.value},
                        type: 'POST',
                        success: function (res)
                        {
                            self.slider('value', +res);
                            valEl.text(+res);
                            var timeNew = (res / 100) * task.est;
                            panel.times.updateTaskDone(task, timeNew).update();
                            task.done = timeNew;
                        }
                    });
                }});
            });

            // add spent button
            $('.task_add_spent', el).click(function ()
            {
                $(this).children('.task_add_spent_value').trigger('addspent');
            });

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
                show: {solo: true}
            });
        };

        // Column object
        var Column = function (el)
        {
            var column = this;

            // HTML-binding
            el.panel = this;
            el = $(el);
            this.element = el;

            // id of column
            this.id = el.prop('id').substr('column.'.length);

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
                        data[owner] = {done: 0, est: 0, spent: 0};
                    return true;
                }

                function removeTaskForOwner(owner, task)
                {
                    if (!checkOwner(owner))
                        return ;
                    data[owner].done -= task.done;
                    data[owner].est -= task.est;
                    data[owner].spent -= task.spent;
                }

                function addTaskForOwner(owner, task)
                {
                    if (!checkOwner(owner))
                        return ;
                    data[owner].done += task.done;
                    data[owner].est += task.est;
                    data[owner].spent += task.spent;
                }

                obj.removeTask = function (task)
                {
                    removeTaskForOwner(task.owner, task);
                    return obj;
                };

                obj.addTask = function (task)
                {
                    addTaskForOwner(task.owner, task);
                    return obj;
                };

                obj.updateTaskOwner = function (task, newOwner)
                {
                    removeTaskForOwner(task.owner, task);
                    addTaskForOwner(newOwner, task);
                    return obj;
                };

                obj.updateTaskEst = function (task, newTime)
                {
                    if (!checkOwner(task.owner))
                        return obj;
                    data[task.owner].est -= (task.est - newTime);
                    return obj;
                };

                obj.updateTaskSpent = function (task, newTime)
                {
                    if (!checkOwner(task.owner))
                        return obj;
                    data[task.owner].spent -= (task.spent - newTime);
                    return obj;
                };

                obj.updateTaskDone = function (task, newTime)
                {
                    if (!checkOwner(task.owner))
                        return obj;
                    data[task.owner].done -= (task.done - newTime);
                    return obj;
                };

                obj.update = function ()
                {
                    var times = '';
                    for (var owner in data)
                    {
                        if (!data.hasOwnProperty(owner))
                            continue;
                        var ownerData = data[owner];
                        var done_perc = 0;
                        if (ownerData.est)
                            done_perc = Math.round((ownerData.done * 100) / ownerData.est);
                        times += '<div class="sprint_time">' + owner + ': ' + done_perc + '% / ' + ownerData.est + 'h<span class="fr">' + ownerData.spent + 'h</span></div>';
                    }
                    column.element.children('.time_list').html(times);
                    return obj;
                };

                return obj;
            })();

            // tasks
            this.tasks = {};
            $(".sc_task", el).each(function()
            {
                var task = new Task(this, column);
                column.tasks[task.id] = task;
                column.times.addTask(task);
            });
            this.times.update();

            // drag and drop support
            Sprints.bindDnD(function(newList, params, oldList, item)
            {
                var newSprint = newList.parents('.task_panel')[0].panel;
                var oldSprint = oldList.parents('.task_panel')[0].panel;
                params.status_id = newSprint.id;
                var task = item[0].task;
                // update tasks
                delete oldSprint.tasks[task.id];
                newSprint.tasks[task.id] = task;
                // update times
                newSprint.times.addTask(task).update();
                oldSprint.times.removeTask(task).update();
            });
        };

        var panels = [];
        // init columns
        $('.task_panel').each(function()
        {
            panels.push(new Column(this));
        });

        // selections
        $('#sprints_selection select').change(function ()
        {
            location.href = Sprints.getUrl('self') + '?project_id=' + Sprints.getProjectId() + '&sprint=' + $(this).val() + '&user=' +  $('#user_selection select').val();
        });
        $('#user_selection select').change(function ()
        {
            location.href = Sprints.getUrl('self') + '?project_id=' + Sprints.getProjectId() + '&sprint=' + $('#sprints_selection select').val() + '&user=' +  $(this).val();
        });

        // highlighting
        $(".task_panel").on('mouseover', '.sc_task', function ()
        {
            $(this).addClass('active');
        }).on('mouseout', '.sc_task', function ()
        {
            $(this).removeClass('active');
        });
    });
})(jQuery);