function EvolveRamis() {
	document.getElementById("ramisImage").src = "goober.png";
	document.getElementById("ramisImage").onclick = DevolveRamis; 
	document.getElementById("thisIsX").innerHTML = "this is a Goober";
	var audio = new Audio('splat.mp3');
	audio.play();
}

function DevolveRamis() {
	document.getElementById("ramisImage").src = "ramis-real.jpg";
	document.getElementById("ramisImage").onclick = EvolveRamis; 
	document.getElementById("thisIsX").innerHTML = "this is a Ramis Bhatty";
	var audio = new Audio('splat.mp3');
	audio.play();
}

function pause (milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function RColValue() {
	return Math.floor(Math.random() * 256);
}

function GetDifference(start, end, interval) {
	return Math.floor((end - start) / interval);
}

async function RandomBackground(currentColor) {
	const frames = 60;
	var newColor = [RColValue(), RColValue(), RColValue()];
	var d = [0,0,0];
	for (let i = 0; i < 3; i++) {
		d[i] = GetDifference(currentColor[i], newColor[i], frames);
	}
	for (let j = 0; j < frames; j++) {
		await pause(Math.floor(1000 / frames));
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
