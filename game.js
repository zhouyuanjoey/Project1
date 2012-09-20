
// I would like to make it so that the player's ship accelerates and deccelerates  (capped at a max speed) while wasd keys are held,
// that way the player has more control of the ship and we can use the same movement code for all the objects (with a stored dx, dy)
// this will save on computation of diagonal movements (less sin and cosine calculations), which will becomes important for a large number of boids
// I added the dx, dy variable to object prototype and put in many comments on my thoughts on how I would implement things.


window.onload = function () {
    var reqFrame = window.requestAnimationFrame ||
	          window.webkitRequestAnimationFrame ||
	          window.mozRequestAnimationFrame ||
	          window.oRequestAnimationFrame ||
	          window.msRequestAnimationFrame ||
	  function (/* function FrameRequestCallback */callback, /* DOMElement Element */element) {
	      window.setTimeout(callback, 20);
	  };

    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    var sightx = 600;
    var sighty = 200;
    var speedLimit=6;

    var object = {
        "img": null,
        "rot": 0,
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0,
        "dx": 0,
        "dy": 0,
        "speed": 0,
	"maxlife": 0,
	"life": 0,
	"destroy" : 0,
	"belong" : 0,
	draw : function() {
	    simrotateImage(this.rot, this.img, this.x, this.y, this.width, this.height);
	    if (this.maxlife!=0){
		context.fillStyle='red';
		context.beginPath();
		context.rect(this.x-0.3*this.width,this.y-0.7*this.height,0.6*this.life/this.maxlife*this.width,0.1*this.height);
		context.fill();
		context.fillStyle='black';
		context.beginPath();
		context.rect(this.x-0.3*this.width+0.6*this.life/this.maxlife*this.width,this.y-0.7*this.height,0.6*(1-this.life/this.maxlife)*this.width,0.1*this.height);
		context.fill();		       
		context.lineWidth=2;
		context.strokeStyle='white';
		context.beginPath();
		context.rect(this.x-0.3*this.width,this.y-0.7*this.height,0.6*this.width,0.1*this.height);
		context.stroke();
	    }
	},

	//------------------------------------------------------------------------------------------
	// This is how I would like to implement movement, because it will work better for the boids
	//------------------------------------------------------------------------------------------
	//move with edge bounce (not working correctly yet, currently not in use)
	moveB: function () {
	    this.x += this.dx;
	    this.y += this.dy;
	    if (this.x > canvas.width) {
		if (this.dx > 0) {
		    this.dx = -this.dx;
		}
	    }

	    if (this.y > canvas.height) {
		if (this.dy > 0) {
		    this.dy = -this.dy;
		}
	    }
	    if (this.x < 0) {
		if (this.dx < 0) {
		    this.dx = -this.dx;
		}
	    }
	    if (this.y < 0) {
		if (this.dy < 0) {
		    this.dy = -this.dy;
		}
	    }
	},
	//move with no edge bounce (currenttly in use by the bullets)
	moveNB: function () {
	    this.x += this.dx;
	    this.y += this.dy;
	},
	// compute the discrete component vectors from the speed and rotation
	rotToDxDy: function () {
	    this.dx = this.speed * Math.cos(this.rot);
	    this.dy = this.speed * -Math.sin(this.rot);
	},

	normalize: function () {
	    var z = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
	    if (z < .001) {
		this.dx = (Math.random() - .5) * this.speed;
		this.dy = (Math.random() - .5) * this.speed;
		this.norm();
	    } else {
		z = this.speed / z;
		this.dx *= z;
		this.dy *= z;
	    }
	}
	//--------------------------------------------------------------------------------------------
    };

    function comrotateImage(rot, img, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight) {//drawing a rotated image on the canvas, complicated version
        context.translate(destX, destY);
        context.rotate(-rot);
        context.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, -destWidth / 2, -destHeight / 2, destWidth, destHeight);
        context.rotate(rot);
        context.translate(-destX, -destY);
    }

    function simrotateImage(rot, img, destX, destY, destWidth, destHeight) {//drawing a rototed image on the canvas, simple version
        context.translate(destX, destY);
        context.rotate(-rot);
        context.drawImage(img, -destWidth / 2, -destHeight / 2, destWidth, destHeight);
        context.rotate(rot);
        context.translate(-destX, -destY);
    }

    function makeObject(img,rot,x,y,width,height,speed,maxlife,belong) {
	Empty = function () {};
	Empty.prototype = object;	// don't ask why not ball.prototype=aBall;
	obj = new Empty();
	obj.img = img;
	obj.rot = rot;
	obj.x = x;
	obj.y = y;
	obj.width = width;
	obj.height = height;
	obj.speed = speed;
	obj.rotToDxDy();
	obj.maxlife = maxlife;
	obj.life = maxlife;
	obj.destroy = 0;
	obj.belong = belong;
	return obj;
    }  


    //------------------------------------------------------------------------------------------------------------
    // this makeBullet function may be useful for making lots of bullets because few vairables need to be passed
    // it is currently not in use though, so you can disregard it if you want
    //-------------------------------------------------------------------------------------------------------------

    function makeBullet(shooter) {
        Empty = function () { };
        Empty.prototype = object; // don't ask why not ball.prototype=aBall;
        obj = new Empty();
        obj.img = bullet;
        obj.rot = shooter.rot;
        obj.x = shooter.x;
        obj.y = shooter.y;
        obj.width = 15;
        obj.height = 5;
        obj.speed = shooter.speed + 15;
        obj.rotToDxDy();
	obj.destroy = 0;
	obj.belong = shooter.belong;
        return obj;
    }

    function makeDrone(launcher, rot) {
        Empty = function () { };
        Empty.prototype = object; // don't ask why not ball.prototype=aBall;
        obj = new Empty();
        obj.img = plane;
        obj.rot = rot;
        obj.x = launcher.x;
        obj.y = launcher.y;
        obj.width = 30;
        obj.height = 10;
        obj.speed = 5;
        obj.rotToDxDy();
	obj.destroy = 0;
	obj.belong = launcher.belong;
        return obj;
    }

    var objectSet = [];
    var moveSet = [];
    var bulletSet = [];
    var droneSet = [];
    var otherSet = [];
    var mapload = 0;
    var castleload = 0;
    var planeload = 0;
    var bulletload = 0;


    var map = new Image();
    map.src = 'map.png';
    map.onload = function () {
        mapload = 1;
    }
    var UpperLeftX = 0;
    var UpperLeftY = map.height / 4;
    var sourceWidth = map.width / 2;
    var sourceHeight = map.height / 2;

    var castle = new Image();
    var destWidth = 100;
    var destHeight = 100;
    var destX = (900 - UpperLeftX) / sourceWidth * canvas.width;
    var destY = (452 - UpperLeftY) / sourceHeight * canvas.height;
    objectSet.push(makeObject(castle,0,destX,destY,destWidth,destHeight,0,2000,0));
    otherSet.push(0);
    castle.src = 'castle.png';
    castle.onload = function () {
        castleload = 1;
    }

    var plane = new Image();
    destWidth = 111;
    destHeight = 70;
    destX = 50;
    destY = canvas.height / 2;
    objectSet.push(makeObject(plane,0,destX,destY,destWidth,destHeight,0,100,1));
    moveSet.push(1);
    plane.src = 'plane.png';
    plane.onload = function () {
        planeload = 1;
    }


    var bullet = new Image();
    bullet.src = 'bullet.png';
    bullet.onload = function () {
        bulletload = 1;
    }

    function draws() {
        for (var i = 0; i < objectSet.length; i++) {
            //---------------------------------------------------------------------------------------------------
            //TO DO: add check for if object is visible (dont draw it if you cannot see it)
            //----------------------------------------------------------------------------------------------------
            objectSet[i].draw();
        }
    }

    function moves() {
        var preX = UpperLeftX;
        var preY = UpperLeftY;
        //---------------------------------------------------------------------------------------------------------------
        //would like to replace your moves with what I wrote below and after this code snippet have code to center the camera on the player's ship
        /*
        for (var i = 0; i < moveSet.length; i++) {
        objectSet[i].moveB;
        }
        */
        //if we could do this for all non-stationary bojects that would be nice
        //---------------------------------------------------------------------------------------------------------------
        for (var i = 0; i < moveSet.length; i++) {
	    objectSet[moveSet[i]].x+=objectSet[moveSet[i]].dx;
	    objectSet[moveSet[i]].y+=objectSet[moveSet[i]].dy;
            if (objectSet[moveSet[i]].x < sightx) {
                UpperLeftX -= (sightx - objectSet[moveSet[i]].x) / canvas.width * sourceWidth;
            }

            if (UpperLeftX < 0) {
                UpperLeftX = 0;
            }
            if (objectSet[moveSet[i]].x > canvas.width - 1 - sightx) {
                UpperLeftX += (objectSet[moveSet[i]].x - (canvas.width - 1 - sightx)) / canvas.width * sourceWidth;
            }
            if (UpperLeftX + sourceWidth > map.width - 1) {
                UpperLeftX = map.width - 1 - sourceWidth;
            }

            if (objectSet[moveSet[i]].y < sighty) {
                UpperLeftY -= (sighty - objectSet[moveSet[i]].y) / canvas.height * sourceHeight;
            }

            if (UpperLeftY < 0) {
                UpperLeftY = 0;
            }

            if (objectSet[moveSet[i]].y > canvas.height - 1 - sighty) {
                UpperLeftY += (objectSet[moveSet[i]].y - (canvas.height - 1 - sighty)) / canvas.height * sourceHeight;
            }


            if (UpperLeftY + sourceHeight > map.height - 1) {
                UpperLeftY = map.height - 1 - sourceHeight;
            }
        }

        for (var i = 0; i < bulletSet.length; i++) {
            //--------------------------------------------------------------------------------------------------
            //changed bullets to the stored dx and dy movement
            //---------------------------------------------------------------------------------------------------
	    objectSet[bulletSet[i]].moveNB();
        }

        for (var i = 0; i < droneSet.length; i++) {
            objectSet[droneSet[i]].moveB();
        }

        for (var i = 0; i < objectSet.length; i++) {
            objectSet[i].x -= (UpperLeftX - preX) / sourceWidth * canvas.width;
            objectSet[i].y -= (UpperLeftY - preY) / sourceHeight * canvas.height;
        }
	
	for (var i=0; i< moveSet.length; i++) {
	    if (objectSet[moveSet[i]].x<0){
		objectSet[moveSet[i]].x=0;
	    }
	    if (objectSet[moveSet[i]].x>=canvas.width){
		objectSet[moveSet[i]].x=canvas.width-1;
	    }
	    if (objectSet[moveSet[i]].y<0){
		objectSet[moveSet[i]].y=0;
	    }
	    if (objectSet[moveSet[i]].y>=canvas.height){
		objectSet[moveSet[i]].y=canvas.height-1;
	    }
	}
    }

    function launchDrone() {
	for (var i = 0; i < moveSet.length; i++) {
	    droneSet.push(objectSet.length);
	    objectSet.push(makeDrone(objectSet[otherSet[i]], 1));
	}
    }

    function launchBullet() {
	for (var i = 0; i < moveSet.length; i++) {
	    bulletSet.push(objectSet.length);
	    objectSet.push(makeBullet(objectSet[moveSet[i]]));
	}
    }

    var ali = .9;
    function adjustDrones() {
        var newDX = new Array(droneSet.length);
        var newDY = new Array(droneSet.length);
        for (var i = droneSet.length - 1; i >= 0; i--) {
            var bi = objectSet[droneSet[i]];
            var bix = bi.x;
            var biy = bi.y;
            newDX[i] = 0;
            newDY[i] = 0;
            for (var j = droneSet.length - 1; j >= 0; j--) {
                var bj = objectSet[droneSet[j]];
                var dx = bj.x - bix;
                var dy = bj.y - biy;
                var d = Math.sqrt(dx * dx + dy * dy);
                newDX[i] += (bj.dx / (d + ali));
                newDY[i] += (bj.dy / (d + ali));
            }
        }
        for (var i = droneSet.length - 1; i >= 0; i--) {
            objectSet[droneSet[i]].dx = newDX[i];
            objectSet[droneSet[i]].dy = newDY[i];
        }
        bounce();
        for (var i = droneSet.length - 1; i >= 0; i--) {
            objectSet[droneSet[i]].normalize();
        }

    }

    function bounce() {

        for (var i = droneSet.length - 1; i >= 0; i--) {
            var bi = objectSet[droneSet[i]];
            var bix = bi.x;
            var biy = bi.y;
            for (var j = i - 1; j >= 0; j--) {
                var bj = objectSet[droneSet[j]];
                var bjx = bj.x;
                var bjy = bj.y;
                var dx = bjx - bix;
                var dy = bjy - biy;
                var d = dx * dx + dy * dy;
                var impactDistance = (30)
                impactDistance *= impactDistance;
                if (d < impactDistance) {
                    bj.dx = dy;
                    bj.dy = dx;
                    bi.dx = -dx;
                    bi.dy = -dy;
                }
            }
        }
    }

    function hitTest(){
    	for (var i=0;i<bulletSet.length;i++){
    	    if (objectSet[bulletSet[i]].x>(map.width-1-UpperLeftX)/sourceWidth*canvas.width || objectSet[bulletSet[i]].x<(0-UpperLeftX)/sourceWidth*canvas.width || objectSet[bulletSet[i]].y>(map.height-1-UpperLeftY)/sourceHeight*canvas.height || objectSet[bulletSet[i]].y<(0-UpperLeftY)/sourceHeight*canvas.height){
    		objectSet[bulletSet[i]].destroy=1;
    	    }
    	    else{
    		var collide=0;
    		for (var j=0;j<moveSet.length;j++){
    		    if (objectSet[bulletSet[i]].belong==moveSet[j]){
    			continue;
    		    }
    		    if (objectSet[bulletSet[i]].x>=objectSet[moveSet[j]].x-objectSet[moveSet[j]].width/2 && objectSet[bulletSet[i]].x<=objectSet[moveSet[j]].x+objectSet[moveSet[j]].width/2 && objectSet[bulletSet[i]].y>=objectSet[moveSet[j]].y-objectSet[moveSet[j]].height/2 && objectSet[bulletSet[i]].y<=objectSet[moveSet[j]].y+objectSet[moveSet[j]].height/2){
    			objectSet[bulletSet[i]].destroy=1;
    			objectSet[moveSet[j]].life-=100;
    			if (objectSet[moveSet[j]].life<=0){
    			    objectSet[moveSet[j]].destroy=1;
    			}
    			collide=1;
    			break;
    		    }
    		}
    		if (collide==1){
    		    continue;
    		}
    		for (var j=0;j<otherSet.length;j++){
    		    if (objectSet[bulletSet[i]].belong==otherSet[j]){
    			continue;
    		    }
    		    if (objectSet[bulletSet[i]].x>=objectSet[otherSet[j]].x-objectSet[otherSet[j]].width/2 && objectSet[bulletSet[i]].x<=objectSet[otherSet[j]].x+objectSet[otherSet[j]].width/2 && objectSet[bulletSet[i]].y>=objectSet[otherSet[j]].y-objectSet[otherSet[j]].height/2 && objectSet[bulletSet[i]].y<=objectSet[otherSet[j]].y+objectSet[otherSet[j]].height/2){
    			objectSet[bulletSet[i]].destroy=1;
    			objectSet[otherSet[j]].life-=100;
    			if (objectSet[otherSet[j]].life<=0){
    			    objectSet[otherSet[j]].destroy=1;
    			}
    			collide=1;
    			break;
    		    }
    		}
    	    }	      
    	}
    }   
	      

    function destroy(){		  
    	var i=0;
    	while(i<bulletSet.length){
    	    if (objectSet[bulletSet[i]].destroy==1){
    		objectSet.splice(bulletSet[i],1);
    		for (var j=0;j<bulletSet.length;j++){
    		    if (bulletSet[j]>bulletSet[i]){
    			bulletSet[j]--;
    		    }
    		}
    		for (var j=0;j<moveSet.length;j++){
    		    if (moveSet[j]>bulletSet[i]){
    			moveSet[j]--;
    		    }
    		}
    		for (var j=0;j<otherSet.length;j++){
    		    if (otherSet[j]>bulletSet[i]){
    			otherSet[j]--;
    		    }
    		}
		for (var j=0;j<droneSet.length;j++){
    		    if (droneSet[j]>bulletSet[i]){
    			droneSet[j]--;
    		    }
    		}
    		bulletSet.splice(i,1);
    	    }
    	    else{
    		i++;
    	    }	
    	    i++;
    	}
    	i=0;
    	while(i<moveSet.length){
    	    if (objectSet[moveSet[i]].destroy==1){
    		objectSet.splice(moveSet[i],1);
    		for (var j=0;j<bulletSet.length;j++){
    		    if (bulletSet[j]>moveSet[i]){
    			bulletSet[j]--;
    		    }
    		}
    		for (var j=0;j<moveSet.length;j++){
    		    if (moveSet[j]>moveSet[i]){
    			moveSet[j]--;
    		    }
    		}
    		for (var j=0;j<otherSet.length;j++){
    		    if (otherSet[j]>moveSet[i]){
    			otherSet[j]--;
    		    }
    		}
		for (var j=0;j<droneSet.length;j++){
    		    if (droneSet[j]>moveSet[i]){
    			droneSet[j]--;
    		    }
    		}
		    
    		moveSet.splice(i,1);
    	    }
    	    else{
    		i++;
    	    }	
    	    i++;
    	}
    	i=0;
    	while(i<otherSet.length){
    	    if (objectSet[otherSet[i]].destroy==1){
    		objectSet.splice(otherSet[i],1);
    		for (var j=0;j<bulletSet.length;j++){
    		    if (bulletSet[j]>otherSet[i]){
    			bulletSet[j]--;
    		    }
    		}
    		for (var j=0;j<moveSet.length;j++){
    		    if (moveSet[j]>otherSet[i]){
    			moveSet[j]--;
    		    }
    		}
    		for (var j=0;j<otherSet.length;j++){
    		    if (otherSet[j]>otherSet[i]){
    			otherSet[j]--;
    		    }
    		}
		for (var j=0;j<droneSet.length;j++){
    		    if (droneSet[j]>otherSet[i]){
    			droneSet[j]--;
    		    }
    		}
		
		     
    		otherSet.splice(i,1);
    	    }
    	    else{
    		i++;
    	    }	
    	    i++;
    	}	      
    }

    function drawBackGround() {
        var destWidth = canvas.width;
        var destHeight = canvas.height;
        var destX = canvas.width / 2;
        var destY = canvas.height / 2;
        comrotateImage(0, map, UpperLeftX, UpperLeftY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);

    }

    function drawLoop() {
	if (mapload==1 && planeload==1 && castleload==1 && bulletload==1){
	    drawBackGround();
	    adjustDrones();
	    moves();
	    hitTest();
	    destroy();
	    draws();
	    if (otherSet.length==0){
		context.font = '60pt Calibri';
		context.textAlign= 'center';
		context.textBasline= 'middle';
		context.fillStyle = 'red';
		context.fillText('You Win!', canvas.width/2, canvas.height/2);		  
		return;
	    }
	}
	reqFrame(drawLoop);	
    }

    function doKey(evt) {
	switch (evt.charCode){
	case 44:
	launchBullet();
	break;
	case 46:
	launchDrone();
	break;
	case 119:
	for (var i = 0; i < moveSet.length; i++) {
	    var vx = objectSet[moveSet[i]].speed * Math.cos(objectSet[moveSet[i]].rot);
	    var vy = -objectSet[moveSet[i]].speed * Math.sin(objectSet[moveSet[i]].rot);
	    if (vy>1){
		vy=vy*0.02;
	    }
	    else{
		vy-=0.5;
	    }
	    if (vx*vx+vy*vy>speedLimit*speedLimit){
		vx*=speedLimit/Math.sqrt(vx*vx+vy*vy);
		vy*=speedLimit/Math.sqrt(vx*vx+vy*vy);		
	    }
	    objectSet[moveSet[i]].speed=Math.sqrt(vx*vx+vy*vy);
	    objectSet[moveSet[i]].rot=-Math.atan2(vy,vx);
	    objectSet[moveSet[i]].rotToDxDy();
	}
	break;
	case 115:
	for (var i = 0; i < moveSet.length; i++) {
	    var vx = objectSet[moveSet[i]].speed * Math.cos(objectSet[moveSet[i]].rot);
	    var vy = -objectSet[moveSet[i]].speed * Math.sin(objectSet[moveSet[i]].rot);
	    if (vy<-1){
		vy=vy*0.02;
	    }
	    else{
		vy+=0.5;
	    }
	    if (vx*vx+vy*vy>speedLimit*speedLimit){
		vx*=speedLimit/Math.sqrt(vx*vx+vy*vy);
		vy*=speedLimit/Math.sqrt(vx*vx+vy*vy);	
	    }
	    objectSet[moveSet[i]].speed=Math.sqrt(vx*vx+vy*vy);
	    objectSet[moveSet[i]].rot=-Math.atan2(vy,vx);
	    objectSet[moveSet[i]].rotToDxDy();
	}
	
	break;
	case 97:
	for (var i = 0; i < moveSet.length; i++) {
	    var vx = objectSet[moveSet[i]].speed * Math.cos(objectSet[moveSet[i]].rot);
	    var vy = -objectSet[moveSet[i]].speed * Math.sin(objectSet[moveSet[i]].rot);
	    if (vx>1){
		vx=vx*0.02;
	    }
	    else{
		vx-=0.5;
	    }
	    if (vx*vx+vy*vy>speedLimit*speedLimit){
		vx*=speedLimit/Math.sqrt(vx*vx+vy*vy);
		vy*=speedLimit/Math.sqrt(vx*vx+vy*vy);		
	    }
	    objectSet[moveSet[i]].speed=Math.sqrt(vx*vx+vy*vy);
	    objectSet[moveSet[i]].rot=-Math.atan2(vy,vx);
	    objectSet[moveSet[i]].rotToDxDy();
	}
	break;
	case 100:
	for (var i = 0; i < moveSet.length; i++) {
	    var vx = objectSet[moveSet[i]].speed * Math.cos(objectSet[moveSet[i]].rot);
	    var vy = -objectSet[moveSet[i]].speed * Math.sin(objectSet[moveSet[i]].rot);
	    if (vx<-1){
		vx=vx*0.02;
	    }
	    else{
		vx+=0.5;
	    }
	    if (vx*vx+vy*vy>speedLimit*speedLimit){
		vx*=speedLimit/Math.sqrt(vx*vx+vy*vy);
		vy*=speedLimit/Math.sqrt(vx*vx+vy*vy);		
	    }
	    objectSet[moveSet[i]].speed=Math.sqrt(vx*vx+vy*vy);
	    objectSet[moveSet[i]].rot=-Math.atan2(vy,vx);
	    objectSet[moveSet[i]].rotToDxDy();
	}
	break;
	}
    }

    window.addEventListener("keypress", doKey, false);
    drawLoop();
}
