class AdsprintsController < ApplicationController
  unloadable

  before_filter :find_project, :authorize

  def list
    @backlog = SprintsTasks.get_backlog(@project)
    @sprints = Sprints.all_sprints(@project)
    #@sprints.each{|s| s['tasks'] = SprintsTasks.get_tasks_by_sprint(@project, [s.id])}
    @assignables = {}
    @project.assignable_users.each{|u| @assignables[u.id] = u.firstname + ' ' + u.lastname}
    @assignables[nil] = '- Unassigned -'
    @project_id = @project.id
    @plugin_path = File.join(Redmine::Utils.relative_url_root, 'plugin_assets', 'AgileDwarf')
    @closed_status = []
    IssueStatus.where("is_closed").each{|status| @closed_status << status.id}
  end

  private

  def find_project
    # @project variable must be set before calling the authorize filter
    @project = Project.find(params[:project_id])
  end
end
