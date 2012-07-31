require 'cgi'
require 'yajl'
require 'yaml'

class User
  attr_reader :id

  def self.new_from_db(autologin, pid)
    token = Mysql::quote(autologin)
    q = $db.query("select * from tokens left join members on (members.user_id = tokens.user_id) where value='#{token}' and action='autologin' and project_id = #{pid}")
    return nil if q.num_rows != 1
    new(:id => q.fetch_hash['user_id'])
  end

  def touch(project)
    pid = project.pid
    # cancel old timer, it would not fire, because user is alive at this moment
    @timers[pid].cancel if @timers[pid]
    # give 2 minutes for away
    @timers[pid] = EventMachine::Timer.new(120) do
      # leave project
      project.leave(@id)
      @timers.delete(pid)
    end
  end

  def initialize(attributes)
    @id = attributes[:id]
    @timers = {}
  end
end

class Project
  attr_reader :pid, :users, :waiting, :queue, :log, :seq

  def initialize(pid)
    @log = []
    @users = []
    # users with empty queue
    @waiting = {}
    @queue = {}
    @pid = pid
    @seq = 0
  end

  # new user start working with project
  def join(conn, start_tag)
    @users << conn.user.id
    @waiting[conn.user.id] = conn
    # find state in log for new user
    idx = @log.rindex{|x| x[:tag] == start_tag} || -1
    cnt = @log.length - idx - 1
    # if there is no new actions from last state just exit
    return unless cnt
    # queue actions to allow user to catch current state
    @log.last(cnt).each {|x| queue_act(conn.user.id, x)}
  end

  # user leaves page with project
  def leave(user_id)
    @users.delete(user_id)
    @waiting.delete(user_id)
    @queue.delete(user_id)
  end

  # user just disconnected, wait while he returns
  def disconn(user_id)
    @waiting.delete(user_id)
  end

  # user ready to recieve next action from queue
  def check_queue(conn)
    # if there are elements in queue, send first of them
    if @queue[conn.user.id] && !@queue[conn.user.id].empty?
      send_act(conn, @queue[conn.user.id].first)
    else
      # else add user to waiting list
      @waiting[conn.user.id] = conn
    end
  end

  # confirm delivery of packet by user
  def confirm_ack(conn, seq)
    return unless @queue[conn.user.id]
    @queue[conn.user.id].delete_if {|x| x[:seq] == seq}
    conn.empty_response
  end

  # recieve new action, log it and send to everyone except sender
  def act(user_id, msg)
    # check if it's double
    return if @log.last && @log.last[:tag] == msg[:tag]
    # add sequence number for action
    msg[:seq] = @seq
    @seq += 1
    # keep trace of actions
    @log << msg
    # add action to queues
    @users.each { |x|
      queue_act(x, msg) if x != user_id
    }
  end

  private

  # add action to queue
  def queue_act(user_id, act)
    @queue[user_id] ||= []
    @queue[user_id] << act
    # send this action if user is waiting
    if @waiting[user_id]
      send_act(@waiting[user_id], act)
      @waiting.delete(user_id)
    end
  end

  # send action to user
  def send_act(conn, act)
    conn.respond(Yajl::Encoder.encode(act))
  end
end

module CoopConnection
  attr_reader :user, :project

  def unbind
    # connection closed, delete user from waiting-list
    $projects[@pid].disconn(@user.id) if @pid && @user && $projects[@pid]
  end

  def receive_data(data)
    lines = data.split(/[\r\n]+/)
    method, request, version = lines.shift.split(' ', 3)
    if request.nil?
      close_connection
      return
    else
      path, query = request.split('?', 2)
      query = CGI.parse(query) if not query.nil?
      cookies = {}
      lines.each { |line|
        if line[0..6].downcase == 'cookie:'
          cookies = CGI::Cookie.parse(line.split(':', 2).last.strip)
        end
      }
    end

    if path == '/debug'
      $projects.each{|project_id, project|
        puts "Project #{project_id}"
        puts "  Seq: #{project.seq}"
        puts "  Waiting:"
        project.waiting.each_key{ |k|
          puts "    #{k}"
        }
        puts "  Queue:"
        project.queue.each{ |user_id, queue|
          puts "    #{user_id}:"
          queue.each{ |v|
            puts "      #{v[:seq]}"
          }
        }
        puts "  Users:"
        project.users.each{ |k|
          puts "    #{k}"
        }
        puts "  Log:"
        project.log.each{ |v|
          puts "    #{v[:seq]}, #{v[:tag]}"
        }
      }
      empty_response
      return
    end

    # we need project id and user id
    if !query || !query['pid'] || !cookies['autologin']
      respond("Incomplete arguments", 500)
      return
    end

    # project
    pid = query['pid'].first.to_i
    @project = ($projects[pid] ||= Project.new(pid))

    # authorize
    autologin = cookies['autologin'].first
    @user = ($users[autologin] ||= User.new_from_db(autologin, pid))
    return respond("Cannot authorize", 500) unless @user
    # keep it from leaving
    @user.touch(@project)

    puts "Project: #{pid}, user: #{@user.id}, path: #{path}"

    case path
      when '/send'
        return respond("Incomplete arguments", 500) if !query['tag'] || !query['type'] || !query['id'] || !query['value'] || !query['action']
        puts "Send... Type: #{query['type'].first}, id: #{query['id'].first}, value: #{query['value'].first}, tag: #{query['tag'].first}, action: #{query['action'].first}"
        msg = {:tag => query['tag'].first, :type => query['type'].first, :id => query['id'].first, :value => query['value'].first, :action => query['action'].first}
        @project.act(@user.id, msg)
        empty_response
      when '/check'
        return respond("Incomplete arguments", 500) if !query['tag']
        puts "Check... Tag: #{query['tag'].first}"
        # check if new user joined
        @project.join(self, query['tag'].first) unless @project.users.index(@user.id)
        # timer to update long-polling
        timer = EventMachine::Timer.new(30) do
          empty_response
        end
        # check if we have new messages
        @project.check_queue(self)
      when '/ack'
        return respond("Incomplete arguments", 500) if !query['seq']
        puts "Ack... seq: #{query['seq'].first}"
        @project.confirm_ack(self, query['seq'].first.to_i)
        empty_response
      else
        respond("not found", 404)
    end
  end

  RESPONSE = [
      "HTTP/1.1 %d AgileDwarf Coop",
      "Content-length: %d",
      "Content-type: %s",
      "Connection: close", "", "%s"
  ].join("\r\n")

  def empty_response
    respond Yajl::Encoder.encode([])
  end

  def respond(body, status = 200, content_type = 'application/json; charset=utf-8')
    send_data RESPONSE % [status, body.length, content_type, body]
    close_connection_after_writing
  end
end