class AdtasksController < ApplicationController
  unloadable

  before_filter :find_project, :authorize

  def list
    # data for filters
    @sprints = Sprints.open_sprints(@project)
    @project_id = @project.id
    @assignables = @project.assignable_users
    @assignables_list = {}
    @project.assignable_users.each{|u| @assignables_list[u.id] = u.firstname + ' ' + u.lastname}

    # filter values
    @selected = params[:sprint] || (@sprints[0].nil? ? 'all' : @sprints[0].id.to_s)
    case @selected
      when 'all'
        sprint = nil
      when 'none'
        sprint = 'null'
      else
        sprint = @selected
    end
    user = @user = params[:user] || 'current'
    user = nil if @user == 'all'

    @plugin_path = File.join(Redmine::Utils.relative_url_root, 'plugin_assets', 'AgileDwarf')

    # new + in progress + resolved
    status_ids = [Setting.plugin_AgileDwarf[:stcolumn1].to_i, Setting.plugin_AgileDwarf[:stcolumn2].to_i, Setting.plugin_AgileDwarf[:stcolumn3].to_i]
    @statuses = {}
    IssueStatus.find_all_by_id(status_ids).each {|x| @statuses[x.id] = x.name}
    @columns = [{:tasks => SprintsTasks.get_tasks_by_status(@project, status_ids[0], sprint, user), :id => status_ids[0]},
                {:tasks => SprintsTasks.get_tasks_by_status(@project, status_ids[1], sprint, user), :id => status_ids[1]},
                {:tasks => SprintsTasks.get_tasks_by_status(@project, status_ids[2], sprint, user), :id => status_ids[2]}]
  end

  private

  def find_project
    # @project variable must be set before calling the authorize filter
    @project = Project.find(params[:project_id])
  end
end