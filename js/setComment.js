$.fn.setComment = function(options){
	if(typeof options == "undefined"){
        options = {};
    }
    options.holder = $(this);
	$(this).addClass('setCommentClass');
	return new setComment(options);
}
function setComment(options){
	this.init(options);
	return this;
}
setComment.prototype = {
	init: function(options){
        this.options = $.extend({
			holder : '',
			withAutorization:false,
			maxAjax:false,
			cssSelected: 'select',
			cssCommented:'comment',
			urlCommentsRead:'url_error',
			urlSelectedRead:'url_selected',
			flagFullWords:true
		},options);
		this.MAX_TITLE_SYMBOL = 45;
		this.TIMEOUT = 360;
		this.idClient = this.idClient || this.getIdClient();
		this.lastId = '';
		this.flagSuccessAddComent = true;
		this.dataComments = {};
		this.objModal = {};
		this.authObj = {};
		this.messageNode = {};
		this.arrObjComment = [];
		this.fullHTML = this.getFullHTML();
		this.connection();
		this.initAuth();
		this.bindEvents();
    },
	getIdClient:function(){
		return Math.round(Math.random(+new Date() + Math.random()) * 100000000);
	},
	getLengthObj: function(obj){
		var key,res=0,type=Object.prototype.toString.call(obj);
		if(type ==='[object Array]' || type ==='[object Object]' ){
			for(key in obj)
				res++;
		}
		return res;
	},
	getData: function(obj,holder) {
		var _this = holder;
		objData = obj['data'];
		if(_this.idClient != obj['idClient'] || !_this.idClient)	{
			_this.getAjaxSelected(_this.highlightAllComments,_this);
			if(this.objModal.flagShowModal===true){
				if($(this.modal).attr('dataparentid') == obj['block'] || obj['block'] == -1){
					var _this = this;
					this.getAjaxDataObj({holder:_this, callback:_this.getAllComments,lastObj:_this.data});
				}
			}
		}
	},
	parseData: function(ndata,holder) {
		var _this = holder || this;
		if(ndata['lastCount']){
			_this.lastId = parseInt(ndata['lastCount']);
			if(ndata['data'] && ndata['data']!='') {
				_this.getData(ndata,_this);
			}
		}else if(typeof(ndata)=='object' && ndata.length==0){
			_this.lastId = '';
		}
		setTimeout(function(){_this.connection(_this);},1000);
	},
	connection: function(holder) {
		var url,_this = holder || this;
		url = _this.options.urlComet;
		if(url.search('.json') != -1){
			url = url.replace('/.json','') + _this.lastId +'/.json' ;
		}
		$.ajax({
				type: "GET",
				url: url,
				timeout: _this.TIMEOUT*1000,
				success: function(ndata){
					_this.parseData(ndata,_this);
				},
				error:function(){
					setTimeout(function(){_this.connection(_this);},1000);
				}
			});
	},
	highlightAllComments:function(arrObj,holder){
		var html, i, _this;
		_this = holder || this;
		html = _this.fullHTML;
		for(i in arrObj){
			html = _this.replaceText(html, arrObj[i]['startPos'], arrObj[i]['endPos'], 
									_this.options.cssCommented,{index:i, id:arrObj[i]['id']});
		}
		_this.resetHTML = html;
		_this.setNewHTML(html);
	},
	prepare: function(el){
		if(el.normalize) {
			el.normalize();
		}
	},
	getAjaxSelected:function(callback,holder){
		var _this, url='error';
		_this = holder || this;
		if(_this.options!=null && _this.options.urlSelectedRead!=null){
				url = _this.options.urlSelectedRead;
		}
		$.ajax(url,{
				dataType: 'json',
				success: function(data){
					_this.arrObjComment = data;
					setTimeout(function(){callback(_this.arrObjComment,_this)},1000);
				}
		});
	},
	removeSelection:function(){
		if (window.getSelection) { 
			window.getSelection().removeAllRanges(); 
		}else if (document.selection && document.selection.clear)
			document.selection.clear();
	},
	filterObject:function(lastObj,newObj,holder){
		var _this = holder,key,i=0,lastLength,newLength,resObj=[];
		lastLength = _this.getLengthObj(lastObj);
		newLength = _this.getLengthObj(newObj);
		var obj={};
		if($.isArray(newObj)==true){
		   for(key in newObj)
		   obj[+key+1]=newObj[key];
		   newObj=obj;
		}
		for(key in newObj){
			if(key > lastLength){
				resObj.push(newObj[key]);
			}
		}
		return resObj;
	},
	filterObjectRecur:function(data1,data2,holder){
			var last_div,res,_this = holder || this,link,resId,id;
			var arrId=[],arrRes=[],objRes;
			if(data1 == null || data2==null){return '';}
			for(key in data2){
				arrId.push(data2[key]['id']);
			}
			(function getCommentRecur(data1,data2,id){
				var id,res2 = _this.filterObject(data1,data2,_this);
				if($.isEmptyObject(res2)==false){
					if(!id) id='';
					objRes = {'id':id,'obj':res2};
					arrRes.push(objRes);
				}
				for(key in data2){
					if(data2[key]['reply']!=null && data1 && data1[key]){
						id = data2[key]['id'];
						getCommentRecur(data1[key]['reply'],data2[key]['reply'],id);
					}
				}
			})(data1,data2,id);
			return arrRes;
	},
	getAjaxDataObj:function(paramsObj){
		var key,id,url='error',_this;
		if(paramsObj.holder!=null && paramsObj.callback!=null){
			_this = paramsObj.holder;
			if(_this.options!=null && _this.options.urlCommentsRead!=null){
				url = _this.options.urlCommentsRead;
			}
			id = _this.dataComments.idcomment;
			_this.options.urlCommentsRead;
			if(url.search('.json') != -1){
				url = url.replace('/.json','') + '/index.php?id='+ id +'/.json' ;
			}
			$.ajax(url,{
				dataType: 'json',
				success: function(data){
					var obj={},key,key2;
					_this.data = data;
					if(paramsObj.lastObj!=null) {
						data = _this.filterObjectRecur(paramsObj.lastObj, data, _this);
						if(Object.prototype.toString.call(data)==='[object Array]'){
							for(key in data){
								if(data[key]['id']!=null && data[key]['id']==''){
									var divParent = _this.allComments;
									if(Object.prototype.toString.call(data[key]['obj'])==='[object Array]'){
										_this.getAllCommentsIntoParrent(data[key]['obj'],divParent,_this);
									}
								}else{
									var parent={};
									parent.reference = $('div[comment='+data[key]['id']+']').closest('.hs_message');
									if(Object.prototype.toString.call(data[key]['obj'])==='[object Array]'){
										for(key2 in data[key]['obj']){
											_this.addCommentsDOM(data[key]['obj'][key2],parent);
										}
									}
								}
							}
						}
					}else{
						setTimeout(function(){paramsObj.callback(_this.data, _this)},2000);
					}
				}
			});
		}
	},
	getAllComments:function(data,holder){
		var _this = this;
		if(holder != null){
			_this = holder;
		}
		_this.allComments = _this.getComment(data);
		$(_this.allComments).addClass('comments_contant');
		_this.hideAnimateModal();
		$(_this.container).append(_this.allComments);
	},
	getAllCommentsIntoParrent:function(data,divParent,holder){
		var _this = this;
		if(holder != null){
			_this = holder;
		}
		_this.allComments = _this.getComment(data,divParent);
		$(_this.container).append(_this.allComments);
	},
	getComment:function(data,main_div,parent_div){
		var last_div,_this = this;
		if(data == null){return '';}
		if(main_div == null) main_div = $('<div/>');
		(function getCommentRecur(data,parent_div){
			if(parent_div == null)
				parent_div = main_div;
			for(key in data){
				if(data[key]['reply']!=null){
					var last_div = $('<div/>').addClass('hs_message');
					var a = _this.getCommentObj(data[key],last_div);
					var b = getCommentRecur(data[key]['reply'],last_div);
					$(parent_div).append(b);
				}else{
					var a = _this.getCommentObj(data[key]);
					$(a).appendTo(parent_div);
				}	
			}
			return parent_div;
		})(data);
		return main_div;
	},
	initAuth: function(){
		var _this = this,count=0;
		this.authStr = '';
		if(typeof this.options.withAutorization!='undefined' && $.type(this.options.withAutorization)=='object' ){
			if(this.options.withAutorization.VK !=null && this.options.withAutorization.VK.apiId !=null){
				this.authStr += ' '+ 'authVK';
				VK.init({
					apiId: _this.options.withAutorization.VK.apiId
				});	
			}
			if(this.options.withAutorization.FB !=null && this.options.withAutorization.FB.apiId !=null){
				this.authStr += ' '+ 'authFB';
				FB.init({
					appId: _this.options.withAutorization.FB.apiId
				});
			}
			if(this.options.withAutorization.MRu !=null && this.options.withAutorization.MRu.apiId !=null){
				this.authStr += ' '+ 'authMRu';
				mailru.loader.require('api', function(){
					mailru.connect.init(_this.options.withAutorization.MRu.apiId, _this.options.withAutorization.MRu.key);
					mailru.events.listen(mailru.connect.events.login, function(session) {
						if(session.vid){						
							mailru.common.users.getInfo(function(user_list) {
									if(typeof user_list['error'] != 'undefined' && count==0){
										console.log('-');
										count++;
										mailru.connect.logout();
										setTimeout(function(){
											mailru.connect.login(['widget']);
										},2000);
									}else{
										console.log('+');
										count=0;
										_this.authInfoCallbackMRu(user_list,_this);
										_this.closeModalAuth();
									}
							}, session.vid);
						}
					});
					mailru.events.listen(mailru.connect.events.windowClose, function(session) {
						_this.showModal(_this.dataComments);
					});
					_this.redefineMailru();
				});
				/*with(document.getElementsByTagName('head')[0].appendChild(document.createElement('script'))){
					type = 'text/javascript';
					src = 'js/api.js';
				}*/
			}
		}else if (this.options.withAutorization === false){
			this.authStr += ' '+ 'authNO';
		}
	},
	redefineMailru:function(){
		mailru.connect.login=function(scope) {
				if (mailru.session && mailru.session.is_app_user) {
					mailru.events.notify(mailru.connect.events.login, mailru.session, mailru.utils.getCookie(mailru.def.CONNECT_COOKIE));
				} else {
					var popupParams = {
						app_id: mailru.app_id,
						host: 'http://' + mailru.def.DOMAIN
					}
					if (mailru.intercomType == 'flash') {
						popupParams.fcid = mailru.intercom.flash.params.fcid;
					}
					var scope = scope || '';
					try {
						scope = scope.join().match(/\w*/g).join(' ');
					} catch(e) {
						scope = scope.match(/\w*/g).join(' ')
					}
					var url = mailru.def.CONNECT_OAUTH + 'client_id=' + mailru.app_id + '&response_type=token&display=popup&redirect_uri=' + encodeURIComponent(mailru.def.PROXY_URL + 'app_id=' + mailru.app_id + '&login=1' + (popupParams.fcid ? '&fcid=' + popupParams.fcid : '') + (popupParams.host ? '&host=' + popupParams.host : '')) + '&' + mailru.utils.makeGet(popupParams) + '&' + mailru.utils.makeGet({scope: scope}) + (mailru.partner_id ? '&site_id=' + encodeURIComponent(mailru.partner_id) : '') + (mailru.isGame ? '&game=1' : '');
					var w = window.open(url, 'mrc_login', 'width=445, height=400, status=0, scrollbars=0, menubar=0, toolbar=0, resizable=1');
					if (mailru.isOpera) {
						window.onfocus = function() {
							if (!mailru.session.login) {
								window.onfocus = null;
								mailru.events.notify(mailru.connect.events.windowClose);
							}
						};
					} else {
						if (typeof w !== 'undefined' && w != null) {
							var tmr = setInterval(function() {
								if (w.closed) {
									clearInterval(tmr);
									mailru.events.notify(mailru.connect.events.windowClose);
								}
							}, 500);
						} else {
							if (!mailru.session.login) mailru.events.notify(mailru.connect.events.loginFail);
						}
					}

				}
			}	
	},
	authInfoCallbackFB:function(response,holder) {
		var _this;
		if(holder) _this = holder;else _this = this;
		FB.api('/me/picture', function(response) {
			if(response && response.data && response.data.url){
				FB.authObj = {};
				FB.authObj.photo = response.data.url;
				FB.api('/me', function(response) {
					_this.authObj ={
						"photo":FB.authObj.photo,
						"nick":response.name,
						"type":'Facebook',
						"uid":response.id
					}
					$(document).triggerHandler('authFB');
				});
			}
		});
	},
	authInfoCallbackVK:function(response,holder) {
		var _this = this;
		if (response.session) {
			VK.Api.call('users.get', {fields: 'uid, first_name, last_name, photo'}, function(r) {
				if(r.response != null && r.response[0] != null){
					VK.authObj = r.response[0];
					VK.authObj.name = VK.authObj.first_name +' '+ VK.authObj.last_name;
				}
				_this.authObj ={
						"photo":VK.authObj.photo,
						"nick":VK.authObj.name,
						"uid":VK.authObj.uid,
						"type":'VK'
						};
				$(document).triggerHandler('authVK');
			});
		} else {
			alert('not auth');
		}
	},
	authInfoCallbackMRu:function(response,holder) {
		var _this = holder;
		_this.authObj = {};
		_this.authObj.type = 'Mailru';
		_this.authObj.photo = response[0].pic;
		_this.authObj.nick = response[0].nick;
		_this.authObj.uid = response[0].uid;
		$(document).triggerHandler('authMRu');
	},
	getCommentObj:function(obj,parent){
		var url='',nick='',time='',id='',_this = this,text='';
		if(obj==null) return '';
		if(obj.img_url != null && obj.img_url != '') {url = obj.img_url;}else url ='img/avatar.gif';
		if(obj.id != null) id = obj.id;
		if(obj.nick != null) {
			nick = (obj.nick=='') ? 'Guest' : obj.nick;
		}
		if(obj.datatime != null) time = obj.datatime;
		if(obj.comment != null) text = obj.comment;
		if(parent==null){
			parent = $('<div/>').addClass('hs_message');
		}
		var photo_div = $('<div/>').addClass('hs_photo');
		var img = $('<img/>').addClass('hc_avatar').attr('src',url);
		$(photo_div).append(img);
		var comment_div = $('<div/>').addClass('comments_message');
		if( id != ''){
			$(comment_div).attr('comment',id);
		}
		var div = $('<div/>');
		var span_nick = $('<span/>').addClass('comments_nick').text(nick);
		var span_time = $('<span/>').addClass('comments_time').text(time);
		$(div).append(span_nick).append(span_time);
		var div_message = $('<div/>').addClass('message_text').text(text);
		var div_footer = $('<div/>').addClass('footer_link');
		var a = $('<a/>').addClass('reply_link').html('<div class="ic_reply_link"></div>Ответить').on('click',function(){
			var self = this;
			_this.clickReply(self);
		});
		$(div_footer).append(a);
		$(comment_div).append(div).append(div_message).append(div_footer);
		$(parent).append(photo_div).append(comment_div);
		return parent;
	},
	clickReply:function(self){
		var repl = $(self).parents('.comments_message');
		this.replNumbComment = parseInt($(repl).attr('comment'),10);
		this.messageNode.numberComment = parseInt($(repl).attr('comment'),10);
		this.messageNode.reference = $(repl).parent('.hs_message');
		this.showAuthWindow();
	},
	clickCommentBtnModulWnd: function(){
		this.showAuthWindow();
	},
	getCharPosition : function(el){
		var _this = this, sel, rng, r2, i= -1;
		var objSel = _this.getSelectedText();
			sel = objSel.obj;
			if(sel!=null){		
				rng = _this.createRangeFromSel(sel);
				if(_this.flagSuccessAddComent==true){
					_this.lastHTML = _this.getFullHTML();
					_this.flagSuccessAddComent=false;
				}
				if(rng){
					if(rng.parentElement) {
							r2=document.body.createTextRange();
							r2.moveToElementText(el);
							r2.collapse(true);
							r2.setEndPoint("EndToStart", rng);
							i = r2.text.length;
					}else{
						var obj;	
						if(rng.startContainer.nodeName != '#text' && rng.startContainer.previousSibling!=null){
							obj = rng.startContainer;
							_this.flagPreviousChild = false;
						}else{
							obj = rng.startContainer.previousSibling;
							_this.flagPreviousChild = true;
						}
						if(obj == null){	
							_this.flagPreviousChild = false;
							obj = rng.startContainer.parentNode;
						}
						var length = _this.getLengthTextToRangNode(_this.options.holder,obj);
						if(length == -1) return -1;
						if(
							rng.startContainer &&
							rng.endContainer 
						){
							i = rng.startOffset + length;
						}
					}
				}
			}
			return i;
	},
	highlightText:function(html, startPos, endPos){
		var newHtml = this.replaceText(html, startPos, endPos, this.options.cssSelected);
		if(newHtml !== false){
			this.removeAllRanges();
			this.setNewHTML(newHtml);
		}
	},
	clickCommentToolTip: function(){
		this.hideCommentToolTip();
		this.showModal(this.dataComments);
	},
	createCommentToolTip: function(left,top,id,text){
		var span,_this = this;
		text = text || 'Комментировать';
		if(!this.commentToolTip && left != null && top != null){
			this.commentToolTip = $('<span/>').addClass('hypertext_dialog_menus').css({top:top,left:left}).attr('data-parentid',id);
			span = $('<span/>').addClass('hypertext_add_text').text(text);
			$(this.commentToolTip).append(span).on('mousedown',function(event){
				_this.clickCommentToolTip();
			});
			$('body').append(this.commentToolTip);
			return true;
		}else
			return false;
	},
	showCommentToolTip: function(left,top,id){
		var _this = this;
		if(_this.commentToolTip!=null){
			if(top != null && left != null){
				$(_this.commentToolTip).attr('data-parentid',id).css({top:top,left:left}).fadeIn();
				_this.flagShowComment = true;
			}
		}
	},
	hideCommentToolTip:function(){
		var _this = this;
		if(_this.commentToolTip){
			$(_this.commentToolTip).fadeOut();
			_this.flagShowComment = false;
		}
	},
	freezeSelection: function(){
		var count,id,length=0,titleText='',obj={},_this = this;
		id = $(this.modal).attr('dataparentid');
		var numberBlock = $('#'+id);
		if(numberBlock.text()==''){
			count = this.getLengthObj(this.arrObjComment)+1;
			length = this.dataComments.selectedtext.length; 
			if(length > _this.MAX_TITLE_SYMBOL){
				titleText = this.dataComments.selectedtext.substr(0,_this.MAX_TITLE_SYMBOL)+
					'<span style="cursor:pointer;" title="'+this.dataComments.selectedtext+'" >...</span>';
			}else
				titleText = this.dataComments.selectedtext;
			obj[count]={
				startPos:this.startPos,
				endPos:this.endPos,
				selectedtext:titleText,
				id:this.dataComments.idcomment
			};
			$.extend(this.arrObjComment, obj);	
			numberBlock.text(count);
			$('.'+this.options.cssSelected).addClass(this.options.cssCommented).removeClass(this.options.cssSelected);
			this.lastHTML = null;
			this.resetHTML = this.getFullHTML();
			this.flagSuccessAddComent=true;
		}
	},
	bindEvents: function(){
		var left, top, _this = this;;
		$(document).bind('vk_close',function(){
			_this.closeModalAuth();
		});
		$(document).bind(_this.authStr,function(event){//authorization events
			_this.authObj.text = $.trim($(_this.textarea).val());
			_this.freezeSelection();
			_this.addComments(_this.authObj,_this.messageNode);
		});
		$(document).bind('mouseup',function(e){
			if($(e.target).hasClass('.setCommentClass') || $(e.target).closest('.setCommentClass').length > 0){
				if(_this.flagClickCommented === true){
					var self = $(e.target).closest('.setCommentClass').get(0);
					if($(e.target).hasClass(_this.options.cssSelected)===false){
						var newPos, titleText, flagNoMove, objTegs, obj = _this.getMousePosition(e);
						var leftUp = obj.left;
						var topUp = obj.top;
						if(leftUp==left && topUp==top){
							flagNoMove=true;
						}			
						obj = _this.getSelectedText();
						_this.dataComments.selectedtext = obj.text;	
						var startPosition = _this.getCharPosition(self);
						var endPosition = startPosition + obj.text.length;
						if(_this.options.flagFullWords === true){
							newPos = _this.getFullWordsPositions(startPosition,endPosition,_this.fulltext);	
							startPosition = newPos.start;
							endPosition = newPos.end;
							_this.dataComments.selectedtext = _this.fulltext.slice(startPosition,endPosition);
						}
						if(startPosition != -1){
							objTegs = _this.getArrTags(_this.fullhtml);
							_this.startPos = _this.getPositionHtmlFromText(objTegs, startPosition);
							_this.endPos = _this.getPositionHtmlFromText(objTegs, endPosition);
							_this.highlightText(_this.fullhtml, _this.startPos, _this.endPos);
						}
					}else{
						return false;
					}
				}
			}else{
				if($(e.target).closest('.hypertext_add_text').length == 0 
					&& $(e.target).closest('.modal').length == 0 
					&& $(e.target).is('.modal-backdrop')===false){
						_this.setNewHTML(_this.resetHTML);
						_this.hideCommentToolTip();
				}
			}
		});
		$(document).bind('mousemove',function(event){
			if(typeof _this.modal !='undefined' && typeof _this.modal.flagmove !='undefined' 
				&& _this.modal.flagmove == true){
					_this.mouseMoveModal(event,_this.modal);
			}
			if(typeof _this.modalAuth !='undefined' && typeof _this.modalAuth.flagmove !='undefined' 
				&& _this.modalAuth.flagmove == true){
					_this.mouseMoveModal(event,_this.modalAuth);
			}
		});
		$(this.options.holder).bind('mousedown',function(e){
			if($(e.target).hasClass(_this.options.cssCommented)===false){
				_this.flagClickCommented = true;
				var obj,self = $(this).get(0);
					_this.hideCommentToolTip();
					_this.fullhtml = _this.lastHTML || _this.getFullHTML();
					_this.fulltext = _this.getFullText();
					_this.prepare(self);
					obj = _this.getMousePosition(e);
					left = obj.left;
					top = obj.top;
			}else{
				_this.setNewHTML(_this.resetHTML);
				_this.hideCommentToolTip();
				_this.flagClickCommented = false;
				self = e.target;
				_this.clickCommentedField(self,_this.getAjaxDataObj,{holder:_this, callback:_this.getAllComments});
			}
		});
		$('.'+this.options.cssSelected).live('hover',function(event){
			var id = $(this).attr('data-parentid');
			_this.dataComments.idcomment = id;
			var obj = _this.getMousePosition(event);
			if($(this).hasClass('active_comments')===false){
				if(_this.createCommentToolTip(obj.left, obj.top + 10, id) == false && _this.flagShowComment == false){
					_this.showCommentToolTip(obj.left, obj.top + 10, id);
				}
			}else{
				_this.showModal(_this.dataComments);
			}
		});
	},
	showAuthWindow:function(){
		var obj,_this = this,val = $.trim($(this.textarea).val());
		if(val != ''){
			if(this.options.withAutorization==false){
				this.authObj ={
						"photo":'',
						"nick":'Guest'
					};
				$(document).triggerHandler('authNO');
			}else{
				this.hideModal(true);
				this.showModalAuth();
			}
		}else{
			alert('Text field can not be empty!');
		}
	},
	addComments:function(objInput,parent){
		var length,count,text = '',nick='',photo='',obj = {};
		if(this.data == null){
			this.data = {};
		}
		length = this.getLengthObj(this.arrObjComment) || 0;
		count = this.getLengthObj(this.data)||0;
		count++;
		if(objInput!=null){
			if(objInput.text!=null) text = objInput.text;
			if(objInput.photo!=null && objInput.photo!='') {
				photo = objInput.photo;
			}else{ 
				photo = '';
			}	
			if(objInput.nick!=null) 
				nick = objInput.nick;
		}
		obj = {
			"nick" : nick,
			"img_url" : photo,
			"datatime" : "",
			"comment" : text,
			"id":parent.numberComment
		};
		obj.startPos = this.arrObjComment[length]['startPos'];
		obj.endPos = this.arrObjComment[length]['endPos'];
		this.sendObjCommentsAjax(obj,count,parent);
	},
	recursiveExtendReply:function(obj,id,addObjReply){
		var object2={},resObj={},_this=this;
			(function getCommentRecur(obj,id){
			    var key,length;
				for(key in obj){
					if(obj &&  obj[key] && $.isEmptyObject(resObj)==true){
						if(id && obj[key]['id']==id ){
						  if(obj[key]['reply']==null){
						      obj[key]['reply'] = {"1":addObjReply};
						  }else{
							length = _this.getLengthObj(obj[key]['reply']);
                            if(length==0){
								obj[key]['reply']={};
								obj[key]['reply'][+length+1] = addObjReply;
                            }else
                                obj[key]['reply'][+length+1] = addObjReply;  
						  }
						}else{
						  getCommentRecur(obj[key]['reply'],id);
						}
					}
				}
			})(obj,id);
	},
	addCommentsDOM: function(obj,parent){
		var _this=this, comment = this.getCommentObj(obj);
		if(parent!=null && parent.reference!=null){
			$(parent.reference).append(comment);
			parent.reference = null;
			var id = parent.numberComment;
			_this.recursiveExtendReply(_this.data,id,obj);
		}else{
			if(this.allComments!=null){
				if($.isEmptyObject(_this.data)){
					_this.data[0] = obj;
				}else{
					var length = _this.getLengthObj(_this.data);
					var object2={};
					object2[length]= obj;
					_this.data = $.extend({},_this.data, object2);
				}
				$(this.allComments).append(comment);
			}else{
				if($.isEmptyObject(_this.data)){
					_this.data[0] = obj;
				}
				this.getAllComments(_this.data);
			}			
		}
		this.messageNode = {};
	},
	sendObjCommentsAjax:function(obj,count,parent){
		var _this = this,type='POST';
		if(this.options!=null && this.options.urlCommentsWrite!=null && this.options.urlCommentsRead!=null){
			var url = this.options.urlCommentsWrite;
		}
		if(obj.id==null || obj.id==''){
			obj.id = $(this.modal).attr('dataparentid');
		}
		if($.isEmptyObject(_this.data)){//т.е. модальное окно чистое,комментариев нет
			obj['selectedtext'] = this.dataComments['selectedtext'];
		}
		if($.isEmptyObject(parent)===false){//т.е. клик был по - reply
			type='PUT';
			url = this.options.urlReplyWrite;
		}
		var data = 'json=' + $.toJSON(obj) + '&idClient=' + _this.idClient + '&flagModal=' + _this.objModal.flagShowModal;
		$.ajax(url,{
					dataType: 'json',
					type:type,
					data:data,
					success: function(res){
						obj['id'] = res['id'];
						obj['parentid'] = res['parentid'];
						obj['datatime'] = res['datatime'];
						_this.addCommentsDOM(obj,parent);
					}
		});
	},
	clickCommentedField:function(clickfield,callback,paramObj){
		var count,id = $(clickfield).attr('data-parentid');
		this.dataComments.idcomment = id;
		count = parseInt($('#'+id).text());
		this.dataComments.selectedtext = this.arrObjComment[count]['selectedtext'];
		this.hideCommentToolTip();
		this.showModal(this.dataComments,callback,paramObj);
	},
	mouseDownModal:function(event,objModal){
		var el = event.target,obj={};
		if($(el).hasClass('modal_title')===true || $(el).parent().hasClass('modal_title')===true ||
			$(el).hasClass('modal-header')===true){	
			objModal.flagmove = true;
			obj = this.getMousePosition(event);
			objModal.mouseTop = obj.top;
			objModal.mouseLeft = obj.left;
			obj = this.getBlockPosition(objModal);
			objModal.top = obj.top;
			objModal.left = obj.left;
		}
	},	
	mouseMoveModal:function(event,objModal){
		var obj = {};
		if(objModal.flagmove!=null && objModal.flagmove === true ){
			this.removeSelection();
			obj = this.getMousePosition(event);
			var top = obj.top - objModal.mouseTop;
			var left = obj.left - objModal.mouseLeft;
			obj.top = objModal.top + top;
			obj.left = objModal.left + left;
			this.setBlockPosition(objModal,obj);
		}
	},
	mouseUpModal:function(event,objModal){
		var el = event.target;
		if($(el).hasClass('modal_title') || $(el).hasClass('modal-header')){
			objModal.flagmove = false;
		}
	},
	createVKbtn: function(holder){
		var _this;
		if(holder) _this = holder; else _this = this;
		var blockVK = $('<div/>').addClass('auth_type_bt').click(function(){
				_this.hideModalAuth(true);
				VK.Auth.login(function(response){
					_this.authInfoCallbackVK(response,_this);
					//_this.closeModalAuth();
				});
			});
		var btnVK = $('<div/>').addClass('auth_type_bt_vk');
		var btnTitleVK=$('<div/>').addClass('auth_type_bt_title').text('ВКонтакте');
		$(blockVK).append(btnVK).append(btnTitleVK);
		return blockVK;
	},
	createMRUbtn: function(holder){
		var _this;
		if(holder) _this = holder; else _this = this;
		var blockMRu = $('<div/>').addClass('auth_type_bt').click(function(){
			_this.hideModalAuth(true);
			mailru.connect.login(['widget']);
		});
		var btnMRu = $('<div/>').addClass('auth_type_bt_mru');
		var btnTitleMRu=$('<div/>').addClass('auth_type_bt_title').text('Mail.ru');
		$(blockMRu).append(btnMRu).append(btnTitleMRu);
		return blockMRu;
	},
	createODNbtn: function(holder){
		var _this;
		if(holder) _this = holder; else _this = this;
		var blockOdn = $('<div/>').addClass('auth_type_bt').click(function(){
			/*_this.hideModalAuth(true);});*/
			//Not yet implement
		});
		var btnOdn = $('<div/>').addClass('auth_type_bt_odn');
		var btnTitleOdn=$('<div/>').addClass('auth_type_bt_title').text('Одноклассники');
		$(blockOdn).append(btnOdn).append(btnTitleOdn);
		return blockOdn;
	},
	createFBbtn: function(holder){
		var _this,flagOpenDialog=false;
		if(holder) _this = holder; else _this = this;
		var blockFB = $('<div/>').addClass('auth_type_bt').click(function(){
			_this.hideModalAuth(true);
			FB.getLoginStatus(function(response) {
				flagOpenDialog=true;
				if (response.status === 'connected') {
					_this.authInfoCallbackFB(response,_this);
					_this.closeModalAuth();
				} else if (response.status === 'not_authorized') {
					// the user is logged in to Facebook, but has not authenticated your app
					alert('Your app has not authenticated');
				} else {
					// the user isn't logged in to Facebook.
					FB.login(function(response) {
						if (response.authResponse) {
							_this.authInfoCallbackFB(response,_this);
						}	
						_this.closeModalAuth();
					});
				}
			});
			setTimeout(function(){
				if(flagOpenDialog===false)
					_this.closeModalAuth();
			},2000);
		});
		var btnFB = $('<div/>').addClass('auth_type_bt_fb');
		var btnTitleFB=$('<div/>').addClass('auth_type_bt_title').text('Facebook');
		$(blockFB).append(btnFB).append(btnTitleFB);
		return blockFB;
	},
	createModalAuth: function(){
		var _this=this;
		if(this.modalAuth == null){
			this.modalAuth = $('<div/>').attr({'id':'modal_auth'}).addClass('modal').css('display','none')
				.bind({ 'mousedown': function(event){_this.mouseDownModal(event,_this.modalAuth)},
						'mouseup':  function(event){_this.mouseUpModal(event,_this.modalAuth)}
				});
			var modalHeader = $('<div/>').addClass('modal-header');
				var button = $('<div/>').addClass('close action_close').bind('click',function(event){
					_this.closeModalAuth();
				});
				this.modalTitleAuth = $('<div/>').addClass('modal_title').text('Метод авторизации');
				$(modalHeader).append(button).append(this.modalTitleAuth);
			var modalBody = $('<div/>').addClass('modal-body');
				if(typeof _this.options.withAutorization!='undefined' && $.type(_this.options.withAutorization)=='object'){
					if( _this.options.withAutorization.VK !=null 
					&& _this.options.withAutorization.VK.apiId !=null){
						var blockVK = _this.createVKbtn(_this);
						$(modalBody).append(blockVK);
					}
					if( _this.options.withAutorization.FB !=null 
					&& _this.options.withAutorization.FB.apiId !=null){
						var blockFB = _this.createFBbtn(_this);
						$(modalBody).append(blockFB);
					}
					if( _this.options.withAutorization.MRu !=null 
					&& _this.options.withAutorization.MRu.apiId !=null){
						var blockMRu = _this.createMRUbtn(_this);
						$(modalBody).append(blockMRu);
					}
				}
				$(this.modalAuth).append(modalHeader).append(modalBody);//.append(modalFooter);
				$('body').append(this.modalAuth);
				if(typeof this.backdrop=='undefined'){ 
					this.backdrop = $('<div/>').addClass('modal-backdrop');
					$('body').append(this.backdrop);
				}
			return true;
		}else{
			return false;
		}
	},
	createModal: function(obj){
		var _this=this;
		if(obj !=null && obj.selectedtext != null) {
			title = obj.selectedtext;
		}else 
			title ='';
		if(obj !=null && obj.idcomment != null) {
			dataParentId = obj.idcomment;
		}else 
			dataParentId ='';
		var lengthText = title.length;
		if(lengthText > _this.MAX_TITLE_SYMBOL){
			titleText = title.substr(0,_this.MAX_TITLE_SYMBOL)+
				'<span style="cursor:pointer;" title="'+title+'" >...</span>';
		}else 
			titleText = title;
			
		if(this.modal == null){
			this.modal = $('<div/>').attr({'id':'modal_comments','dataparentid':dataParentId}).addClass('modal').css('display','none')
				.bind({ 'mousedown': function(event){_this.mouseDownModal(event,_this.modal)},
						'mouseup':  function(event){_this.mouseUpModal(event,_this.modal)}
				});
			var modalHeader = $('<div/>').addClass('modal-header');
			var button = $('<div/>').addClass('close action_close').bind('click',function(event){
				_this.closeModal();
			});
				this.modalTitle = $('<div/>').addClass('modal_title').html(titleText);
				$(modalHeader).append(button).append(this.modalTitle);
			var modalBody = $('<div/>').addClass('modal-body');
				this.div_anim = $('<div/>').addClass('hc_loading').css('display','none');
				this.container = $('<div/>').addClass('container_comments');
				var containerDiv = $('<div/>').addClass('textarea_outer');
				var img = $('<div/>').addClass('img');
				this.textarea = $('<textarea/>').addClass('textarea');
				$(containerDiv).append(img).append(this.textarea);
				$(this.container).append(containerDiv);
				$(modalBody).append(this.div_anim).append(this.container);
				var modalFooter = $('<div/>').addClass('modal-footer');
				var a1 = $('<div/>').addClass('btn action_commented').text('Комментировать').on('click', function(){
						_this.clickCommentBtnModulWnd();
					});
				$(modalFooter).append(a1);//.append(a2);
				$(this.modal).append(modalHeader).append(modalBody).append(modalFooter);
				$('body').append(this.modal);
				if(typeof this.backdrop=='undefined'){ 
					this.backdrop = $('<div/>').addClass('modal-backdrop');
					$('body').append(this.backdrop);
				}
			return true;
		}else{
			$(this.modalTitle).html(titleText);//.text(title);
			$(this.modal).attr({'dataparentid':dataParentId});	
			return false;
		}
	},
	hideModalAuth: function(flagHideBack){
		$(this.modalAuth).fadeOut();
		if($(this.backdrop).is(':visible')==true && (flagHideBack==null || flagHideBack===false)){
			$(this.backdrop).fadeOut();
		}
	},
	closeModalAuth:function(){
		var _this = this;
		_this.hideModalAuth(true);
		_this.showModal(_this.dataComments);
	},
	closeModal:function(){
		this.hideModal();
		$(this.allComments).empty();
		$(this.textarea).val('');
		this.data={};
		this.objModal.flagShowModal = false;
	},
	showAnimateModal: function(){
		$(this.container).css('display','none');	
		$(this.div_anim).css('display','block');
	},
	hideAnimateModal: function(){
		$(this.container).css('display','block');	
		$(this.div_anim).css('display','none');
	},
	showModalAuth: function(){
		this.createModalAuth();
		$(this.modalAuth).fadeIn();
		if($(this.backdrop).is(':visible')==false){
			$(this.backdrop).fadeIn();
		}
	},
	showModal: function(obj,funcGetData,paramsObj){
		this.createModal(obj);
		$(this.modal).fadeIn();
		if($(this.backdrop).is(':visible')==false){
			$(this.backdrop).fadeIn();
		}
		if(funcGetData!=null && typeof funcGetData =='function' && paramsObj!=null){
			this.showAnimateModal();
			funcGetData(paramsObj);
		}
		this.objModal.flagShowModal = true;
	},
	hideModal: function(flagHideBack){
		$(this.modal).fadeOut();
		if($(this.backdrop).is(':visible')==true && (flagHideBack==null || flagHideBack===false)){
			$(this.backdrop).fadeOut();
		}
	},
	getMousePosition: function(event){
		var top = event.pageY;
		var left = event.pageX;
		return {top:top, left:left}
	},
	getBlockPosition: function(el){
		var top = $(el).offset().top;
		var left = $(el).offset().left;
		return {top:top, left:left}
	},
	setBlockPosition: function(block,obj){
		if(obj != null && obj.top != null){
			$(block).css('top',obj.top);
		}
		if(obj != null && obj.left != null){
			$(block).css('left',obj.left);
		}
	},
	getLengthTextToRangNode: function(parent,rngNode,atrObj){
		var html,text,pos, 
			st = '', 
			length = 0,
 			lengthInMarkerNode = 0, 
			_this = this;
		try{
			rngNode.setAttribute('marker','%marker%');
		}catch(error){
			return -1;
		}
		html = $(parent).html();
		text = $(parent).find('[marker="%marker%"]').text();
		if(typeof text != 'undefined' && _this.flagPreviousChild===true){
			lengthInMarkerNode = text.length;
		}
		pos = html.search('%marker%');
		st = html.slice(0,pos);
		pos = st.lastIndexOf('<');
		st = html.slice(0,pos);
		st = this.removeTags(st);
		return  st.length + lengthInMarkerNode;
	},
	getFullWordsPositions: function(start,end,text){
		var res={};
		var length = text.length;
		var beginStr = text.slice(0,start);
		var lengthBeginStr = beginStr.length;
		var lengthInner = text.slice(start,end).length;
		var endStr = text.slice(end,length);
		res.start = beginStr.lastIndexOf(' ')+1;
		res.end = endStr.search(' ') + lengthBeginStr + lengthInner;
		return res;
	},
	getPositionHtmlFromText: function(objTegs,position){
		var key,
			res = 0;
		for(key in objTegs){
			if(objTegs[key] && objTegs[key]['lengthTag'] != null 
			   && objTegs[key]['position']!=null 
			   && objTegs[key]['position'] <= position
			 ){
				res += objTegs[key]['lengthTag'];
			}
		}
		return res + position;
	},
	removeAllRanges: function(){
		if ( window.getSelection ) {
			window.getSelection().removeAllRanges();
		} else if ( document.getSelection ) {
			document.getSelection().clear();
		} 
	},
	getSelectedText: function(){
		var ie = false,
			selectedText,
			text;
		if ( window.getSelection ) {
			selectedText = window.getSelection();
		} else if ( document.getSelection ) {
			selectedText = document.getSelection();
		} else if ( document.selection ) {
			ie = true;
			selectedText = document.selection;
		}
		if(!ie){
			text = selectedText.toString();
		}else{
			text = selectedText.createRange().text;
		}
		return {text:text,obj:selectedText};
	},
	createRangeFromSel: function(sel){
		var rng=null;
		if(sel.createRange) {
			rng=sel.createRange();
		} else if(sel.getRangeAt) {
				rng=sel.getRangeAt(0);
		}
		return rng;
	},
	getArrTags: function(str){
		var arr=[];
		function getTagRecur(st,length){
			var obj={};
			var  position;
			length = length || 0 ;
			var start = st.search('<');
			var end = st.search('>');
			if(start == -1){
				return arr;
			}else{
				obj.tag = st.substring(start , end + 1);
				obj.lengthTag = end - start +1;
				var cutLength = st.slice(0,start).length;
				obj.position = cutLength + length;
				st = st.slice(end+1);
				arr.push(obj);
				getTagRecur(st,obj.position);
			}
		}
		getTagRecur(str);
		return arr;
	},
	removeTags : function(str){
		return str.replace(/(<.*?>)/g,'');
	},
	replaceText: function(fullhtml, start, end, className, objComment){
		var newText='',url,res, findTxt,id, _this = this;
		if(objComment!=null && objComment.index != null){
			_this.countComment = objComment.index;//0;
		}else
			_this.countComment = '';
		function getContent(id){
			findTxt = fullhtml.slice(start, end);
			var pos = findTxt.search(_this.options.cssCommented);
			if(pos != -1){
				_this.setNewHTML(_this.resetHTML);
				_this.hideCommentToolTip();
				return;
			}
			var st1 = '</span>';
			var st2 = '<span class="' + className + '" data-parentid="'+ id + '">';
			findTxt = findTxt.replace(/(<.*?>)/g,st1 + '$1' + st2);	
			newText = fullhtml.slice(0,start) + '<span class="' + className +'" data-parentid="'+ id + '">' 
					  + findTxt + '</span>' + '<span class="hypertext_counter_span" id="'+ id + '">'
					  +_this.countComment+'</span>' + fullhtml.slice(end,fullLength);
			return newText;
		}	
		if(fullhtml && start && end){
			var fullLength = fullhtml.length;
			if(objComment!=null && objComment.id != null){
				id = objComment.id;
				var res = getContent(id);
				return res;
			}else{
				url = _this.options.maxComment;
				if(_this.options.maxAjax==true){
					$.ajax(url,{
						dataType: 'json',
						type:'GET',
						async: false,
						success: function(data){
							res = getContent(data[0]['id']*1+1);
						}
					});
				}else{
					var arr = [];
					$('.hypertext_counter_span').each(function(){
						arr.push($.trim($(this).text()));
					});
					id =(arr.length > 0) ? window.Math.max.apply({},arr) : 0;
					data = [{'id':id}];
					res = getContent(data[0]['id']*1+1);
				}
				return res;
			}
		}else
			return false;
	},
	getFullHTML: function(){
		return $(this.options.holder).html();
	},
	getFullText: function(){
		return $(this.options.holder).text();
	},
	setNewHTML: function(newHtml){
		$(this.options.holder).html(newHtml);
	}
}
$(document).ready(function() {
	$('#testDiv').setComment({	cssSelected:'selected',
								cssCommented:'commented',
								withAutorization:{
									'VK':{apiId:'3363455'},
									'FB':{apiId:'760989390581149'},
									//'Odn':{apiId:'1'},
									'MRu':{apiId:'710869',
										  key:'c4ceae589a03fb9cc65c78f394b78a10'}
								},
								//maxAjax:false,
								/*maxComment:'api/db/MaxComment/.json',*/
								urlCommentsRead:'api/db/comments/.json',
								urlCommentsWrite:'api/db/Comment/.json',
								urlReplyWrite:'api/db/Reply/.json',
								urlSelectedRead:'api/db/selectedBlock/.json',
								urlComet:"api/db/Count//.json"
								});
});