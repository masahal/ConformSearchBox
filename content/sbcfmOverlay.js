//import('lib/WindowManager.js');

var sbcfmOverlay = {
//_statusTextField : null,
//recoverStatusTextID : null,
chars : "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/",
preSelectedTab : null,
searchbox : null,
init: function() {
	// ウェブページのロードをリスンする。
	gBrowser.addProgressListener(sbcfmUrlBarListener,
		Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
	var menu = document.getElementById("contentAreaContextMenu");
	menu.addEventListener("popupshowing", sbcfmOverlay.contextPopupShowing, false);
    
  var ObserverService = Cc['@mozilla.org/observer-service;1']
                        .getService(Ci.nsIObserverService);
  var observer = {
    observe: function(aSubject, aTopic, aData){
      if (aTopic == 'sessionstore-windows-restored') setTimeout(function(){
        ObserverService.removeObserver(observer, 'sessionstore-windows-restored', false);

        var container = gBrowser.tabContainer;
        container.addEventListener("TabOpen", sbcfmOverlay.getSearchWordOfParentTab, false);
      }, 1500);
    }
  }
  ObserverService.addObserver(observer, 'sessionstore-windows-restored', false);

  var file = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
  file.append("formhistory.sqlite");
  
  var storageService = Components.classes["@mozilla.org/storage/service;1"]
                          .getService(Components.interfaces.mozIStorageService);
  sbcfmOverlay.mDBConn = storageService.openDatabase(file);

	var searchbar = document.getElementById("searchbar");
	if (searchbar) {
		var searchBox = document.getAnonymousElementByAttribute(searchbar, "anonid", "searchbar-textbox");
		if(searchBox){
      this.searchbox = searchBox;
      searchBox.addEventListener("change", this.reloadSearchText, false);
    } 
	}
  setTimeout(function(){this.preSelectedTab = gBrowser.selectedTab}, 500);
},
uninit: function() {
	gBrowser.removeProgressListener(sbcfmUrlBarListener);
	var menu = document.getElementById("contentAreaContextMenu");
	menu.removeEventListener("popupshowing", sbcfmOverlay.contextPopupShowing, false);
  if ('TreeStyleTabService' in window){
    var container = gBrowser.tabContainer;
    container.removeEventListener("TabOpen", sbcfmOverlay.getSearchWordOfParentTab, false);
  }
},
reloadSearchText : function(aEvent){
  if(sbcfmUrlBarListener.nowTabSwitched) return;
  sbcfmOverlay.saveSearchWordForTab(aEvent.target.value, gBrowser.selectedTab);  
},
contextPopupShowing : function(){
	if(sbcfmOverlay.inputAddable()){
	  var node = document.popupNode;
		var name = node.getAttribute("name");
		
		var alreadyRegistered;
		if(name){
			var url = gBrowser.getBrowserForDocument(node.ownerDocument).currentURI;
			try{
				var tld = sbcfmCommon.eTLDService.getBaseDomain(url);
			}catch(ex){
				var tld = null;
			}
			if(tld){
				var textBoxNameList = sbcfmCommon.textBoxNameList;
				var re = new RegExp(" "+tld+",[^ ]*,?"+name+",")
				alreadyRegistered = re.test(textBoxNameList)
			}
		}
		gContextMenu.showItem("sbcfm-searchfield-register", true);
    var menu = document.getElementById("sbcfm-searchfield-register");
    menu.setAttribute("checked", alreadyRegistered)
	}
	else{
		gContextMenu.showItem("sbcfm-searchfield-register", false);
	}
},
inputAddable: function() {
	if(!gContextMenu.onTextInput) return false;
    var form = gContextMenu.target.form, doc = form.ownerDocument;
    var formURI = makeURI(form.getAttribute("action"),
                          doc.characterSet, makeURI(doc.location.href));
    if(formURI.scheme != "javascript") {
      try {
        urlSecurityCheck(formURI, doc.nodePrincipal);
        return true;
      } catch(e) { }
    }
    return false;
},
getSearchWordOfParentTab : function(event){
	if (!sbcfmCommon.Branch.getBoolPref("advanced.saveSearchWordForEachTab")) return;
  
  var tab = event.target;
  setTimeout(function(){
    var parent = sbcfmOverlay.getOwner(tab);
  //Application.console.log(parent)
    if(!parent) return
    
    var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].
                           getService(Components.interfaces.nsISessionStore);
    var searchWord = ss.getTabValue(parent, "search-word");
  //Application.console.log(searchWord)
    if(searchWord) ss.setTabValue(tab, "search-word", searchWord);  
  }, 0)
  return
},
getOwner : function(aTab){
  if (!aTab) return null;
  
  var owner = 'TreeStyleTabService' in window ?
    TreeStyleTabService.getParentTab(aTab) :  aTab.owner || null ;
  if (!owner) {
    let opener = aTab.linkedBrowser.contentWindow.opener;
    if (opener) {
      opener = opener.top || opener;
      WindowManager.getWindows('navigator:browser')
      .some(function(aWindow) {
        if (Array.slice(aWindow.gBrowser.mTabContainer.childNodes)
        .some(function(aTab) {
          if (aTab.linkedBrowser.contentWindow == opener)
          return owner = aTab;
          return false;
        }))
        return true;
        return false;
      });
    }
  }
  
  return owner;
},
registerTextBox : function(event){
  var node = document.popupNode;
	var name = node.getAttribute("name");
	var url = gBrowser.getBrowserForDocument(node.ownerDocument).currentURI;
	try{
		var tld = sbcfmCommon.eTLDService.getBaseDomain(url);
	}catch(ex){
		var strbundle = document.getElementById("sbconforming-bundle");
		var msg=strbundle.getString("cantExecuteBecauseNoBaseDomain");
		alert(msg);
		return;
	}

  if (event.target.getAttribute("checked") == "true"){
  	if(!name){
  		var strbundle = document.getElementById("sbconforming-bundle");
  		var msg=strbundle.getString("cantConformBecauseNoName");
  		alert(msg);
  		return;
  	}
  	
  	sbcfmCommon.setTextBoxNames(tld, name);
  	sbcfmOverlay.checkTextBox();
    
  }
  else{  	
  	sbcfmCommon.removeTextBoxNames(tld, name);    
  }
},
checkTextBoxWhenLoaded : function(){
	this.removeEventListener("DOMContentLoaded", sbcfmOverlay.checkTextBoxWhenLoaded, false);
	if(this != gBrowser.selectedBrowser) return null;
	sbcfmOverlay.checkTextBox();
},
checkTextBox : function(){
	var browser = gBrowser.selectedBrowser;
	var contentDocument = browser.contentDocument;
	var inputs = contentDocument.getElementsByTagName("input");	
	var textBoxArray = new Array();
	for(var i=0; i<inputs.length; i++){
		var type = inputs[i].getAttribute("type");
//Application.console.log(!inputs[i].getAttribute("name"));
		
		if((type && type != "text") ||!inputs[i].value || !inputs[i].getAttribute("name")){
//			delete inputs[i];
			continue;
		}
		textBoxArray.push(i);
	}
	if(!textBoxArray.length) return null;

	var textBoxNameList = sbcfmCommon.textBoxNameList;
	try{
		var tld = sbcfmCommon.eTLDService.getBaseDomain(browser.currentURI);
	}catch(ex){
		return null;
	}

	var idx = textBoxNameList.indexOf(" "+tld+ "," );	
	if(idx>-1){
		var textBoxNames = textBoxNameList.substring(idx+tld.length+1, textBoxNameList.indexOf(" ",idx+1))+",";
		var term = null;
		
		for(var i=0; i<textBoxArray.length; i++){
			var num = textBoxArray[i];

			if(textBoxNames.indexOf(","+inputs[num].getAttribute("name")+",")>-1){
				term = inputs[num].value;
        inputs[num].addEventListener("change", function(){
          clearTimeout(sbcfmOverlay.timeoutID);
          sbcfmOverlay.timeoutID = setTimeout(function(){sbcfmOverlay.checkTextBox();}, 100)
        }, false)
        if(term==inputs[num].getAttribute("placeholder")) term = "";
				break;
			}			
		}
		if(term){
			sbcfmOverlay.setSearchBoxes(term);
			return term;
		}
	}

	
	//learnRegExp
	if(sbcfmCommon.Branch.getBoolPref("advanced.disableAutomaticLearning")) return null;
	if(sbcfmCommon.blackList.indexOf(" "+browser.currentURI.prePath+" ")>-1) return null;

	var learnedRegExp = null;
	
	for(var i=0; i<textBoxArray.length; i++){
		var num = textBoxArray[i];
	
		var name = inputs[num].getAttribute("name");
		var re = "[&?#]"+name+"=([^&]+)";
		term = sbcfmOverlay.extractTerms(re, browser.currentURI.spec);//contentDocument.URLだとダメ
		if(!term) continue;
		if(term==inputs[num].value){
			learnedRegExp = re;
			break;
		}
	}
	
	if(!learnedRegExp){
		return null;
/*
		var encodedURL = sbcfmOverlay.extractterm("(.+)", contentDocument.URL);
		for(var i=0; i<textBoxArray.length; i++){
			var num = textBoxArray[i];		
			var term = inputs[num].value;
			term = sbcfmCommon.trim(term.replace(/"/g," ").replace(/\s/g," ").replace(/\s+/g," "));
			
			var name = inputs[num].getAttribute("name");
			var re = "[&?]"+name+"=([^&]+)";
			var term = sbcfmOverlay.extractterm(re, contentDocument.URL);
			if(!term) continue;
			if(term==inputs[num].value){
				learnedRegExp = re;
				break;
			}
		}		
*/
	}
	if(sbcfmCommon.regExpList.indexOf(" "+tld+"," )>-1){
		sbcfmCommon.regExpList = sbcfmCommon.regExpList.replace(" "+tld+ "," , " "+tld+ "," +learnedRegExp+",")
			.replace("," +learnedRegExp+","+learnedRegExp+"," , "," +learnedRegExp+",")
			.replace("," +learnedRegExp+","+learnedRegExp+" " , "," +learnedRegExp+" ");//念のため二重登録を除外
	}
	else{
		sbcfmCommon.regExpList = sbcfmCommon.regExpList+tld+ "," +learnedRegExp+" ";
	}
	sbcfmOverlay.setSearchBoxes(term);
  return term
},
//This is from SerchBox Sync
extractTerms : function(aUrlRegex, aUrl) {
	if (!aUrlRegex) {
		return null;
	}
	
	var urlExpression = new RegExp(aUrlRegex, 'ig');
	var terms = "";
//	alert(aUrl.match(urlExpression))
	// Test to see if the URL matches the given pattern
//	if (urlExpression.test(aUrl)) {
	if (aUrl.match(urlExpression)) {
		// Extract the search terms from the URL
    //prefer the posterior part(for google's no-transition search)
		terms = RegExp.lastParen;
		terms = terms.replace(/\+/g, " "); // Replace all + signs with a space
		terms = terms.replace(/%252B/g, " "); // Replace all %252B signs with a space

		// Fixed by Masao Fukushima (alice0775@yahoo.co.jp)
		var encodetype = sbcfm_ecl.GetEscapeCodeType(terms);
		switch (encodetype) {
		case "EUCJP":
			terms = sbcfm_ecl.UnescapeEUCJP(terms);
			break;
		case "SJIS":
			terms = sbcfm_ecl.UnescapeSJIS(terms);
			break;
		case "JIS7":
			terms = sbcfm_ecl.UnescapeJIS7(terms);
			break;
		case "JIS8":
			terms = sbcfm_ecl.UnescapeJIS8(terms);
			break;
		default:
			terms = decodeURIComponent(terms);
			break;
		}
	}
	return terms;
},
saveSearchWordForTab : function(term, tab){
  var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].
                             getService(Components.interfaces.nsISessionStore);
//  var preSelectedTab = getBrowser().selectedTab;
//alert(tab.linkedBrowser.contentDocument.title+" "+this.searchbox.value)
  ss.setTabValue(tab, "search-word", term);  
},
setSearchBoxes : function(term){
	if(sbcfmCommon.Branch.getBoolPref("advanced.disableConformSearchBox")) return;
	
	var searchbar = document.getElementById("searchbar");
	if (searchbar) {
		var searchBox = document.getAnonymousElementByAttribute(searchbar, "anonid", "searchbar-textbox");
		if(searchBox){
      var preValue = searchBox.value;
      searchBox.value = term;
    } 
	}
  this.saveSearchWordForTab(term, gBrowser.selectedTab);
  
  if(preValue != term){
  	var dd = new Date();
    var now = dd.getTime()+"000";
    
    var statement = sbcfmOverlay.mDBConn.createStatement("SELECT * FROM moz_formhistory WHERE fieldname = 'searchbar-history' AND value=:word");
  	var resultExisting = false;
    statement.params.word = term;
    statement.executeAsync({
      handleResult: function(aResultSet) {
        resultExisting = true;
        let row = aResultSet.getNextRow();
                       
        let id = row.getResultByName("id");
        let timesUsed = row.getResultByName("timesUsed");
        
        let updateStatement = sbcfmOverlay.mDBConn.createStatement("UPDATE moz_formhistory SET timesUsed=:timesUsed, lastUsed=:lastUsed WHERE id=:id");
        updateStatement.params.timesUsed = timesUsed + 1;
        updateStatement.params.lastUsed = now;
        updateStatement.params.id = id;
        
        updateStatement.executeAsync()
     },
    handleError: function(aError) {
      Application.console.log("Error: " + aError.message);
    },
    handleCompletion: function(aReason) {
      if(!resultExisting){    
          let guid = "";
          for(let i=0; i<16; i++){
            guid+=sbcfmOverlay.chars.charAt(Math.floor(Math.random()*64));
          }
  
          let maxStatement = sbcfmOverlay.mDBConn.createStatement("select max(id) from moz_formhistory");
            maxStatement.executeAsync({
              handleResult: function(aResultSet) {
               let row = aResultSet.getNextRow();
               let max;
                if(row) max = row.getResultByIndex(0);
                else max = 0;
  
                let insertStatement = sbcfmOverlay.mDBConn.createStatement("INSERT INTO moz_formhistory VALUES(:id, :fieldname, :value, 1, :firstUsed, :lastUsed, :guid)");
                insertStatement.params.id = max+1;
                insertStatement.params.fieldname = "searchbar-history";
                insertStatement.params.value = term;
                insertStatement.params.firstUsed = now;
                insertStatement.params.lastUsed = now;
                insertStatement.params.guid = guid;
                
                insertStatement.executeAsync()
               },
               handleError: function(aError) {
                Application.console.log("Error: " + aError.message);
              },
              handleCompletion: function(aReason) {
              }
            })
        
      }
      //if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)
    }});
  }
  
	if(!sbcfmCommon.Branch.getBoolPref("conformExternalTextBox")) return;
	
	var extTextBoxes = new Array();
	extTextBoxes = sbcfmCommon.Branch.getCharPref("extTextBoxes");
	if(extTextBoxes) extTextBoxes=extTextBoxes.split(" ");
	else return;
	
	for(var i=0; i<extTextBoxes.length; i++){
		var textBox = document.getElementById(extTextBoxes[i])
		if(textBox){
			//menu list の場合
			if(textBox.inputField){
				textBox = textBox.inputField
			}
			textBox.value = term;
			//eval(tmp)
		}
	}
	return;
},
getSavedWord : function(){
	if (!sbcfmCommon.Branch.getBoolPref("advanced.saveSearchWordForEachTab")) return;
  
  var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
  var currentTab = gBrowser.selectedTab;
  var searchWord = ss.getTabValue(currentTab, "search-word");
  if (searchWord) {
//  Application.console.log(searchWord)
    sbcfmOverlay.setSearchBoxes(searchWord);
    return;
  }  
}
}

var sbcfmUrlBarListener = {
  nowTabSwitched : false,
  QueryInterface: function(aIID)
  {
   if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
       aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
       aIID.equals(Components.interfaces.nsISupports))
     return this;
   throw Components.results.NS_NOINTERFACE;
  },
onLocationChange: function(aProgress, aRequest, aURI){
	var browser =  gBrowser.getBrowserForDocument( aProgress.DOMWindow.document );
	if(!browser) return;
//	var eTLDService = Components.classes["@mozilla.org/network/effective-tld-service;1"]
//				.getService(Components.interfaces.nsIEffectiveTLDService);
	if(!aURI) return;

	try{
		var tld = sbcfmCommon.eTLDService.getBaseDomain(aURI);
	}catch(ex){
		return;
	}
		
	//画像をダウンロード中の時なども true となる
	//Application.console.log(aProgress.isLoadingDocument);
	//aRequest が存在しないときはタブを切り替えただけと判断
	var tabSwitched =!aRequest;
//	var tabSwitched = !!aProgress.DOMWindow.document.body;
  if(tabSwitched){
	  if(sbcfmCommon.Branch.getBoolPref("advanced.disableConformSearchBoxWhenTabSwitched")) return;
  } 
  sbcfmUrlBarListener.nowTabSwitched = (sbcfmOverlay.preSelectedTab != gBrowser.selectedTab);
  if(sbcfmUrlBarListener.nowTabSwitched){
  	let term = sbcfmOverlay.searchbox.value;
//    Application.console.log(term);
    setTimeout(function(){
//      Application.console.log("c"+term);
      sbcfmUrlBarListener.nowTabSwitched = false;
      if(sbcfmOverlay.preSelectedTab) sbcfmOverlay.saveSearchWordForTab(term, sbcfmOverlay.preSelectedTab);
      sbcfmOverlay.preSelectedTab = gBrowser.selectedTab;
    }, 100);    
  }
  
		
	var regExpList = sbcfmCommon.regExpList;
	var idx = regExpList.indexOf(" "+tld+ "," );
	if(idx>-1){
  	var term = null;
		var regExps = new Array();
		regExps = regExpList.substring(idx+tld.length+2, regExpList.indexOf(" ",idx+1)).split(",");
		for(var i=0; i<regExps.length; i++){
			term = sbcfmOverlay.extractTerms(regExps[i], aURI.spec);
			if(term){
				sbcfmOverlay.setSearchBoxes(term);
				return;
			}
		}
		if(!term){
			//ドキュメントのロードも終わってない状態なら、
			if(!aProgress.DOMWindow.document.title){
				browser.addEventListener("DOMContentLoaded", sbcfmOverlay.checkTextBoxWhenLoaded, false);
//					function(){sbcfmOverlay.learnRegExpWhenLoaded(browser, tld,true)}, false);
			}
			else{
				term = sbcfmOverlay.checkTextBox();
			}
      if(!term) sbcfmOverlay.getSavedWord();
      return
		}
	}
	else{
		//タブを切り替えただけの時
		if(tabSwitched){
			var term = sbcfmOverlay.checkTextBox();
		}
		else{
			browser.addEventListener("DOMContentLoaded", sbcfmOverlay.checkTextBoxWhenLoaded, false);
//					function(){sbcfmOverlay.learnRegExpWhenLoaded(browser, tld,true)}, false);
		}
    if(!term) sbcfmOverlay.getSavedWord();
		return;
	}
},
  onStateChange: function() {},
  onProgressChange: function() {},
  onStatusChange: function() {},
  onSecurityChange: function() {},
  onLinkIconAvailable: function() {}
};



window.addEventListener("load", function() {sbcfmOverlay.init()}, false);
window.addEventListener("unload", function() {sbcfmOverlay.uninit()}, false);

