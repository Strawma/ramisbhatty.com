function EvolveRamis() {
	document.getElementById("ramisImage").src = "goober.png";
	document.getElementById("ramisImage").onclick = DevolveRamis; 
}

function DevolveRamis() {
	document.getElementById("ramisImage").src = "ramis-real.jpg";
	document.getElementById("ramisImage").onclick = EvolveRamis; 
}
