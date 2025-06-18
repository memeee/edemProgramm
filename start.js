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
