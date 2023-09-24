function EvolveRamis() {
	document.getElementById("ramisImage").src = "goober.png";
	document.getElementById("ramisImage").onclick = DevolveRamis; 
	var audio = new Audio('splat.mp3');
	audio.play();
}

function DevolveRamis() {
	document.getElementById("ramisImage").src = "ramis-real.jpg";
	document.getElementById("ramisImage").onclick = EvolveRamis; 
	var audio = new Audio('splat.mp3');
	audio.play();
}
