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
