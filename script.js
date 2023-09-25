//pause function (for async timers)
function pause (milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

//random integer
function RandInt(max, offset=0) {
	return offset+Math.floor(Math.random() * max);
}

//click ramis effect------------------------------------------------------------------------
function EvolveRamis() {
	const RAMIS = document.getElementById("ramisImage");
	RAMIS.src = "goober.png";
	RAMIS.onclick = DevolveRamis; 
	document.getElementById("thisIsX").innerHTML = "This is a Goober";
	var audio = new Audio('splat.mp3');
	audio.play();
}

function DevolveRamis() {
	const RAMIS = document.getElementById("ramisImage");
	RAMIS.src = "ramis-real.jpg";
	RAMIS.onclick = EvolveRamis; 
	document.getElementById("thisIsX").innerHTML = "This is a Ramis Bhatty";
	var audio = new Audio('splat.mp3');
	audio.play();
}

//Moving ramis
async function MoveRamis() {
	const RAMIS = document.getElementById("ramisImage");
	const BLIP = new Audio('blip.mp3');
	RAMIS.removeAttribute("onload");
	const WIDTH = RAMIS.clientWidth;
	const HEIGHT = RAMIS.clientHeight
	const FRAMES = 30;
	const FRAMETIME = 1000/FRAMES;
	var velocity = [(1-2*RandInt(2)) * RandInt(10,5), (1-2*RandInt(2)) * RandInt(10,5)];
	var pos = [0, 0];
	while (true) {
		pos[0] += velocity[0];
		pos[1] += velocity[1];

		if (pos[0] < 0) {
			pos[0] = 0;
			velocity[0] = -velocity[0];
			BLIP.play();
		}
		else if (pos[0] > window.innerWidth - WIDTH) {
			pos[0] = window.innerWidth - WIDTH;
			velocity[0] = -velocity[0];
			BLIP.play();
		}

		if (pos[1] < 0) {
			pos[1] = 0;
			velocity[1] = -velocity[1];
			BLIP.play();
		}
		else if (pos[1] > window.innerHeight - HEIGHT) {
			pos[1] = window.innerHeight - HEIGHT;
			velocity[1] = -velocity[1];
			BLIP.play();
		}

		RAMIS.style.left = pos[0] + "px";
		RAMIS.style.top = pos[1] + "px";
		await pause(FRAMETIME);
	}
}

function LoadRamis(){
	document.getElementById("ramisImage").removeAttribute("onload");
	MoveRamis();
}

//Background Stuff-------------------------------------------------------------------------

function GetDifference(start, end, interval) {
	return Math.floor((end - start) / interval);
}

async function RandomBackground(currentColor) {
	const FRAMES = 24;
	const FRAMETIME = 1000/FRAMES;
	var newColor = [RandInt(256),RandInt(256),RandInt(256)];
	var d = [0,0,0];
	for (let i = 0; i < 3; i++) {
		d[i] = GetDifference(currentColor[i], newColor[i], FRAMES);
	}
	for (let j = 0; j < FRAMES; j++) {
		await pause(Math.floor(FRAMETIME));
		for (let k = 0; k < 3; k++) {
			currentColor[k] += d[k];
		}
		document.body.style.backgroundColor="rgb("+currentColor[0]+","+currentColor[1]+","+currentColor[2]+")";
	} 
	RandomBackground(currentColor);
}

function InitialiseBackground() {
	var startColor = [255, 255, 255];
	document.body.style.backgroundColor="rgb(200,200,200)";
	RandomBackground(startColor);
}


