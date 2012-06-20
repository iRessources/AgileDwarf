class SprintsController < ApplicationController
  unloadable

  before_filter :find_project, :authorize

  def create
    attribs = params.select{|k,v| k != 'id' and Sprints.column_names.include? k }
    attribs = Hash[*attribs.flatten]
    sprint = Sprints.new(attribs)
    begin
      sprint.save!
    rescue => e
      render :text => e.message.blank? ? e.to_s : e.message, :status => 400
      return
    end

    result = sprint.errors.length
    status = (result == 0 ? 200 : 400)

    respond_to do |format|
      format.html { render :text => sprint.id, :status => status}
    end
  end

  def inplace
    # element_id filtered too!
    attribs = params.select{|k,v| k != 'id' && k != 'project_id' && Sprints.column_names.include?(k) }
    attribs.flatten!
    param_id = attribs[0]
    attribs = Hash[*attribs]
    sprint = Sprints.find(params[:id])
    begin
      result = sprint.update_attributes(attribs)
    rescue => e
      render :text => e.message.blank? ? e.to_s : e.message, :status => 400
      return
    end

    status = (result ? 200 : 400)
    sprint.reload

    text = sprint[param_id]
    respond_to do |format|
      format.html { render :text => text, :status => status }
    end
  end

  private

  def find_project
    # @project variable must be set before calling the authorize filter
    @project = Project.find(params[:project_id])
  end
end