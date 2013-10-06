<?php
Class Mysql extends Sql
{
	private $connection ;

	function __construct() {
		$this->open_connection() ;
	}

	private function open_connection() {
		$this->connection = mysql_connect(DB_HOST,DB_USER,DB_PASS) ;
		if(!$this->connection) {
			die("Database connection failed: ". mysql_error()) ;
		} else {
			$db_select = mysql_select_db(DB_NAME) ;
			if(!$db_select) {
				die("Database selection failed: ". mysql_error()) ;
			}
		}
		mysql_query("set names utf8") or die("set names utf8 failed") ;
	}

	public function sql($query) {
		$result = mysql_query($query, $this->connection) ;
		if(!$result) {
			die("Database query failed: ".mysql_error()) ;
		}
		return $result ;
	}

	public function selectMax($fields,$tables)
	{
		$result = '';
		$sql = parent::selectMax($fields,$tables);
		$query = $this->sql($sql);
		if($query){
			$result = mysql_fetch_array($query);
		}
		else{
			throw new Exception ("Can't SELECT execute the query! Sorry");
		}
		return $result;
	}
	
	public function select($fields,$tables,$join,$where,$groupBy,$orderBy,$typeConst='')
	{
		$result = '';
		$const = MYSQL_BOTH;
		if ($join)
		{
			foreach($join['join']['values']as $value)
			{
				$value = mysql_real_escape_string($value);
				$arrayJoin[] = $value;
			}
			$join['join']['values'] = $arrayJoin;
		}
		if($typeConst<>'' &&(($typeConst == MYSQL_ASSOC) || ($typeConst == MYSQL_NUM) )){
			$const = $typeConst;
		}
		if ($where)
		{
			foreach($where['where']['values']as $value)
			{
				$value = mysql_real_escape_string($value);
				$newArray[] = $value;
			}
			$where['where']['values'] = $newArray;
			$sql = parent::select($fields,$tables,$join,$where,$groupBy,$orderBy);
			$query = $this->sql($sql);
			if($query){
				while($row = mysql_fetch_array($query,$const))
				{
					$result[] = $row;
				}
			}
		}
		else {
			$sql = parent::select($fields,$tables,$join,$where,$groupBy,$orderBy);
			$query = $this->sql($sql);
			if($query){
				//while($row = mysql_fetch_object($query))
				while($row = mysql_fetch_array($query,$const))
				{
					$result[] = $row;
				}
			}
			else{
				throw new Exception ("Can't SELECT execute the query! Sorry");
			}
		}
		return $result;
	}
	
	public function insert($fields,$tables,$value)
	{
		if (is_array($value)){
			foreach ($value as $val){
				$vall = mysql_real_escape_string($val);
				$v[] = $vall;
			}
		}
		else{
			$v = $value;
		}
		$sql = parent::insert($fields,$tables,$v);
		if(!$query = $this->sql($sql)){
			throw new Exception ("Can't INSERT execute the query! Sorry");
		}
		else
		{
			return true;
		}
	}

	public function replace($fields,$tables,$value)
	{
		if (is_array($value)){
			foreach ($value as $val){
				$vall = mysql_escape_string($val);
				$v[] = $vall;
			}
		}
		else{
			$v = $value;
		}
		$sql = parent::replace($fields,$tables,$v);
		if(!$query = $this->sql($sql)){
			throw new Exception ("Can't REPLACE execute the query! Sorry");
		}
		else
		{
			return true;
		}
	}
	
	public function update($fields, $tables, $where, $limit)
	{
		if ($where){
			foreach($where['where']['values']as $value)	{
				$value = mysql_real_escape_string($value);
				$where['where']['values'][] = $value;
			}
		}
		$sql = parent::update($fields, $tables, $where, $limit);
		//var_dump($sql);
		if(!$query = $this->sql($sql)){
			throw new Exception ("Can't UPDATE execute the query! Sorry");
		}
		else
		{
			return true;
		}
	}

	public function delete($fields, $tables, $where, $limit)
	{
		if ($where){
			foreach($where['where']['values']as $value){
				$value = mysql_escape_string($value);
				$where['where']['values'][] = $value;
			}
		}
		$sql = parent::delete($fields, $tables, $where, $limit);
		if(!$query = $this->sql($sql)){
			throw new Exception ("Can't DELETE execute the query! Sorry");
		}
		else{
			return true;
		}
	}
}
?>