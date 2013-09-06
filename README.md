Agile Dwarf
===========

Thank you for your interest in AgileDwarf

INSTALLATION INSTRUCTIONS
-------------------------

Download the package from https://github.com/iRessources/AgileDwarf

for Redmine 2.x: unpack it into #{RAILS_ROOT}/plugins
for Redmine 1.x: unpack it into #{RAILS_ROOT}/vendor/plugins

Name the unpacked folder 'AgileDwarf'

OR instead of downloading and unpacking

    execute git clone https://github.com/iRessources/AgileDwarf.git in corresponding folder.

In #{RAILS_ROOT} run the command

    rake RAILS_ENV=production redmine:plugins:migrate
  
Restart Redmine
 
Change settings for plugin via Administration -> Plugins -> Agile dwarf plugin -> Configure

ABOUT AGILE DWARF
-----------------

Agile Dwarf plugin implements the agile method based on pre-estimating every task in hours (as opposed to in points). 

It adds 3 new tabs to your Redmine:

### Sprints

'Sprints' is intended for strategical planning or long-term management of backlog and sprints:
* Quick backlog issues creation
* Flexible sprints management
* Drag & Drop support for items between backlog and sprints
* Short sprint and backlog stats
* Detailed sprint stats
* Creating/Managing/Updating sprints
* Prioritising stories/issues

### Tasks

'Tasks' is for day-by-day use, every member of the team can manage his tasks quickly and efficiently:
* Current tasks for every member grouped by status (New, In Progress, Resolved)
* Drag & Drop support for tasks in status groups
* Quick time and progress tracking
* Configure AgileDwarf to use your workflow by setting the number of columns that should be displayed in the task board

### Run Charts

'Run charts' is an instant overview of current project status:
* One chart displays remaining and spent time at any point of the project lifecycle
* You can easily switch the chart time scope (the whole projects or any given sprint) and team scope (the whole team or any member)
