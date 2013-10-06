<?php
set_time_limit(360);
error_reporting(E_ERROR | E_WARNING | E_PARSE);

require_once '../conf/config.php';
function __autoload($className)
{
	require '../lib/'.$className . '.php';
}
try
{
	$server = new Server();
	$str = $server->getRequest();
	$type = $server->getType();
	
	if($type == 'xml'){
		header('Content-type:text/xml;charset=UTF-8');
	}else if($type == 'txt'){
		header('Content-type:text/plain;charset=UTF-8');
	}else if($type == 'json'){
		header('Content-type: application/json;charset=UTF-8');
	}
	
	echo $str;
}
catch (Exception $error)
{
	$err = $error->getMessage();
	echo "Error!" . $err;
}
?>