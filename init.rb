require 'redmine'

require 'scrum_enabled_module_patch'

Redmine::Plugin.register :AgileDwarf do
  name 'Redmine Scrum plugin'
  author 'Mark Ablovacky'
  description 'Scrum support for Redmine'
  version '0.0.1'
  url ''

  project_module :scrum do
    permission :sprints_main, {:sprints_main => [:list], :tasks => [:update, :inplace, :create, :tooltip], :sprints => [:create, :inplace]}
    permission :sprints_mine, {:sprints_mine => [:list], :tasks => [:update, :inplace, :tooltip, :spent]}
    permission :burndown_charts, {:burndown => [:show]}
  end

  menu :project_menu, :sprints_mine, { :controller => 'sprints_mine', :action => 'list' }, :caption => :label_menu_mytasks, :after => :activity, :param => :project_id
  menu :project_menu, :sprints_main, { :controller => 'sprints_main', :action => 'list' }, :caption => :label_menu_sprints, :after => :sprints_mine, :param => :project_id
  menu :project_menu, :burndown_charts, { :controller => 'burndown', :action => 'show' }, :caption => :label_menu_burndown, :after => :sprints_main, :param => :project_id
end
