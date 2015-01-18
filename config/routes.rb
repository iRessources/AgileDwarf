if Rails::VERSION::MAJOR < 3
  ActionController::Routing::Routes.draw do |map|
    map.connect 'adburndown/:action/:id', :controller => :adburndown
    map.connect 'adsprintinl/:action/:id', :controller => :adsprintinl
    map.connect 'adsprints/:action/:id', :controller => :adsprints
    map.connect 'adtaskinl/:action/:id', :controller => :adtaskinl
    map.connect 'adtasks/:action/:id', :controller => :adtasks
  end
else
  match 'adburndown/(:action(/:id))', :controller => 'adburndown', :via => [:get, :post]
  match 'adsprintinl/(:action(/:id))', :controller => 'adsprintinl', :via => [:get, :post]
  match 'adsprints/(:action(/:id))', :controller => 'adsprints', :via => [:get, :post]
  match 'adtaskinl/(:action(/:id))', :controller => 'adtaskinl', :via => [:get, :post]
  match 'adtasks/(:action(/:id))', :controller => 'adtasks', :via => [:get, :post]
end
