function EvolveRamis() {
	document.getElementById("ramisImage").src = "goober.png";
	document.getElementById("ramisImage").onclick = DevolveRamis; 
	document.getElementById("splat.mp3").play();
}

function DevolveRamis() {
	document.getElementById("ramisImage").src = "ramis-real.jpg";
	document.getElementById("ramisImage").onclick = EvolveRamis; 
	document.getElementById("splat.mp3").play();
}
