<?php
Class Server 
{
	private $mysql;
	private $method;
	private $type;
	private $message = array();
	private $url;
	private $string;
	private $put;
	private $post;
	private $error;
	private $model;

	function __construct()
	{
		$this->model = new Model();
		$this->mysql = new Mysql();
		$this->method = $_SERVER['REQUEST_METHOD'];
		$this->url = $_SERVER['REQUEST_URI'];
		$this->string = $_SERVER['QUERY_STRING'];
		$this->put = 'php://input';
		//$this->post = $_POST;
		$methodRequest = new ProcessorForm();
		$this->post = $methodRequest->getPost();
		$this->limit = 360;
		$this->time = time();
	}

	public function getType()
	{
		return $this->type;
	}
	
	public function getRequest()
	{	
		$this->url = substr_replace($this->url,'',0,1);
		$list = explode('/', $this->url, 5 );
		try
		{
			list(, , $db, $table, $path) = $list;
			$pos = strrpos($path,'.');
			
			if($pos !== false){
				$type = substr($path,$pos,5);
				$type = trim($type);
				$path = str_replace($type, '', $path);
				if($type[0]=='.'){
					$type = str_replace('.','',$type);
				}
			}
			$length = strlen($path);
			if($length>0){
				if($path[$length-1]=='/'){
					$path = substr($path,0,$length-1);
				}
				
				$arrParams = explode('/',$path);
				$arrLength = count($arrParams);
				if($arrLength >0){
					$str = $arrParams[$arrLength-1];
					if(substr_count($str,"=")<>0){//т.е. есть query парамметры типа ?p1=1&p2=2
						$parse = parse_url($path);
					}
				}
			}
			
			if ( ('xml' != $type && 'txt' != $type && 'json' != $type) || ($type=='')){
				$type = 'json';//set default value
			}

			$this->type = $type;
			
			if (isset($parse['path'])&& !empty($parse['path']))	{
				$path = $parse['path'];			
			}else
				$path = '';
			
			//preg_match('/^(.*?)\.(.*)$/', $path, $match);
			$param = array('','');
			
			if (!empty($path)){
				$param[0] = explode('/',$path);
			}else{
				if(isset($arrParams) && is_array($arrParams)){
					$param[0] = $arrParams;
				}else{
					$param[0] = '';
				}
			}
			
			if (isset($parse['query']) && !empty($parse['query'])) {
				parse_str($parse['query'],$param[1]);
			}
			
			switch($this->method)
			{
			case 'GET':
				$result = $this->setMethod('get'.ucfirst($table), $param);
				break;
			case 'DELETE':
				$result = $this->setMethod('delete'.ucfirst($table), $param);
				break;
			case 'POST':
				$result = $this->setMethod('post'.ucfirst($table), $this->post);
				break;
			case 'PUT':
				$result = $this->setMethod('put'.ucfirst($table), $param);
				break;
			default:
				$result = false;
			}
			if(false == $result)
			{
				$result = array();
			}
			
			if ('json' == $type)
			{
				return $this->generateJson($result);
			}
			elseif ('xml' == $type)
			{
				return $this->generateSimpleXML($result);
			}
			elseif ('txt' == $type)
			{
				return $this->generateTXT($result);
			}
		}
		catch(Exception $err)
		{
			return false;
		}
	}

	private function generateJson($data)
	{
		return  json_encode($data);
	}
	
	private function generateTXT($arrData)
	{
		$str = '';
		foreach ($arrData as $key=>$arr)
		{
			foreach ($arr as $name=>$value)
			{
				if (isset($arr[$name])&& !empty($arr[$name]))
				{
					$str .= $name.'='.$arr[$name].'&';
				}
				else
					$str .= $name.'='.'null'.'&';
			}
			if ('' != $str)
			{
				$str = substr_replace($str, '?', -1, 1);
			}
		}
		if ('' != $str)
		{
			$str = substr_replace($str, '', -1, 1);
		}
		return $str;
	}
	
	private function generateXML($arrData)
	{	
		$strXML = '<?xml version="1.0" encoding="UTF-8"?><ROOT><DATA>';
		foreach ($arrData as $key=>$arr)
		{
		$strXML .= '<AREA>';
			foreach ($arr as $name=>$value){
				if (isset($arr[$name])&& !empty($arr[$name]))
				{
					if(!is_numeric($name))
					{
						$strXML .= '<'.$name.'>'.$arr[$name].'</'.$name.'>';
					}
				}else{
					if(!is_numeric($name))
					{
						$strXML .= '<'.$name.'>'.'NULL'.'</'.$name.'>';
					}
				}
			}
			$strXML .= '</AREA>';
		}
		$strXML .='</DATA></ROOT>';
		return $strXML;
	}
	
	private function generateSimpleXML($arrData)
	{
		$xml=new DomDocument('1.0','utf-8');
		$root = $xml->appendChild($xml->createElement('ROOT'));
		$data = $root->appendChild($xml->createElement('DATA'));
		foreach ($arrData as $key=>$arr)
		{
			$client = $data->appendChild($xml->createElement('AREA'));
			foreach ($arr as $name=>$value){
				if (isset($arr[$name]) )
				{
					if(!is_numeric($name)){
						$nameNode = $xml->createElement($name);
						$client->appendChild($nameNode);
						$textNode = $xml->createTextNode($value);
						$nameNode->appendChild($textNode);
					}
				}else
				{
					if(!is_numeric($name)){
						$nameNode = $xml->createElement($name);
						$client->appendChild($nameNode);
						$textNode = $xml->createTextNode('NULL');
						$nameNode->appendChild($textNode);
					}
				}
			}
		}
		return $xml->saveXML();
	}
	
	public function getCommentsRecur($arr){
		$arrRes = array();
		foreach($arr as $key=>$value){
			if($value=='') break;
			$res = $this->model->getComments($value);
			$count = count($arrRes);
			$arrRes[$count+1] = $res[0];
			if($res[0]['id_reply_str'] <> ''){
				$arrStr = explode(',',$res[0]['id_reply_str']);
				$arrRes[$count+1]['reply'] = $this->getCommentsRecur($arrStr);
			}
			$idUser = $res[0]['id_user'];
			$resUser = $this->getUser($idUser);
			$arrRes[$count+1]['nick'] = $resUser[0]['nickname'];
			$arrRes[$count+1]['img_url'] = $resUser[0]['url_photo'];
		}
		return $arrRes;
	}
	
	public function getSelectedBlock(){
		$res = '';
		$i = 1;
		$arr = $this->model->getSelectedBlock();
		if(isset($arr) && is_array($arr)){
			foreach($arr as $key=>$value){
				$res[$i] = $value;
				$i++;
			}
		}
		return $res;
	}
	
	private function getAllComments($param){
		$val = 0;
		if(is_array($param)){
			if(isset($param[0][0]) && $param[0][0]<>'' && is_numeric($param[0][0]) ){
					$val = (int)$param[0][0];
			}else if($param[1]<>''){
				if(is_array($param[1]) && isset($param[1]['id'])){
					$val = (int)$param[1]['id'];
				}
			}	
			$res = $this->model->getAllComments($val);
		}
		return explode(',',$res[0]['comments']) ;
	}
	
	public function getComments($id){
		$arrRes = array();
		$arr = $this->getAllComments($id);
		$i=0;
		$result = array();
		foreach($arr as $key=>$val){
			$res = $this->model->getComments($val);
			$arrStr = explode(',',$res[0]['id_reply_str']) ;
			$idUser = $res[0]['id_user'];
			$resUser = $this->getUser($idUser);
			$res[0]['nick'] = $resUser[0]['nickname'];
			$res[0]['img_url'] = $resUser[0]['url_photo'];
			$res[0]['reply'] = $this->getCommentsRecur($arrStr);
			$result = array_merge($result, $res);
		}
				
		return $result;
	}
	
	public function getMaxComment(){
		$res = $this->model->getCommentMaxID();
		return $res;
	}
	
	public function putComment(){
		$file = file_get_contents($this->put);
		parse_str($file,$arr );
		$arrParam = json_decode($arr['json'],1);
		$res = $this->model->postComment($arrParam);
		$arrParam['comments'] = $res['id'];
		$res = $this->model->putComment($arrParam);
		return $res;
	}	
	
	public function putReply(){
		$file = file_get_contents($this->put);
		parse_str($file,$arr );
		$arrParam = json_decode($arr['json'],1);
		if(isset($arr['idClient'])){
			$this->idClient = $arr['idClient'];
		}
		$res = $this->model->putReply($arrParam);
		$arr['comment'] = $arrParam['id'];
		$arr['status_block'] = -1;
		$arr['selected_block'] = $arrParam['idBlock'];
		if(isset($res['success']) && $res['success']==true){
			if(isset($res['idreply'])) { 
				$arr['hasreply'] = $res['idreply'];
			}
			if(isset($res['datatime'])) { 
				$arr['datatime'] = $res['datatime'];
			}
			$res2 = $this->postComet($this->idClient,$arr);			
			
			if(!$res2){
				return array('success'=>false,'msg'=>'Error in comet table');
			}
			return array('success'=>true,'id'=>$arr['hasreply'],'parentid'=>$arr['comment'],'datatime'=>$arr['datatime']);
		}
		return array('success'=>false,'msg'=>'Error in comet table');
	}
	
	public function getUser($id)
	{	
		$res = array();
		if(is_array($id)){
			if($id[0]<>''){
				if(is_array($id[0])){
					$val = $id[0][0];
					$res = $this->model->getUser($val);
				}
			}else if($id[1]<>''){
				$val='';
				if(is_array($id[1]) && isset($id[1]['id'])){
					$val = $id[1]['id'];
				}
				$res = $this->model->getUser($val);
			}
		}else
			$res = $this->model->getUser($id);
		return $res;
	}
	
	public function getCommentID()
	{
		$res = $this->model->getCommentID();
		return $res;
	}
	
	public function postComment($arrParam){
		if(isset($arrParam['idClient'])){
			$this->idClient = $arrParam['idClient'];
		}
		
		$arr = json_decode($arrParam['json'],1);
		if(isset($arr['idBlock'])){
			if($arr['idBlock'] !== -1){
				$arrParam['selected_block'] = $arr['idBlock'];
				$arrParam['status_block'] = -1;
			}else{
				$arrParam['selected_block'] = $arr['id'];
				$arrParam['status_block'] = 1;
			}
		}elseif(isset($arr['id'])){
			$arrParam['selected_block'] = $arr['id'];
			$arrParam['status_block'] = -1;
		}
		
		
		$res = $this->model->postComment($arr);
		if(isset($res['success']) && $res['success']==true){
			if(isset($res['id'])) { 
				$arrParam['comment'] = $res['id'];
			}
			$res2 = $this->postComet($this->idClient,$arrParam);			
			if(!$res2){
				return array('success'=>false,'msg'=>'Error in comet table');
			}
		}
		return $res;
	}

	private function getCount($param)
	{
		$this->lastCount = 0;
		if(is_array($param)){
			if(isset($param[0][0]) && $param[0][0]<>''){
				$this->lastCount = (int)$param[0][0];
			}else if($param[1]<>''){
				if(is_array($param[1]) && isset($param[1]['id'])){
					$this->lastCount = (int)$id[1]['id'];
				}
			}
		}
		while (time()- $this->time < $this->limit) {
			$arr = $this->model->getCometID($this->lastCount);
			if(isset($arr[0][1]) && (int)$arr[0][1] > $this->lastCount){
				$res = (int)$arr[0][1];
				$this->lastCount = $res;
				$this->idClient = $arr[0][2];
				$newcomment = $arr[0][3];
				$hasreply = $arr[0][4];
				$block = $arr[0][5];
				$status = $arr[0][6];
				return array('lastCount'=>$this->lastCount,
							'idClient'=>$this->idClient,
							'data'=>$this->getSelectedBlock(),
							'newcomment'=>$newcomment,
							'hasreply'=>$hasreply,
							'block'=>$block,
							'statusBlock'=>$status
							);
				flush();
				exit;
			}
			sleep(2);
		}
	}
	
	public function postComet($idClient,$arr=null)
	{
		$res = $this->model->postComet($idClient,$arr);
		return $res;
	}
		
	public function setMethod($method, $param=false)
	{
		if ( method_exists($this, $method) )
		{
			return $this->$method($param);
		}
		$this->message = '500 Method is not exist!';
		return false;
	}
}
?>