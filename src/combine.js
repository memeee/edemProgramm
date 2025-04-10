var prog = {};
var m3u8 = {};
var url_EPG;
var url_M3u8;


function getData(url) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        console.log(url);
        xhr.open('GET', url + "?time=" + new Date().getTime(), true);
        xhr.send();

        xhr.addEventListener("load", function () {
            if (xhr.status === 200) {
                const lastModifiedHeader = xhr.getResponseHeader('last-modified');
                const lastModified = lastModifiedHeader ? new Date(lastModifiedHeader) : null;

                resolve({
                    lastModified: lastModified,
                    txt: xhr.responseText
                });
            } else {
                reject(new Error(`Request failed with status: ${xhr.status} - ${xhr.statusText}`));
            }
        });

        xhr.addEventListener("error", function () {
            reject(new Error("Network Error"));
        });
    });
} 
 
 
async function combine(set) {
   url_EPG = set.url_EPG;
   url_M3u8 = set.url_M3u8;

    m3u8.badParseEpg = [];
    m3u8.errorEpg = [];
    m3u8.doubleUrl = [];
    m3u8.empityIcon = [];
    m3u8.totalM3u8 = 0;
    m3u8.totalEpg = 0;
    m3u8.totalM3u8_haveEpg = 0;
    m3u8.totalM3u8_empityEpg = 0;
    m3u8.lastModified = {};
    m3u8.category = [];
    m3u8.channels = new Map();

    try {
        const data = await getData(url_M3u8);
        m3u8.lastModified.m3u8 = data.lastModified;
        const responseText = data.txt;

        const parsedPlaylist = m3uParserGenerator.M3uParser.parse(responseText);
        m3u8.totalM3u8 = parsedPlaylist.medias.length;

        for (const m of parsedPlaylist.medias) {
            const rec = m.attributes["tvg-rec"];
            const url = m.location;
            const title = m.name.trim();
            const category = m.group || m.attributes["group-title"];

            if (!m3u8.category.includes(category)) {
                m3u8.category.push(category);
            }

            if (m3u8.channels.has(title)) {
                const existingChannel = m3u8.channels.get(title);
                m3u8.channels.set(title, {
                    ...existingChannel,
                    url2: m.location
                });
                m3u8.doubleUrl.push({ [title]: [existingChannel.url, m.location] });
            } else {
                m3u8.channels.set(title, {
                    title: title,
                    url: url,
                    category: category,
                    rec: rec,
                });
            }
        }

        return xmlparse();
    } catch (error) {
        console.error('Error XMLHttpRequest or parsing M3U8:', error);
        throw error;
    }
}



async function xmlparse() {
    try {
        const data = await getData(url_EPG);
        const json = tXml(data.txt);
        m3u8.lastModified.epg = data.lastModified;

        const findIcon = (arr) => {
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].tagName !== 'icon') continue;
                return arr[i].attributes.src;
            }
            if (arr.length > 0 && arr[0].children.length > 0) {
                m3u8.empityIcon.push(arr[0].children[0]);
            }
            return " ";
        };

        for (const ch of json[0].children[0].children) {
            if (ch.tagName === 'channel') {
                const id = ch.attributes.id;
                const ico = findIcon(ch.children);
                for (const info of ch.children) {
                    if (info.tagName !== "display-name") continue;
                    m3u8.totalEpg++;
                    const name = info.children[0];
                    const channelName = name.trim();
                    if (!m3u8.channels.has(channelName)) {
                        m3u8.badParseEpg.push(name);
                        continue;
                    }

                    const lang = info.attributes.lang;
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

            if (ch.tagName === 'programme') {
                const title = ch.children[0].children[0];
                const id = ch.attributes.channel;
                const pp = {
                    "start": ch.attributes.start,
                    "stop": ch.attributes.stop,
                    "title": title,
                };
                if (!prog[id]) {
                    prog[id] = [pp];
                } else {
                    prog[id].push(pp);
                }
            }
        }

        m3u8.channels.forEach((value, key) => {
            if (!value.get) m3u8.errorEpg.push(value.title);
        });

        m3u8.channels.forEach(sortProgramm);
        m3u8.channels = Object.fromEntries(m3u8.channels.entries());
        console.log(m3u8);
    } catch (error) {
        console.error('Error parsing XML:', error);
    }
}


function sortProgramm(val, key, map) {
    if (prog[val.id]) {
        m3u8.totalM3u8_haveEpg++;
        const array = [];
        const programm = prog[val.id];

        for (const p of programm) {
            const start = strDate(p.start);
            const stop = strDate(p.stop);
            array.push({
                title: p.title,
                start: start,
                stop: stop,
            });
        }

        m3u8.channels.set(key, {
            ...m3u8.channels.get(key),
            prog: array,
        });
    } else {
        m3u8.totalM3u8_empityEpg++;
    }
}

function strDate(date) {
  date = `${date.substr(0,4)}/${date.substr(4,2)}/${date.substr(6,2)} ${date.substr(8,2)}:${date.substr(10,2)}`;
  return  new Date(date).getTime()/1000;
}