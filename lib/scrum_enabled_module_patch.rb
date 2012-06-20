require_dependency 'enabled_module'

module EnabledModulePatch
  def self.included(base)
    base.send(:include, InstanceMethods)
    base.class_eval do
      alias_method_chain :module_enabled, :scrum
    end
  end

  module InstanceMethods
    # init task positions when enable module
    def module_enabled_with_scrum
      if name == 'scrum'
        max = 0
        ActiveRecord::Base.connection.execute("select max(ir_position) from issues where project_id =  #{self.project_id}").each{|row| max = row[0]}
        ActiveRecord::Base.connection.execute "update issues set ir_position = #{max} + id where ir_position is null"
        logger.info("Module attached to project #{self.project_id}")
      end
      module_enabled_without_scrum
    end
  end
end

EnabledModule.send(:include, EnabledModulePatch)