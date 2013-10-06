<?php
Class Model
{
	private $mysql;
	public function __construct()
	{
		$this->mysql = new Mysql();
	}

	public function getComments($id)
	{
			$where['where']['values'] = array($id);
			$where['where']['fields'] = array(' comments.id = %s ');
			$res = $this->mysql->select(array("`id`","`id_reply_str`","`id_user`","`comment`","`datatime`"),
								array('selection.comments'),'',$where,'','',MYSQL_ASSOC);	

		return $res;
	}	
	
	public function getUser($id)
	{
			$where['where']['values'] = array($id);
			$where['where']['fields'] = array(' users.id = %s ');
			$res = $this->mysql->select(array("`id`","`nickname`","`url_photo`"),
								array('selection.users'),'',$where,'','',MYSQL_ASSOC);	

		return $res;
	}	
	
	public function getAllComments($id)
	{
			$where['where']['values'] = array($id);
			$where['where']['fields'] = array(' selected_blocks.id = %s ');
			$res = $this->mysql->select(array("`id`","`comments`"),
								array('selection.selected_blocks'),'',$where,'','',MYSQL_ASSOC);	

		return $res;
	}
	
	public function getSelectedBlock()
	{
		$res = $this->mysql->select(array("`id`",
									"`comments`",
									"`startPos`",
									"`endPos`",
									"`selectedtext`"),
						array('selection.selected_blocks'),'','','','',MYSQL_ASSOC);	
		return $res;
	}
	
	public function getCommentID()
	{
		$res = $this->mysql->select(array("max(`id`) as id"),
							array('selection.comments'),'','','','',MYSQL_ASSOC);
		return $res;
	}

	private function getUserMaxID()
	{
		$res = $this->mysql->select(array("max(`id`) as id"),
							array('selection.users'),'','','','',MYSQL_ASSOC);
		return $res;
	}
	
	public function putCommentIntoBlocksTabl($arr)
	{
		$res = $this->mysql->insert(array('`id`',
							'`comments`',
							'`startPos`',
							'`endPos`',
							'`selectedtext`'),
		array('selection.selected_blocks'),
		array($arr['id'],
			$arr['comments'],
			$arr['startPos'],
			$arr['endPos'],
			$arr['selectedtext']));
			
		$arrRes = $this->getCommentMaxID();
			$id = $arrRes[0]['id'];	
			
		return array('success'=>true,'id'=>$id);
	}
	
	public function putReply($arr){
		$res = $this->postComment($arr,true);

		$newcommentid = $res['id'];
		$id = $arr['id'];
		$datatime = $res['datatime'];
		$res2 = $this->concatReply($id,$newcommentid);
		if($res2===true){
			return array('success'=>true,'idreply'=>$newcommentid,'datatime'=>$datatime);
		}
		return array('success'=>false);
	}
	
	public function getCommentMaxID()
	{
		$res = $this->mysql->select(array("max(`id`) as id"),
							array('selection.selected_blocks'),'','','','',MYSQL_ASSOC);
		return $res;
	}
	
	private function concatComment($arrParam)
	{
		$arr = $this->getAllComments($arrParam['id']);
		if($arr!=''){
			$str = $arr[0]['comments'];
			if($str==''){
				$arrParam['comments'] = '"'.(string)$arrParam['comments'].'"';
			}else{
				$arrParam['comments'] = '",'.(string)$arrParam['comments'].'"';
			}
			
			$values = 'concat(`comments`,'.$arrParam['comments'].')';
			$where['where']['values'] = array($arrParam['id']);
			$where['where']['fields'] = array(' id =%s ');
			$where['set']['fields'] = array(' comments=%s ');
			$where['set']['values'] = array($values);
			$where['set']['quotes'] = array(false);
			$res = $this->mysql->update($where,array('selection.selected_blocks'),$where,'');
		}else{
			$res = $this->putCommentIntoBlocksTabl($arrParam);
		}
		return $res;
	}
	
	private function concatReply($id,$newcomment)
	{	
		$res = false;
		$arr = $this->getComments($id);
			if(isset($arr[0]['comment'])){
				$str = $arr[0]['comment'];
			}
			if(isset($arr[0]['id_reply_str']) && $arr[0]['id_reply_str']!=''){
				$newcomment = '",'.(string)$newcomment.'"';
			}else{
				$newcomment = '"'.(string)$newcomment.'"';
			}
			$values = 'concat(`id_reply_str`,'.$newcomment.')';
			$where['where']['values'] = array($id);
			$where['where']['fields'] = array(' id =%s ');
			$where['set']['fields'] = array(' id_reply_str = %s ');
			$where['set']['values'] = array($values);
			$where['set']['quotes'] = array(false);
			$res = $this->mysql->update($where,array('selection.comments'),$where,'');
		
		return $res;
	}	
	
	private function postUser($nick,$url)
	{
		$res = $this->mysql->insert(array('`id`',
								'`nickname`',
								'`url_photo`'),
			array('selection.users'),
			array(NULL,
				$nick,
				$url));		
				
		return $res;
	}
	
	public function postComment($arrParam,$flagOuter=false)
	{
		date_default_timezone_set('Europe/Kiev');
		$arrParam['time'] = date("Y-m-d").' '.date("H:i:s");
		$repl = $this->postUser($arrParam['nick'],$arrParam['img_url']);
		$arr = $this->getUserMaxID();
		$arrParam['IdUser'] = $arr[0]['id'];
		$res = $this->mysql->insert(array('`id`' ,
								'`id_reply_str`' ,
								'`id_user`',
								'`comment`',
								'`datatime`'),
			array('selection.comments'),
			array(NULL,
				'',
				$arrParam['IdUser'],
				$arrParam['comment'],
				$arrParam['time'])
			);

				
		if($res==true){	
			$arr = $this->getCommentID();
			$id = $arr[0]['id'];
			if($flagOuter==false){
				$idcomment = $arrParam['id'];
				$arrParam['comments'] = $id;
				$this->concatComment($arrParam);
			}
			return array('success'=>true,'id'=>$id,'datatime'=>$arrParam['time']);
		}	
		return array('success'=>false);
	}

	public function getComet()
	{
		$where['where']['values'] = array("1");
		$where['where']['fields'] = array('comet.ID = %s');
		$where['where']['quotes'] = array(false);
		
		$res = $this->mysql->select(array("`IDlast` as newID"),
								array('selection.comet'),'',$where,'','');
										
		return $res;
	}
	
	public function postComet($IDclient,$arr=null)
	{
		if(isset($arr) && is_array($arr)){
			if(isset($arr['comment'])) $comment1 = $arr['comment'];else $comment1 = -1;
			if(isset($arr['hasreply'])) $hasreply = $arr['hasreply'];else $hasreply = -1;
			if(isset($arr['selected_block'])) $comment2 = $arr['selected_block'];else $comment2 = -1;
		}
		$arrRes = $this->getComet();
		
		if(!empty($arrRes[0]['newID'])){
			$newID = $arrRes[0]['newID']+1;
		}else
			$newID = 1 ;
		date_default_timezone_set('Europe/Kiev');
		$time = date("Y-m-d").' '.date("H:i:s");
		$res = $this->mysql->replace(array('`ID`','`Time`','`IDlast`','`IDclient`','`comment`','`has_reply`','`selected_block`'),
			array('comet'),
			array(1,$time,$newID,$IDclient,$comment1,$hasreply,$comment2));
		return $res;
	}
	
	public function getCometID($id)
	{
		$res = $this->mysql->select(array("ID","IDlast","IDclient","comment","has_reply","selected_block"),
								array('selection.comet'),'','','','');
		return $res;
	}
}
?>