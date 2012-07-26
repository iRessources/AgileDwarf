Thank you for your interest in AgileDwarf
____________________________________________________________________________________

INSTALLATION INSTRUCTIONS

- Download the package from https://github.com/iRessources/AgileDwarf

for Redmine 2.x: unpack it into #{RAILS_ROOT}/plugins

for Redmine 1.x: unpack it into #{RAILS_ROOT}/vendor/plugins

OR instead of downloading and unpacking

execute git clone https://github.com/iRessources/AgileDwarf.git in corresponding folder.

- In #{RAILS_ROOT} run the command "rake redmine:plugins:migrate"
  
- Restart Redmine.
____________________________________________________________________________________

Agile Dwarf plugin implements the agile method based on pre-estimating every task in hours (as opposed to in points). 

It adds 3 new tabs to your Redmine:

'Sprints' is intended for strategical planning or long-term management of backlog and sprints:
- Quick backlog issues creation
- Flexible sprints management
- Drag & Drop support for items between backlog and sprints
- Short sprint and backlog stats
- Detailed sprint stats 

'Tasks' is for day-by-day use, every member of the team can manage his tasks quickly and efficiently:
- Current tasks for every member grouped by status (New, In Progress, Resolved)
- Drag & Drop support for tasks in status groups
- Quick time and progress tracking

'Run charts' is an instant overview of current project status:
- One chart displays remaining and spent time at any point of the project lifecycle
- You can easily switch the chart time scope (the whole projects or any given sprint) and team scope (the whole team or any member)
