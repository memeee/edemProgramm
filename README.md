
 ### <pre>https://memeee.github.io/edemProgramm/index.html</pre>
 <em>* oбъединяет актуальный плейлист  с [http://ru.epg.one/epg.xml](http://ru.epg.one/epg.xml)</em>
#### Для просмотра трансляций в браузере : 
* скачать репозиторий
* заменить в start.js  https://memeee.github.io/edemProgramm/playlist.m3u8  на  URL плейлиста EdemTv
* открыть index.html 



<pre>
 //start.js
(async () => {

	await combine({	
		url_EPG:  "https://memeee.github.io/edemProgramm/epg.xml",  // Access-Control-Allow-Origin: * 
		url_M3u8: "https://memeee.github.io/edemProgramm/playlist.m3u8",  //Access-Control-Allow-Origin: *
	});
	
	build({
	  showRec:  "1", // кол-во программ до Live 
	  showProg: "3", // кол-во программ после Live
	  epgTime : "0"  // сдвиг epgTime в секундах (-3600 = -1 час , 3600 = +1 час)  
	});
	
	showCat("кино"); // стартовая категория 
	
})()

</pre>
