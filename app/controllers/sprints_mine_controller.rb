class SprintsMineController < ApplicationController
  unloadable

  before_filter :find_project, :authorize

  def list
    # data for filters
    @sprints = Sprints.open_sprints(@project)
    @project_id = @project.id
    @assignables = @project.assignable_users

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

    # new + in progress + resolved
    # TODO: add option for statuses
    @columns = [SprintsTasks.get_tasks_by_status(@project, 1, sprint, user),
                SprintsTasks.get_tasks_by_status(@project, 2, sprint, user), SprintsTasks.get_tasks_by_status(@project, 3, sprint, user)]
  end

  private

  def find_project
    # @project variable must be set before calling the authorize filter
    @project = Project.find(params[:project_id])
  end
end