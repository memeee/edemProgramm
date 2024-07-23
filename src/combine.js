var prog = {};
var m3u8 = {};
var url_EPG;
var url_M3u8;


function getData(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url+"?time="+new Date().getTime(), true);  
        xhr.send();       
        xhr.addEventListener("load", function () {
            if (xhr.status == 200) {
				lastModified = new Date(new Date(xhr.getResponseHeader('last-modified')).getTime())
                resolve({
					lastModified:lastModified,
					txt:xhr.responseText
					});
            } else {
                reject(Error(xhr.statusText));
            }
        });
        xhr.addEventListener("error", function () {
            reject(Error("Network Error"));
        });
    });
}

async function combine(set) {
  
  url_EPG = set.url_EPG;
  url_M3u8 = set.url_M3u8;
  
  m3u8.badParseEpg = []; //empity in playlist
  m3u8.errorEpg = []; //empity in xml
  m3u8.doubleUrl = []; // doubleurl in playlist
  m3u8.empityIcon = []; //empity Icon in xml
  m3u8.totalM3u8 = 0;
  m3u8.totalEpg = 0;
  m3u8.totalM3u8_haveEpg = 0;   //have  prog in xml
  m3u8.totalM3u8_empityEpg = 0; //empity prog in xml
  m3u8.lastModified = {};
  m3u8.category = []; //category in playlist
  m3u8.channels = new Map();

  return new Promise(async function (resolve, reject) {
	//console.info('start getData url_M3u8')
    Data = await getData(set.url_M3u8);
	m3u8.lastModified.m3u8 = Data.lastModified
    responseText = Data.txt
	//console.info('start m3uParserGenerator')
    parsedPlaylist = m3uParserGenerator.M3uParser.parse(responseText);
	m3u8.totalM3u8 = parsedPlaylist.medias.length;
    for (m of parsedPlaylist.medias) {
      rec = m.attributes["tvg-rec"];
      url = m.location;
      title = m.name;
      trimTitle = title.trim();
      category = m.group || m.attributes["group-title"];
      if (!m3u8.category.includes(category)) {
        m3u8.category.push(category)
      }
      if (m3u8.channels.has(trimTitle)) {		  
		  m3u8.channels.set(trimTitle, {
			  ...m3u8.channels.get(trimTitle),
			  url2: m.location
			  });
		  ch = m3u8.channels.get(trimTitle)
		  m3u8.doubleUrl.push({[title]:[ch.url,ch.url2]})
      } else {
          m3u8.channels.set(trimTitle, {
            "title": trimTitle,
            "url": url,
            "category": category,
            "rec": rec,
          })	
      }
    }
    resolve(xmlparse());
  });
}

async function xmlparse() {	
  //console.info('start tXml')
  Data = await getData(url_EPG)
  json = tXml(Data.txt)
  m3u8.lastModified.epg = Data.lastModified;
  findIcon = (arr) => {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].tagName !== 'icon') continue;
      return arr[i].attributes.src;
    }
	m3u8.empityIcon.push(arr[0].children[0])
    return " ";
  }
  
  //console.info('start parse')
  for (ch of json[0].children[0].children) {
    if (ch.tagName == 'channel') {	
      id = ch.attributes.id;
      ico = findIcon(ch.children);
      for (info of ch.children) {
        if (info.tagName !== "display-name") continue;
		m3u8.totalEpg++;
        name = info.children[0];
        channelName = name.trim() 
        if (!m3u8.channels.has(channelName)) {
          m3u8.badParseEpg.push(name);
          continue;
        }
		
        lang = info.attributes.lang;
        m3u8.channels.set(channelName, {
          ...m3u8.channels.get(channelName),
          get: true,
          ico: ico,
          title: name,
          id: id,
          lang: lang,
        });
      }
    }

    if (ch.tagName == 'programme') {
      title = ch.children[0].children[0];
      id = ch.attributes.channel;
      pp = {
        "start": ch.attributes.start,
        "stop": ch.attributes.stop,
        "title": title,
      }
      if (!prog[id]) {
        Object.assign(prog, {
        [id]: [pp]
        });
        continue;
      }
      prog[id].push(pp);
    }
  }
  m3u8.channels.forEach((value, key) => {if(!value.get)m3u8.errorEpg.push(value.title)})
  //console.info('start sortProgramm')
  m3u8.channels.forEach(sortProgramm);
  m3u8.channels = Object.fromEntries(m3u8.channels.entries());
  console.log(m3u8)
  return 
}

function sortProgramm(val, key, map) {
    if (prog[val.id]) {
	  m3u8.totalM3u8_haveEpg++
      array = [];
      programm = prog[val.id];
      for (p in programm) {
        start = strDate(programm[p].start);
        stop = strDate(programm[p].stop);
        array.push({
          title: programm[p].title,
          start: start,
          stop: stop,
        })
      }
      m3u8.channels.set(key, {...m3u8.channels.get(key),
        prog: array,
      });
    }else{
	  m3u8.totalM3u8_empityEpg++
	}
}

function strDate(date) {
  date = `${date.substr(0,4)}/${date.substr(4,2)}/${date.substr(6,2)} ${date.substr(8,2)}:${date.substr(10,2)}`;
  return  new Date(date).getTime()/1000;
}