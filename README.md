私はすでにこのソフトウェアを開発・保守する時間がありません。引き続き開発・保守してくださる方を募集しています。

I don't have any time to develop and maintain this software. Please develop and maintain if you wish


               DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                       Version 2, December 2004
     
    Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>
    
    Everyone is permitted to copy and distribute verbatim or modified
    copies of this license document, and changing it is allowed as long
    as the name is changed.
     
               DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
      TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
     
     0. You just DO WHAT THE FUCK YOU WANT TO.
    
     http://www.wtfpl.net/

---------------------

検索ボックス自動入力（学習機能付き）
ウェブで検索を行ったとき、Firefoxの検索ボックスにも自動的に検索語を入力します。検索語の取得方法は自動的に学習されるので、いちいち入力する必要はありません。

学習できない場合も、以下の方法で学習させることができます。

テキストボックスから
    ウェブページ内の検索ボックスを右クリックして「検索ボックスをこのテキストボックスと一致させる」メニューを選ぶことで、次回以降そのテキストボックスの内容が検索ボックスに自動的に入力されます。

URLから
    設定ウインドウから、正規表現を入力することで、URLから検索語を取得します。 

検索語は以下のように取得されます。
１．ページ内のテキストボックスをすべて列挙
２．「（テキストボックスの"name"属性）=（テキストボックスの中身）」という文字列がURLにも含まれているなら、そのテキストボックスを検索ボックスと判断する。

Conform SearchBox (with automatic learning)
Enter searched words in the Firefox search box to sync when you search in web. In addition this add-on has automatic learning function and you don't need to feed regulations. 


If not, of course, you can manually make this add-on learn.

1.From text boxes
Right-click search box in web sites and choose the "Conform search box to this text box" menu, from then on, searched words are fetched from the text box.

2.From a URL
On settings window, by entering regular expressions, searched words are fetched from URL.
