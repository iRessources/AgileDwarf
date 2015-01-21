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

    status_ids = []
    colcount = Setting.plugin_AgileDwarf[:stcolumncount].to_i
    logger.info Setting.plugin_AgileDwarf.inspect
    logger.info colcount
    logger.info [Setting.plugin_AgileDwarf[:stcolumn1],Setting.plugin_AgileDwarf[:stcolumn2],Setting.plugin_AgileDwarf[:stcolumn3],Setting.plugin_AgileDwarf[:stcolumn4],Setting.plugin_AgileDwarf[:stcolumn5]].max.inspect
    #logger.info colcount.inspect
    for i in 1 .. colcount
      status_ids << Setting.plugin_AgileDwarf[('stcolumn' + i.to_s).to_sym].to_i
    end
    @statuses = {}
    logger.info status_ids.inspect
    #IssueStatus.find_all_by_id(status_ids).each {|x| @statuses[x.id] = x.name}
    IssueStatus.find(status_ids).each {|x| @statuses[x.id] = x.name}
    @columns = []
    for i in 0 .. colcount - 1
      @columns << {:tasks => SprintsTasks.get_tasks_by_status(@project, status_ids[i], sprint, user), :id => status_ids[i]}
    end
  end

  private

  def find_project
    # @project variable must be set before calling the authorize filter
    @project = Project.find(params[:project_id])
  end
end
