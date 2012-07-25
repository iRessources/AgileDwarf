require 'redmine'

require 'scrum_enabled_module_patch'

Redmine::Plugin.register :AgileDwarf do
  name 'Agile dwarf plugin'
  author 'Mark Ablovacky'
  description 'Agile for Redmine'
  version '0.0.2'
  url ''

  project_module :scrum do
    permission :sprints, {:adsprints => [:list], :adtaskinl => [:update, :inplace, :create, :tooltip], :adsprintinl => [:create, :inplace]}
    permission :sprints_tasks, {:adtasks => [:list], :adtaskinl => [:update, :inplace, :tooltip, :spent]}
    permission :burndown_charts, {:adburndown => [:show]}
  end

  menu :project_menu, :adsprints, { :controller => 'adsprints', :action => 'list' }, :caption => :label_menu_mytasks, :after => :activity, :param => :project_id
  menu :project_menu, :adtasks, { :controller => 'adtasks', :action => 'list' }, :caption => :label_menu_sprints, :after => :adsprints, :param => :project_id
  menu :project_menu, :adburndown, { :controller => 'adburndown', :action => 'show' }, :caption => :label_menu_burndown, :after => :adtasks, :param => :project_id
end
