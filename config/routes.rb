if Rails::VERSION::MAJOR < 3
  ActionController::Routing::Routes.draw do |map|
    map.connect 'adburndown/:action/:id', :controller => :adburndown
    map.connect 'adsprintinl/:action/:id', :controller => :adsprintinl
    map.connect 'adsprints/:action/:id', :controller => :adsprints
    map.connect 'adtaskinl/:action/:id', :controller => :adtaskinl
    map.connect 'adtasks/:action/:id', :controller => :adtasks
  end
else
  match 'adburndown/(:action(/:id))', :controller => 'adburndown'
  match 'adsprintinl/(:action(/:id))', :controller => 'adsprintinl'
  match 'adsprints/(:action(/:id))', :controller => 'adsprints'
  match 'adtaskinl/(:action(/:id))', :controller => 'adtaskinl'
  match 'adtasks/(:action(/:id))', :controller => 'adtasks'
  match 'issues/(:action(/:id))', :controller => 'issues'
end