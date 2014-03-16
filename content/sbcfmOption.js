var sbcfmOption={
canClose : true,
strbundle : document.getElementById("sbcfm-pref-bundle"),
Init: function(){
	var extTextBoxes = document.getElementById("extTextBoxes");
	extTextBoxes.value = sbcfmCommon.Branch.getCharPref("extTextBoxes").replace(/\s/g,"\n") +"\n";	

	var itemList = sbcfmOption.getItemList();
  itemList.sort();

	for(var i=0; i<itemList.length; i++){
		var tmp = itemList[i].indexOf(",");
		var baseDomain = itemList[i].substring(0,tmp);
		var regExps = itemList[i].substring(tmp+1);
		sbcfmOption.addNewItemToList(baseDomain, regExps);
	}
	
	var blackList = sbcfmOption.getArrayBlackList();
	for(var i=0; i<blackList.length; i++){
		sbcfmOption.addItemToBlackList(blackList[i]);	
	}
	
	return;
},
getItemList : function(){
	var itemList = sbcfmCommon.regExpList.split(" ");
	itemList.shift();
	itemList.pop();
/*	for(var i=0; i<itemList.length; i++){
		itemList[i] = itemList[i].split(",");
	}*/
	return itemList;
},
getArrayBlackList : function(){
	var blackList = sbcfmCommon.blackList.split(" ");
	blackList.shift();
	blackList.pop();

	return blackList;	
},
addNewItem : function(){
	var baseDomainTextbox = document.getElementById("pref.general.baseDomain");
	var regExpTextbox = document.getElementById("pref.general.regexp");
	var baseDomain = sbcfmCommon.trim(baseDomainTextbox.value);
	var regexp = sbcfmCommon.trim(regExpTextbox.value);
	try{
		baseDomain = sbcfmCommon.eTLDService.getBaseDomainFromHost(baseDomain);
	}catch(ex){
	}
	if(!baseDomain || !regexp) return;
  baseDomain = baseDomain.replace(/\s/g, "");
  regexp = regexp.replace(/\s/g, "%20");

	if(sbcfmCommon.regExpList.indexOf(" "+baseDomain+ "," )>-1){
		var re = new RegExp(" "+baseDomain+",[^ ]+ ", "i");
		sbcfmCommon.regExpList = sbcfmCommon.regExpList.replace(re , " "+baseDomain+ "," +regexp+" ");
		sbcfmOption.editItem(baseDomain,regexp);
	}
	else{
		sbcfmCommon.regExpList = sbcfmCommon.regExpList+baseDomain+ "," +regexp+" ";
		sbcfmOption.addNewItemToList(baseDomain, regexp);	
	}

	baseDomainTextbox.value = "";
	regExpTextbox.value = "";
	
	sbcfmOption.toggleAddButton("add");	
},
addNewItemToList : function(baseDomain, regExp){
	var itemListBox = document.getElementById("pref.general.itemList");
	var listitem = document.createElement("listitem");
	//alert(listitem.childNodes.length);
	var baseDomainCell = document.createElement("listcell");
	baseDomainCell.setAttribute("label",baseDomain);
	listitem.appendChild(baseDomainCell);

	var regExpCell = document.createElement("listcell");
	regExpCell.setAttribute("label",regExp);
	listitem.appendChild(regExpCell);
	
	itemListBox.appendChild(listitem);
	
	return;
},
editItem : function(baseDomain, regExp){
	var itemListBox = document.getElementById("pref.general.itemList");
	for(var i=0; i<itemListBox.childNodes.length; i++){
		var listitem = itemListBox.childNodes[i];
		var baseDomainCell = listitem.childNodes[0];
		if(baseDomainCell.getAttribute("label")==baseDomain){
			var regExpCell = listitem.childNodes[1];
			regExpCell.setAttribute("label",regExp);
			break;
		}
	}
	return;	
},
listDelete : function(list){
	var lb = document.getElementById(list);
	var deletedItem = lb.selectedItem;

	var idx = lb.currentIndex;
	if(idx==-1) return;
	
	var baseDomain = deletedItem.childNodes[0].getAttribute("label");
	var re = new RegExp(" "+baseDomain+",[^ ]+ ", "i");
	sbcfmCommon.regExpList = sbcfmCommon.regExpList.replace(re , " ");
	
	lb.removeItemAt(idx);
	if(idx==lb.itemCount) idx-=1;
	setTimeout(function(){lb.selectedIndex = idx},50);

	var baseDomainTextbox = document.getElementById("pref.general.baseDomain");
	var regExpTextbox = document.getElementById("pref.general.regexp");

	baseDomainTextbox.value = "";
	regExpTextbox.label = "";
	
	sbcfmOption.toggleAddButton("add");
	
	return;
},
itemListSelected : function(){
	var listbox = document.getElementById("pref.general.itemList");
	var selectedItem = listbox.selectedItem;
	var baseDomain = selectedItem.childNodes[0].getAttribute("label");
	var regExp = selectedItem.childNodes[1].getAttribute("label");
	
	document.getElementById("pref.general.baseDomain").value = baseDomain;
	document.getElementById("pref.general.regexp").value = regExp;
	
	sbcfmOption.toggleAddButton("edit");
},
baseDomainEdited : function(){
	var baseDomain = sbcfmCommon.trim(document.getElementById("pref.general.baseDomain").value);

	if(sbcfmOption.isRegistered(baseDomain, sbcfmCommon.regExpList)) var word = "edit";
	else var word = "add";

	sbcfmOption.toggleAddButton(word);	
},
addBlackList : function(){
	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
	var mainWindow = wm.getMostRecentWindow("navigator:browser");
	var br = mainWindow.getBrowser();

	var newUri = prompt("", br.currentURI.prePath);
	if(!newUri) return;
	
	sbcfmCommon.blackList = sbcfmCommon.blackList+newUri+" ";
	sbcfmOption.addItemToBlackList(newUri);
	
	//sbcfmOption.strbundle
	
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]  
                              .getService(Components.interfaces.nsIIOService);  
    var newNsIURI = ioService.newURI(newUri, null, null);  
	
	try{
		var tld = sbcfmCommon.eTLDService.getBaseDomain(newNsIURI);
	}catch(ex){
		var tld = "";
	}
	if(!tld) return;
	
	var listbox = document.getElementById("pref.general.itemList");
	var listitems = listbox.getElementsByTagName("listitem");
	for(var i=0; listitems.length; i++){
		var baseDomain = listitems[i].childNodes[0].getAttribute("label");
		if(baseDomain==tld){
			listbox.selectedIndex = i;
			sbcfmOption.listDelete('pref.general.itemList');
			break;
		}
	}	
		
	return;	
},
addItemToBlackList : function(newUri){
	var itemListBox = document.getElementById("pref.blackList.listbox");
	var listitem = document.createElement("listitem");
	listitem.setAttribute("label", newUri);
	
	itemListBox.appendChild(listitem);
	return;
},
deleteBlackList : function(){
	var lb = document.getElementById("pref.blackList.listbox");
	var idx = lb.currentIndex;
	if(idx==-1) return;

	var deletedItem = lb.selectedItem;
	
	var uri = deletedItem.getAttribute("label");
	sbcfmCommon.blackList = sbcfmCommon.blackList.replace(" "+uri+" ", " ");
	
	lb.removeItemAt(idx);
	
	return;	
},
isRegistered : function(baseDomain, itemList){
	if(!baseDomain) return false;
	return (itemList.indexOf(" "+baseDomain+",")>-1)	
},
toggleAddButton : function(word){
	var addButton = document.getElementById("pref.general.addNewItem");
	word = sbcfmOption.strbundle.getString(word);
	addButton.label = word;	
},
onKeyPress : function(event){
	if(event.keyCode != event['DOM_VK_RETURN']) return;
	sbcfmOption.canClose = false;
	sbcfmOption.addNewItem();

	var itemListBox = document.getElementById("pref.general.itemList");
	itemListBox.focus();
	setTimeout(function(){sbcfmOption.canClose=true},100);
},
onDialogAccept : function(){
	return sbcfmOption.canClose;
},
setExternalTextBoxes : function(){
	var extTextBoxes = document.getElementById("extTextBoxes").value;
	extTextBoxes = sbcfmCommon.trim(extTextBoxes.replace(/\n/g," ").replace(/\s+/g," "));
	sbcfmCommon.Branch.setCharPref("extTextBoxes", extTextBoxes);
}
}
