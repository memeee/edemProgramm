var prog_ = '';
var showRec = '';
var showProg = '';
var epgTime = 0;
var player

refreshProg = ()=> showCat(prog_);

function build(x) {
	document.getElementById("loaderW").style.display = "none";
	document.getElementById("buttons_select").style.display = "flex";
	document.getElementById("perf").style.display = "none";
	showRec = x.showRec;
	showProg = x.showProg;
	epgTime = Number(x.epgTime);
  for (category of m3u8.category) {
    document.getElementById('cs').add(new Option(category));
  }
  dragPlayer(document.getElementById("playerBlock"));
  customPlayer();
}

function binarySearch(prog, time) {
  var min = 0;
  var max = prog.length - 1;
  while (min <= max) {	  	  
    var mid = Math.floor((min + max) / 2);	 
    if (prog[mid].start < time && time < prog[mid].stop) {
      return mid;
    } else if (prog[mid].start < time && time > prog[mid].stop) {
      min = mid + 1;
    } else {
      max = mid - 1;
    }
  }
  return false;
}

function showCat(check) {
  check !== prog_ && window.scrollTo(0,0);
  prog_ = check;
  document.querySelector('#list').innerHTML = ``
  html = ``;
  time = Math.floor(Date.now() / 1000) 
  for (const [key, value] of Object.entries(m3u8.channels)) {
    if (value.category == check) {
      circle = ``;
      ico = ``;
	  channel = ``;
      if (value.rec > 0) circle = ` <div class="circle" ></div>`
	  ico = value.ico ?` <img src="${value.ico}"> `:`<span class="material-icons" style="font-size: 38px;color: red;">report_problem</span>`;
      title = value.title;
      channel += ` 
		<div class="channel">
				<div class="headCh">
                  <div class="img">${ico}</div>
                  <div class="title">${title}${circle}</div>
				  <div class="tv" onclick="play('${value.url}','${value.ico}','${value.title}')">
				   <span class="material-icons icons">smart_display</span>
				  </div>
                </div>
                <div class="progs" >`
				
	  if (!value.get) {
        channel += ` 
            <div class="pr rec">               
                  <div class="info erprog">Канал отстутсвует в EPG.</div>    
            </div>`
        channel += `</div></div>`;
        html += channel;
        continue;
      }		
	  
      if (!value.prog) {
        channel += ` 
            <div class="pr rec">               
                  <div class="info erprog">Программа отсутствует.</div>    
            </div>`
        channel += `</div></div>`;
        html += channel;
        continue;
      }
	  
      x = binarySearch(value.prog, time)
      if (typeof x !== "number") {
        rn = value.prog[value.prog.length - 1]
        startTime = timestampToDate(rn.start)
        stopTime = timestampToDate(rn.stop)
        LocaleDate = new Date(rn.start * 1000).toLocaleString('default', {
            month: "short",
            day: "numeric"
          });
        channel += ` 
            <div class="pr rec">
                  <div class="info erprog">Live не найден.</div>    
            </div>
			 <div class="pr rec">
                  <div class="time">${LocaleDate} ${startTime}</div>
                  <div class="info">${rn.title} (Последняя программа)</div>  
            </div>`
        channel += `</div></div>`
        html += channel;
        continue;
      }
	  
      for (let i = showRec; i > 0; i--) {
        rn = value.prog[x - i]
        if (!rn) break;
        startTime = timestampToDate(rn.start)
        channel += ` 
            <div class="pr rec">
                  <div class="time">${startTime}</div>
                  <div class="info"> ${rn.title}</div>    
            </div>`
      }
      rn = value.prog[x]
      startTime = timestampToDate(rn.start)
      percent = Math.round((time - rn.start) * 100 / (rn.stop - rn.start))
      timeLeft = Math.round((rn.stop - time) / 60);
      channel += ` 
			   <div class="pr playing">
                  <div class="time">${startTime}</div>
                  <div class="info">${rn.title}</div>  
				  <div class="progressBlock">
				     <div class="timeLeft"> +${timeLeft}</div>
                     <div class="progressLine">
                        <div style="width: ${percent}%;" class="progress"></div>
                     </div>
                  </div>			 
               </div>`
      for (let i = 1; i <= showProg; i++) {
        rn = value.prog[x + i]
        if (!rn) break;
        startTime = timestampToDate(rn.start)
        channel += ` 
            <div class="pr">
                  <div class="time">${startTime}</div>
                  <div class="info">${rn.title}</div>  
            </div>`
      }
      channel += `</div></div>`
      html += channel;
    }
  }
  document.querySelector('#list').innerHTML = html;  
}

function timestampToDate(timestamp) {
    date = new Date((timestamp+epgTime) * 1000) ;
    return   date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function customPlayer() {
 document.querySelector('.vjs-picture-in-picture-control').style.display = 'none'
 document.querySelector('.vjs-fullscreen-control').style.display = 'none'
 document.getElementById("my-video").addEventListener("fullscreenchange", (event) => {
  if (document.fullscreenElement) {
    document.getElementById("my-video").style.background = "black";
    document.getElementById("my-video").style.resize = "none";
    document.querySelector('.vjs-fullscreen-control').style.display = "inline-block"
  } else {
    document.getElementById("my-video").style.background = "linear-gradient(135deg, rgb(0, 0, 0) 0px, rgb(0, 0, 0) 99%, rgb(191, 191, 191) 99%)";
    document.getElementById("my-video").style.resize = "both";
    document.querySelector('.vjs-fullscreen-control').style.display = "none"
  }
});
}

function play(url, poster, title) {
  document.getElementById("playerBlock").style.display = "unset";
  document.getElementById("playerTitle").innerHTML = title;
  player = videojs("my-video");
  player.poster(poster);
  player.src({
    type: "application/x-mpegURL",
    src: url,
  }); 
  player.play();
}

function hide() {
  hide_ = document.getElementById("hide");
  playerBlockheader = document.getElementById("playerBlockheader");
  fullscreen = document.getElementById("fullscreen");
  if (hide_.style.display === "none") {
    hide_.style.display = "block";
    playerBlockheader.style.width = 'auto';
    fullscreen.style.display = 'block';
	return;
  } 
    playerBlockheader.style.width = playerBlockheader.clientWidth + 'px';
    hide_.style.display = "none";
    fullscreen.style.display = 'none'; 
}

var prevScrollpos = window.pageYOffset;
window.onscroll = function() {
  var currentScrollPos = window.pageYOffset;
  if (prevScrollpos > currentScrollPos) {
    document.getElementById("buttons_select").style.bottom = "5px";
  } else {
    document.getElementById("buttons_select").style.bottom = "-50px";
  }
  prevScrollpos = currentScrollPos;
}

function dragPlayer(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closedragPlayer;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    offsetTop = elmnt.offsetTop - pos2;
    offsetLeft = elmnt.offsetLeft - pos1;
    if (document.getElementById("playerBlock").offsetTop < 0) {
      elmnt.style.top = 0 + "px";
      return
    }
    elmnt.style.top = offsetTop + "px";
    elmnt.style.left = offsetLeft + "px";
  }
  
  function closedragPlayer() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}