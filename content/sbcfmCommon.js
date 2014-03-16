var sbcfmCommon = {
Branch : Components.classes["@mozilla.org/preferences-service;1"]
    		.getService(Components.interfaces.nsIPrefService).getBranch("extensions.sbconforming."),
eTLDService : Components.classes["@mozilla.org/network/effective-tld-service;1"]
				.getService(Components.interfaces.nsIEffectiveTLDService),
get regExpList() {
	var regExpList = this.Branch.getCharPref("regExpList");
	if(!regExpList) regExpList = " ";
/*
	regExpList = regExpList.split(" ");
	for(var i=0; i<regExpList.length; i++){
		regExpList[i] = regExpList[i].split(",");
	}
	*/
	return regExpList;
},
set blackList(q) {
	this.Branch.setCharPref("blackList", q);
},
get blackList() {
	var blackList = this.Branch.getCharPref("blackList");
	if(!blackList) blackList = " ";
/*
	regExpList = regExpList.split(" ");
	for(var i=0; i<regExpList.length; i++){
		regExpList[i] = regExpList[i].split(",");
	}
	*/
	return blackList;
},
set regExpList(q) {
	this.Branch.setCharPref("regExpList", q);
},
get textBoxNameList() {
	var textBoxNameList = this.Branch.getCharPref("textBoxNameList");
	if(!textBoxNameList) textBoxNameList = " ";
/*
	textBoxNameList = textBoxNameList.split(" ");
	for(var i=0; i<textBoxNameList.length; i++){
		textBoxNameList[i] = textBoxNameList[i].split(",");
	}
	*/
	return textBoxNameList;
},
set textBoxNameList(q) {
	this.Branch.setCharPref("textBoxNameList", q);
},
setTextBoxNames : function(tld, name){
	var textBoxNameList = sbcfmCommon.textBoxNameList;
	if(textBoxNameList.indexOf(" "+tld+",")>-1){
		sbcfmCommon.textBoxNameList = textBoxNameList.replace(" "+tld+",", " "+tld+","+name+",");
	}
	else{
		sbcfmCommon.textBoxNameList = textBoxNameList +tld+","+name+", ";
	}
},
removeTextBoxNames : function(tld, name){
	var textBoxNameList = sbcfmCommon.textBoxNameList;
	var re = new RegExp("( "+tld+",[^ ]*,?)"+name+",")
	var matched = textBoxNameList.match(re);
	
	sbcfmCommon.textBoxNameList = textBoxNameList.replace(matched[0],matched[1]).replace(" "+tld+", "," ");
	 
}, 
trim : function(term){
	return term.replace(/^\s+|\s+$/g, '');
}
}
