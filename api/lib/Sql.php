<?php

Class Sql
{
	protected  function selectMax($field,$table)
	{
		if (!empty($field) && !empty($table))
		{
			$sql = "SELECT MAX(".$field.") from ".$table;
			return $sql;
		}
		else 
			return false;
	}
	
	
	protected  function select($fields,$table,$join,$where,$group_by,$order_by)
	{
		if ((count($fields) != 0)&&(count($table) != 0)){
			$sql = "SELECT distinct ";
			$sql .= implode(", ", $fields);
			$sql .= " FROM ";
			$sql .= implode(", ", $table);
			if(count($join)!=0)
			{
				$sel_join = '';
				if($join)
				{
					foreach($join['join']['fields'] as $key => $value)
					{
						$value = ' '.$join['join']['key'][$key].' '.$join['join']['table'][$key].' on '.$value.' ';
						$value = str_replace ('%s',$join['join']['values'][$key], $value);
						$sel_join .= $value;
						
					}
					$sql .= $sel_join;
				}
			}
			
			if(count($where)!=0)
			{
				$sel_where = '';
				if($where)
				{
					foreach($where['where']['fields']as $key => $value)
					{
						$value = $where['where']['fields'][$key];
						if (!empty($where['where']['quotes']) && true === $where['where']['quotes'][$key])
						{
							$value = str_replace ('%s',"'".$where['where']['values'][$key]."'", $value);
						}
						else
						{
							$value = str_replace ('%s',$where['where']['values'][$key], $value);
						}
						$sel_where .= $value;
					}
					$sql .= " WHERE ".$sel_where;
				}
				if($group_by)
				{
					$sql .= " GROUP BY ".$group_by;
				}
				if($order_by)
				{
					$sql .= " ORDER BY ".$order_by;
				}
			}
			return $sql;
		}
		else
		{
			return false;
		}
	}
	protected function insert($fields, $table, $values)
	{
		if ((count($fields) != 0)&&(count($table) != 0)&&(count($values) != 0))
		{
			$sql = "INSERT INTO ";
			$sql .= implode(", ", $table);
			$sql .= " (";
			$sql .= implode(", ", $fields);
			$sql .= ") VALUES (";
			if (is_array($values))
			{
				foreach ($values as $value)
				{
					$vals[] = "'".$value."'";
				}
				$sql .= implode(", ", $vals);
			}
			else
			{
				$sql .= "'".$values."'";
			}
			$sql .= ")";
			return $sql;
		}
		else
		{
			return false;
		}
	}

	protected function replace($fields, $table, $values)
	{
		if ((count($fields) != 0)&&(count($table) != 0)&&(count($values) != 0))
		{
			$sql = "REPLACE INTO ";
			$sql .= implode(", ", $table);
			$sql .= " (";
			$sql .= implode(", ", $fields);
			$sql .= ") VALUES (";
			if (is_array($values))
			{
				foreach ($values as $value)
				{
					$vals[] = "'".$value."'";
				}
				$sql .= implode(", ", $vals);
			}
			else
			{
				$sql .= "'".$values."'";
			}
			$sql .= ")";
			return $sql;
		}
		else
		{
			return false;
		}
	}	
	
	protected function update($fields, $table, $where, $limit)
	{
		if ((count($fields) != 0)&&(count($table) != 0))
		{
			$sql = "UPDATE ";
			$sql .= implode(", ", $table);
			$sql .= " SET ";
			if(count($where) != 0)
			{
				$uptSet = '';
				foreach($where['set']['fields']as $key => $value)
				{
					$value = $where['set']['fields'][$key];
					if (!empty($where['set']['quotes']) && true === $where['set']['quotes'][$key]){
						$value = str_replace ('%s',"'".$where['set']['values'][$key]."'", $value);
					}
					else{
						$value = str_replace ('%s',$where['set']['values'][$key], $value);
					}
					
					$uptSet .= $value;
				}
				$sql .= $uptSet;
			}
			if(count($where) != 0)
			{
				$uptWhere = '';
				foreach($where['where']['fields']as $key => $value)
				{
					$value = $where['where']['fields'][$key];
					$value = str_replace ('%s', $where['where']['values'][$key], $value);
					/*if (!empty($where['where']['quotes']) && true === $where['where']['quotes'][$key]){
						$value = str_replace ('%s',"'".$where['where']['values'][$key]."'", $value);
					}
					else{
						$value = str_replace ('%s',$where['where']['values'][$key], $value);
					}*/
									
					$uptWhere .= $value;
				}
				$sql .= " WHERE ".$uptWhere;
			}
			if($limit)
			{
				$sql .= " LIMIT ".$limit;
			}
			return $sql;
		}
		else
		{
			return false;
		}
	}


	protected function delete($fields,$table,$where, $limit)
	{
		if ((count($fields) != 0)&&(count($table) != 0)&& $where)
		{
			$sql = "DELETE FROM ";
			$sql .= implode(", ", $table);
			if(count($where) != 0)
			{
				$new_where = '';
				foreach($where['where']['fields']as $key => $value)
				{
					$value = $where['where']['fields'][$key];
					$value = str_replace ('%s',"'" . $where['where']['values'][$key] . "'", $value);
					$new_where .= $value;
				}
				$sql .= " WHERE ".$new_where;
			}
			if($limit)
			{
				$sql .= " LIMIT ".$limit;
			}
			return $sql;
		}
		else
		{
			return false;
		}
	}
}
?>