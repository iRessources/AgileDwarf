class AdburndownController < ApplicationController
  unloadable

  before_filter :find_project, :authorize

  def show
    # data for filters
    @sprints = Sprints.all_sprints(@project)
    @project_id = @project.id
    @assignables = @project.assignable_users

    spentcond = ["time_entries.project_id = ?", @project.id]
    restcondtasks = ["project_id = ?", @project.id]

    # sprint filter
    @selected = params[:sprint] || 'all'
    if @selected == 'none'
      spentcond[0] += ' and fixed_version_id is null'
      restcondtasks[0] += ' and fixed_version_id is null'
    elsif @selected != 'all'
      spentcond[0] += ' and fixed_version_id = ?'
      spentcond << @selected
      restcondtasks[0] += ' and fixed_version_id = ?'
      restcondtasks << @selected
    end

    # user filter
    @user = params[:user] || 'all'
    if @user == 'current'
      spentcond[0] += ' and user_id = ?'
      spentcond << User.current.id
      restcondtasks[0] += ' and assigned_to_id = ?'
      restcondtasks << User.current.id
    elsif @user != 'all'
      spentcond[0] += ' and user_id = ?'
      spentcond << @user
      restcondtasks[0] += ' and assigned_to_id = ?'
      restcondtasks << @user
    end

    # spent series
    spent_arr = []
    TimeEntry.find(:all, :select => 'spent_on, sum(hours) as spent', :conditions => spentcond, :joins => [:issue], :group => 'spent_on').each{|spent|
      spent_arr << '["' + spent.spent_on.to_s + '",' +  spent.spent.to_s + ']'
    }
    @spent = '[' + spent_arr.join(',') + ']'

    # rest series
    # full issue list
    @tasks = {}
    SprintsTasks.find(:all, :select => 'DATE(created_on) as created_on, id, done_ratio, estimated_hours', :conditions => restcondtasks).each{|task| @tasks[task['id']] = task}
    @tasks = @tasks.to_json
    # issue changes
    @changes = []
    # restcondchanges = ActiveRecord::Base::sanitize_sql(restcondtasks)
    restcondchanges = ActiveRecord::Base.send(:sanitize_sql, restcondtasks, '')
    ActiveRecord::Base.connection.select_all("select * from (select old_value as value, journalized_id as issueId, prop_key, DATE(journals.created_on) created_on from `journals` inner join journal_details on (journals.id = journal_id) inner join issues on (issues.id = journalized_id) where journalized_type = 'Issue' and property = 'attr' and (prop_key = 'estimated_hours' or prop_key = 'done_ratio') and #{restcondchanges} order by journals.id desc) a group by `issueId`, created_on, prop_key order by created_on desc").each{|row| @changes << row}
=begin
    select * from
    (
      select old_value as value, journalized_id as issueId, prop_key, DATE(journals.created_on) created_on from `journals`
        inner join journal_details on (journals.id = journal_id)
        inner join issues on (issues.id = journalized_id)
        where journalized_type = 'Issue'
          and property = 'attr'
          and (prop_key = 'estimated_hours' or prop_key = 'done_ratio')
          and #{restcondchanges}
        order by journals.id desc
    ) a group by `issueId`, created_on, prop_key order by created_on desc
=end
    @changes = @changes.to_json
  end

  private

  def find_project
    # @project variable must be set before calling the authorize filter
    @project = Project.find(params[:project_id])
  end
end