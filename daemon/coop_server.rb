RAILS_ROOT = File.join(File.expand_path(File.dirname(__FILE__)), "..", "..", "..", "..")

require 'rubygems'
require 'eventmachine'
require 'mysql'

# include main http moduls
require File.join(File.expand_path(File.dirname(__FILE__) + "/coop_http"))

GC.start

def init_global
  config = YAML.load_file(File.join(RAILS_ROOT, "config", "database.yml"))
  envconf = config[ENV['ENV'] || 'production']
  $db =  Mysql.connect(envconf["host"], envconf["username"], envconf["password"], envconf["database"])

  $users = {}
  $projects = {}
end

init_global
EM.epoll if EM.epoll?
EM.run do
  EM.start_server '0.0.0.0', ARGV.first || 8000, CoopConnection
end