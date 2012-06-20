class AddVersionsRange < ActiveRecord::Migration
  def self.up
    add_column :versions, :ir_start_date, :date, :null => true
    add_column :versions, :ir_end_date, :date, :null => true
  end

  def self.down
    remove_column :versions, :ir_start_date
    remove_column :versions, :ir_end_date
  end
end
