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
    var speedLimit = 6;
    var acceleration = .1;
    var rotationSpeed = .1;

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
        "destroy": 0,
        "lastshoot": 0,
        "ShieldTimer": 0,
        "shield": 0,
        draw: function () {
	    if (invulnerable != -1){
		
		if (this.img.length >=3){
		    simrotateImage(this.rot, this.img[2], this.x - UpperLeftX, this.y - UpperLeftY, this.width, this.height);
		}
		else{
		    simrotateImage(this.rot, this.img[0], this.x - UpperLeftX, this.y - UpperLeftY, this.width, this.height);
		}
	    }
	    else{		
		if (this.shield == 1) {
		    if (this.img.length >=2){		    
			simrotateImage(this.rot, this.img[1], this.x - UpperLeftX, this.y - UpperLeftY, this.width, this.height);
		    }
		    else{
			simrotateImage(this.rot, this.img[0], this.x - UpperLeftX, this.y - UpperLeftY, this.width, this.height);
		    }			
		}
		else{
		    simrotateImage(this.rot, this.img[0], this.x - UpperLeftX, this.y - UpperLeftY, this.width, this.height);
		}
	    }
            if (this.maxlife != 0) {
                var transX = this.x - UpperLeftX;
                var transY = this.y - UpperLeftY;
                context.fillStyle = 'red';
                context.beginPath();
                context.rect(transX - 0.3 * this.width, transY - 0.7 * this.height, 0.6 * this.life / this.maxlife * this.width, 0.1 * this.height);
                context.fill();
                context.fillStyle = 'black';
                context.beginPath();
                context.rect(transX - 0.3 * this.width + 0.6 * this.life / this.maxlife * this.width, transY - 0.7 * this.height, 0.6 * (1 - this.life / this.maxlife) * this.width, 0.1 * this.height);
                context.fill();
                context.lineWidth = 2;
                context.strokeStyle = 'white';
                context.beginPath();
                context.rect(transX - 0.3 * this.width, transY - 0.7 * this.height, 0.6 * this.width, 0.1 * this.height);
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
            if (this.x > map.width / sourceWidth * canvas.width) {
                if (this.dx > 0) {
                    this.dx = -this.dx;
                }
            }

            if (this.y > map.height / sourceHeight * canvas.height) {
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
        //modifies dx, dy so that direction is maintained and speed is what it should be
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

    function makeObject(img, rot, x, y, width, height, speed, maxlife) {
        Empty = function () { };
        Empty.prototype = object; // don't ask why not ball.prototype=aBall;
        obj = new Empty();
        obj.img=img;
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
        obj.lastshoot = -1;
        obj.ShieldTimer = -1;
        obj.shield = 0;
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
        obj.img = [];
	obj.img.push(bullet);
        obj.x = shooter.x;
        obj.y = shooter.y;
        obj.width = 15;
        obj.height = 5;
        obj.speed = 15;
        obj.dx = shootX  - shooter.x;
        obj.dy = shootY  - shooter.y;
        obj.normalize();
        obj.rot = -Math.atan2(obj.dy, obj.dx);
        return obj;
    }

    function makeDrone(launcher, rot) {
        Empty = function () { };
        Empty.prototype = object; // don't ask why not ball.prototype=aBall;
        obj = new Empty();
        obj.img = [];
	obj.img.push(plane);
        obj.rot = rot;
        obj.x = launcher.x;
        obj.y = launcher.y;
        obj.width = 30;
        obj.height = 10;
        obj.speed = 3;
        obj.rotToDxDy();
        obj.destroy = 0;
        return obj;
    }

    var objectSet;
    var moveSet;
    var bulletSet;
    var droneSet;
    var otherSet;
    var mapload=0;
    var castleload=0;
    var blackcastleload=0;
    var planeload=0;
    var bulletload=0;
    var shieldplaneload=0;
    var blackplaneload=0;
    var shootDrone;
    var Wdown;
    var Sdown;
    var Adown;
    var Ddown;
    var openShield;
    var explosion;
    var UpperLeftX;
    var UpperLeftY;
    var levelup;
    var invulnerable;
    var curLevel;
    var start = 0;
    var difficulty = 0;
    var state = 2;
    var maxLevel = 3;
    var exploded;
    var lifeleft;
    var SlowDownTimer;
    var SlowCenterX;
    var SlowCenterY;
    var VortexTimer;
    var VortexDragX;
    var VortexDragY;
    var MeteorTimer;
    var MeteorX;
    var MeteorY;
    var StrongHealth = 1;
    var ReflectDamage = 1;

    var map = new Image();
    map.src = 'map.png';
    map.onload = function () {
        mapload = 1;
    }
    var sourceWidth = map.width / 2;
    var sourceHeight = map.height / 2;

    var castle = new Image();
    castle.src = 'castle.png';
    castle.onload = function () {
        castleload = 1;
    }

    var blackcastle = new Image();
    blackcastle.src = 'blackcastle.png';
    blackcastle.onload = function () {
        blackcastleload = 1;
    }

    var plane = new Image();
    plane.src = 'plane.png';
    plane.onload = function () {
        planeload = 1;
    }

    var shieldplane = new Image();
    shieldplane.src = 'plane_shields.png';
    shieldplane.onload = function () {
        shieldplaneload = 1;
    }

    var blackplane = new Image();
    blackplane.src = 'blackplane.png';
    blackplane.onload = function () {
        blackplaneload = 1;
    }


    var bullet = new Image();
    bullet.src = 'bullet.png';
    bullet.onload = function () {
        bulletload = 1;
    }

    function init() {
        objectSet = [];
        moveSet = [];
        bulletSet = [];
        droneSet = [];
        otherSet = [];
        shootBullet = 0;
        shootDrone = 0;
        Wdown = 0;
        Sdown = 0;
        Adown = 0;
        Ddown = 0;
        openShield = 0;
        UpperLeftX = 0;
        UpperLeftY = canvas.height / 2;
        levelup = -1;
	invulnerable = -1;
	SlowDownTimer = -1;
	SlowCenterX = -1;
	SlowCenterY = -1;
	VortexTimer = -1;
	VortexDragX = -1;
	VortexDragY = -1;
	MeteorTimer = -1;
	MeteorX = [];
	MeteorY = [];
	exploded = 0;
	lifeleft = 3 - difficulty;
        var destWidth = 100;
        var destHeight = 100;
        var destX = 1.8 * canvas.width;
        var destY = canvas.height;
	var set=[];
	set.push(castle);
	set.push(blackcastle);
        objectSet.push(makeObject(set, 0, destX, destY, destWidth, destHeight, 0, 2000));
        otherSet.push(0);
        destWidth = 111;
        destHeight = 70;
        destX = 50 + UpperLeftX;
        destY = canvas.height / 2 + UpperLeftY;
	set=[];
	set.push(plane);
	set.push(shieldplane);
	set.push(blackplane);
        objectSet.push(makeObject(set, 0, destX, destY, destWidth, destHeight, 0, 100));
        moveSet.push(1);
    }

    function draws() {
        for (var i = 0; i < objectSet.length; i++) {
            if (objectSet[i].x > UpperLeftX - 10 && objectSet[i].x < UpperLeftX + 10 + canvas.width && objectSet[i].y > UpperLeftY - 10 && objectSet[i].y < UpperLeftY + 10 + canvas.height) {
                objectSet[i].draw();
            }
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
            objectSet[moveSet[i]].moveNB();
        }


        UpperLeftX = objectSet[moveSet[0]].x - canvas.width / 2;
        UpperLeftY = objectSet[moveSet[0]].y - canvas.height / 2;

        if (UpperLeftX < 0) { UpperLeftX = 0 }
        if (UpperLeftX > (map.width / sourceWidth - 1) * canvas.width) { UpperLeftX = (map.width / sourceWidth - 1) * canvas.width }
        if (UpperLeftY < 0) { UpperLeftY = 0 }
        if (UpperLeftY > (map.height / sourceHeight - 1) * canvas.height) { UpperLeftY = (map.height / sourceHeight - 1) * canvas.height }

        for (var i = 0; i < bulletSet.length; i++) {
            objectSet[bulletSet[i]].moveNB();
        }

        for (var i = 0; i < droneSet.length; i++) {
            objectSet[droneSet[i]].moveB();
        }

        for (var i = 0; i < moveSet.length; i++) {
            if (objectSet[moveSet[i]].x < 0) {
                objectSet[moveSet[i]].x = 0;
            }
            if (objectSet[moveSet[i]].x >= map.width / sourceWidth * canvas.width) {
                objectSet[moveSet[i]].x = map.width / sourceWidth * canvas.width - 1;
            }
            if (objectSet[moveSet[i]].y < 0) {
                objectSet[moveSet[i]].y = 0;
            }
            if (objectSet[moveSet[i]].y >= map.height / sourceHeight * canvas.height) {
                objectSet[moveSet[i]].y = map.height / sourceHeight * canvas.height - 1;
            }
        }
    }

    function launchDrone() {
        for (var i = 0; i < otherSet.length; i++) {
            var time = (new Date()).getTime();
            if (objectSet[otherSet[i]].lastshoot!=-1 && time - objectSet[otherSet[i]].lastshoot < 250 * (3.5 - difficulty)) {
                continue;
            }
            objectSet[otherSet[i]].lastshoot = time;

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

    function launchShield() {
        for (var i = 0; i < moveSet.length; i++) {
            var time = (new Date()).getTime();
	    if (objectSet[moveSet[i]].ShieldTimer !=-1 && time - objectSet[moveSet[i]].ShieldTimer < (6 + difficulty)*1000) {
		continue;
	    }
            objectSet[moveSet[i]].ShieldTimer = time;
            objectSet[moveSet[i]].shield = 1;
        }
    }

    function Explosion() {
	if (exploded ==0){
	    for (var i = 0; i < droneSet.length; i++) {
		objectSet[droneSet[i]].destroy = 1;
		exploded=1;
	    }
	}
    }
	

    var ali = .9;
    function adjustDrones() {
        var attraction = (difficulty + 1) * 5;
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

            var a = objectSet[moveSet[0]].x - objectSet[droneSet[i]].x;
            var b = objectSet[moveSet[0]].y - objectSet[droneSet[i]].y;
            var z = Math.sqrt(a * a + b * b);
            z = attraction * objectSet[droneSet[i]].speed / (z * z);
            objectSet[droneSet[i]].dx += a * z;
            objectSet[droneSet[i]].dy += b * z;

            objectSet[droneSet[i]].normalize();

            objectSet[droneSet[i]].rot = -Math.atan2(objectSet[droneSet[i]].dy, objectSet[droneSet[i]].dx);
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

    function BoundCheck(obj1, obj2) {
        var xd = obj1.x - obj2.x;
        var yd = obj1.y - obj2.y;
        var ox = Math.cos(obj2.rot);
        var oy = -Math.sin(obj2.rot)
        if (Math.abs((xd * ox + yd * oy) / Math.sqrt(ox * ox + oy * oy)) < obj2.width / 2 && Math.abs((-oy * xd + ox * yd) / Math.sqrt(ox * ox + oy * oy)) < obj2.height / 2) {
            return 1;
        }
        return 0;
    }




    function hitTest() {
	for (var i = 0; i < MeteorX.length; i++){
	    if (((objectSet[moveSet[0]].x - MeteorX[i]) * (objectSet[moveSet[0]].x - MeteorX[i]) + (objectSet[moveSet[0]].y - MeteorY[i]) * (objectSet[moveSet[0]].y - MeteorY[i])) < 900 ){
		if (invulnerable == -1){
		    if (objectSet[moveSet[0]].shield == 0 && otherSet.length != 0) {
			objectSet[moveSet[0]].life -= 1;
			if (objectSet[moveSet[0]].life <= 0) {
			    if (lifeleft == 0){
				objectSet[moveSet[0]].destroy = 1;
			    }
			    else{
				lifeleft --;
				objectSet[moveSet[0]].life = objectSet[moveSet[0]].maxlife;				    
				invulnerable=(new Date()).getTime();
			    }
			}
		    }
		}
		else{
		    if ((new Date()).getTime()-invulnerable >= 3000){
			invulnerable = -1;
		    }
		}
	    }
	}
		


        for (var i = 0; i < bulletSet.length; i++) {
            if (objectSet[bulletSet[i]].x < 0 || objectSet[bulletSet[i]].x >= map.width / sourceWidth * canvas.width || objectSet[bulletSet[i]].y < 0 || objectSet[bulletSet[i]].y >= map.height / sourceHeight * canvas.height) {
                objectSet[bulletSet[i]].destroy = 1;
            }

            for (var j = 0; j < otherSet.length; j++) {
                if (BoundCheck(objectSet[bulletSet[i]], objectSet[otherSet[j]])) {
		    if (objectSet[otherSet[0]].shield == 0){
			objectSet[bulletSet[i]].destroy = 1;
			objectSet[otherSet[j]].life -= 100;
		    }
		    if (invulnerable == -1){
			if (ReflectDamage != -1 && objectSet[moveSet[0]].shield == 0){	
			    objectSet[moveSet[0]].life -= 1;
			    if (objectSet[moveSet[0]].life <= 0) {
				if (lifeleft == 0){
				    objectSet[moveSet[0]].destroy = 1;
				}
				else{
				    lifeleft --;
				    objectSet[moveSet[0]].life = objectSet[moveSet[0]].maxlife;				    
				    invulnerable=(new Date()).getTime();
				}
			    }
			}
		    }
		    else{
			if ((new Date()).getTime()-invulnerable >= 3000){
			    invulnerable = -1;
			}
		    }

                    if (objectSet[otherSet[j]].life <= 0) {
                        objectSet[otherSet[j]].destroy = 1;
                    }		   
                    break;
                }
            }

            for (var j = 0; j < droneSet.length; j++) {
                if (BoundCheck(objectSet[bulletSet[i]], objectSet[droneSet[j]])) {
                    objectSet[bulletSet[i]].destroy = 1;
                    objectSet[droneSet[j]].destroy = 1;
                    break;
                }
            }
        }

        for (var i = 0; i < droneSet.length; i++) {
            for (var j = 0; j < moveSet.length; j++) {
                if (BoundCheck(objectSet[droneSet[i]], objectSet[moveSet[j]])) {
                    objectSet[droneSet[i]].destroy = 1;
		    if (invulnerable == -1){
			if (objectSet[moveSet[j]].shield == 0 && otherSet.length != 0) {
			    objectSet[moveSet[j]].life -= 5;
			    if (objectSet[moveSet[j]].life <= 0) {
				if (lifeleft == 0){
				    objectSet[moveSet[j]].destroy = 1;
				}
				else{
				    lifeleft --;
				    objectSet[moveSet[j]].life = objectSet[moveSet[j]].maxlife;				    
				    invulnerable=(new Date()).getTime();
				}
			    }
                        }
                    }
		    else{
			if ((new Date()).getTime()-invulnerable >= 3000){
			    invulnerable = -1;
			}
		    }
                    break;
                }
            }
        }
    }


    function destroy() {
        var i = 0;
        while (i < bulletSet.length) {
            if (objectSet[bulletSet[i]].destroy == 1) {
                objectSet.splice(bulletSet[i], 1);
                for (var j = 0; j < bulletSet.length; j++) {
                    if (bulletSet[j] > bulletSet[i]) {
                        bulletSet[j]--;
                    }
                }
                for (var j = 0; j < moveSet.length; j++) {
                    if (moveSet[j] > bulletSet[i]) {
                        moveSet[j]--;
                    }
                }
                for (var j = 0; j < otherSet.length; j++) {
                    if (otherSet[j] > bulletSet[i]) {
                        otherSet[j]--;
                    }
                }
                for (var j = 0; j < droneSet.length; j++) {
                    if (droneSet[j] > bulletSet[i]) {
                        droneSet[j]--;
                    }
                }
                bulletSet.splice(i, 1);
            }
            else {
                i++;
            }
        }
        i = 0;
        while (i < moveSet.length) {
            if (objectSet[moveSet[i]].destroy == 1) {
                objectSet.splice(moveSet[i], 1);
                for (var j = 0; j < bulletSet.length; j++) {
                    if (bulletSet[j] > moveSet[i]) {
                        bulletSet[j]--;
                    }
                }
                for (var j = 0; j < moveSet.length; j++) {
                    if (moveSet[j] > moveSet[i]) {
                        moveSet[j]--;
                    }
                }
                for (var j = 0; j < otherSet.length; j++) {
                    if (otherSet[j] > moveSet[i]) {
                        otherSet[j]--;
                    }
                }
                for (var j = 0; j < droneSet.length; j++) {
                    if (droneSet[j] > moveSet[i]) {
                        droneSet[j]--;
                    }
                }

                moveSet.splice(i, 1);
            }
            else {
                i++;
            }
        }
        i = 0;
        while (i < otherSet.length) {
            if (objectSet[otherSet[i]].destroy == 1) {
                objectSet.splice(otherSet[i], 1);
                for (var j = 0; j < bulletSet.length; j++) {
                    if (bulletSet[j] > otherSet[i]) {
                        bulletSet[j]--;
                    }
                }
                for (var j = 0; j < moveSet.length; j++) {
                    if (moveSet[j] > otherSet[i]) {
                        moveSet[j]--;
                    }
                }
                for (var j = 0; j < otherSet.length; j++) {
                    if (otherSet[j] > otherSet[i]) {
                        otherSet[j]--;
                    }
                }
                for (var j = 0; j < droneSet.length; j++) {
                    if (droneSet[j] > otherSet[i]) {
                        droneSet[j]--;
                    }
                }
                otherSet.splice(i, 1);
            }
            else {
                i++;
            }
        }

        i = 0;
        while (i < droneSet.length) {
            if (objectSet[droneSet[i]].destroy == 1) {
                objectSet.splice(droneSet[i], 1);
                for (var j = 0; j < bulletSet.length; j++) {
                    if (bulletSet[j] > droneSet[i]) {
                        bulletSet[j]--;
                    }
                }
                for (var j = 0; j < moveSet.length; j++) {
                    if (moveSet[j] > droneSet[i]) {
                        moveSet[j]--;
                    }
                }
                for (var j = 0; j < otherSet.length; j++) {
                    if (otherSet[j] > droneSet[i]) {
                        otherSet[j]--;
                    }
                }
                for (var j = 0; j < droneSet.length; j++) {
                    if (droneSet[j] > droneSet[i]) {
                        droneSet[j]--;
                    }
                }
                droneSet.splice(i, 1);
            }
            else {
                i++;
            }
        }
    }

    function drawBackGround() {
        var xRatio = canvas.width / sourceWidth;
        var yRatio = canvas.height / sourceHeight;
        context.drawImage(map, UpperLeftX / xRatio, UpperLeftY / yRatio, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    }

    function react() {
        if (shootBullet == 1) {
            launchBullet();
        }

        if (openShield == 1) {
            launchShield();
        }

	if (explosion == 1){
	    Explosion();
	}

        if (Wdown) {
            for (var i = 0; i < moveSet.length; i++) {
                objectSet[moveSet[i]].speed += acceleration;
		if (SlowCenterX != -1 && SlowCenterY != -1 && (objectSet[moveSet[i]].x - SlowCenterX)*(objectSet[moveSet[i]].x - SlowCenterX) + (objectSet[moveSet[i]].y - SlowCenterY)*(objectSet[moveSet[i]].y - SlowCenterY) < 100 * 100){
		    if (objectSet[moveSet[i]].speed > 0.2 * speedLimit) {
			objectSet[moveSet[i]].speed = 0.2 * speedLimit;
		    }
		}
		else{
		    if (objectSet[moveSet[i]].speed > speedLimit) {
			objectSet[moveSet[i]].speed = speedLimit;
		    }
		}		    
		    
                objectSet[moveSet[i]].rotToDxDy();
            }
        }
        if (Sdown) {
            for (var i = 0; i < moveSet.length; i++) {
                objectSet[moveSet[i]].speed -= 2 * acceleration;
                if (objectSet[moveSet[i]].speed < 0) {
                    objectSet[moveSet[i]].speed = 0;
                }
                objectSet[moveSet[i]].rotToDxDy();
            }
        }
        if (Adown) {
            for (var i = 0; i < moveSet.length; i++) {
                objectSet[moveSet[i]].rot += rotationSpeed;
                objectSet[moveSet[i]].rotToDxDy();
            }
        }
        if (Ddown) {
            for (var i = 0; i < moveSet.length; i++) {
                objectSet[moveSet[i]].rot -= rotationSpeed;
                objectSet[moveSet[i]].rotToDxDy();
            }
        }
    }

    function drawInformation() {
        context.font = '20pt Calibri';
        context.textAlign = 'center';
        context.textBasline = 'middle';
        context.fillStyle = 'white';
        context.fillText('Level       ' + curLevel, canvas.width / 2, 40);
	context.font = '15pt Calibri';
	context.fillStyle = 'yellow';		
	context.fillText('Explosion:' + (exploded ? 'used' : 'not used'), 120, 40); 
	var left=objectSet[moveSet[0]].ShieldTimer==-1?0:Math.max(Math.ceil((6+difficulty)-((new Date()).getTime()-objectSet[moveSet[0]].ShieldTimer)/1000),0);
	context.fillText('Next Shield in :' +  left.toString(), 120, 70);
	context.fillText('life remained:' + lifeleft.toString(), 120, 100);
	
	
    }

    function starting() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        if (state == 0) {
            context.fillStyle = 'red';
        }
        else {
            context.fillStyle = 'yellow';
        }
        context.rect(canvas.width / 2 - 150, canvas.height / 2 - 30, 300, 60);
        context.stroke();
        context.fill();
        context.beginPath();
        if (state == 1) {
            context.fillStyle = 'red';
        }
        else {
            context.fillStyle = 'yellow';
        }
        context.rect(canvas.width / 2 - 150, canvas.height / 2 + 70, 300, 60);
        context.stroke();
        context.fill();
        context.beginPath();
        if (state == 2) {
            context.fillStyle = 'red';
        }
        else {
            context.fillStyle = 'yellow';
        }
        context.rect(canvas.width / 2 - 150, canvas.height / 2 + 170, 300, 60);
        context.stroke();
        context.fill();
        context.font = '80pt Calibri';
        context.textAlign = 'center';
        context.fillStyle = 'black';
        context.textBaseline = 'middle';
        context.fillText('Protect Our Planet', canvas.width / 2, canvas.height / 2 - 100);
        context.font = '40pt Calibri';
        context.fillText('Instruction', canvas.width / 2, canvas.height / 2);
        context.font = '40pt Calibri';
        context.fillText('Difficulty', canvas.width / 2, canvas.height / 2 + 100);
        context.font = '40pt Calibri';
        context.fillText('Start', canvas.width / 2, canvas.height / 2 + 200);

    }

    function ending() {
        start = 4;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = '40pt Calibri';
        context.textAlign = 'center';
        context.textBasline = 'middle';
        context.fillStyle = 'black';
        context.fillText('You\'ve Defeated the Enemies!', canvas.width / 2, canvas.height / 2 - 100);
        context.fillText('Designer: Zhouyuan Li and Joseph Francke', canvas.width / 2, canvas.height / 2 + 100);
        context.font = '20pt Calibri';
        context.fillText('Press Enter to return to the menu', canvas.width / 2, canvas.height / 2 + 200);
    }

    function effect() {
	if (levelup != -1){
	    return;
	}
        for (var i = 0; i < moveSet.length; i++) {
            var time = (new Date()).getTime();
            if ((objectSet[moveSet[i]].ShieldTimer !=-1 && time - objectSet[moveSet[i]].ShieldTimer) >= 2000) {
                objectSet[moveSet[i]].shield = 0;
            }
        }

	var time = (new Date()).getTime();
	if (SlowDownTimer == -1){
	    SlowDownTimer = time;
	}
	else{
	    if (time - SlowDownTimer >= 6000 && time - SlowDownTimer < 10000){
		if (SlowCenterX == -1 && SlowCenterY == -1){
		    SlowCenterX = objectSet[moveSet[0]].x;
		    SlowCenterY = objectSet[moveSet[0]].y;
		}		    
		context.beginPath();
		context.fillStyle = 'green';
		context.arc(SlowCenterX - UpperLeftX, SlowCenterY - UpperLeftY, 100, 0, 2*Math.PI, false);
		context.fill();
	    }
	    else{
		if (time - SlowDownTimer >= 10000){
		    SlowDownTimer = time;
		    SlowCenterX = -1;
		    SlowCenterY = -1;
		}
	    }
	}

	if (VortexTimer == 1){
	    VortexTimer = time;
	}
	else{
	    if (time - VortexTimer >= 7500 && time - VortexTimer < 8000){
		if (VortexDragX == -1 && VortexDragY == -1){
		    VortexDragX = 0.035 * (objectSet[otherSet[0]].x - objectSet[moveSet[0]].x);
		    VortexDragY = 0.035 * (objectSet[otherSet[0]].y - objectSet[moveSet[0]].y);
		}
		objectSet[moveSet[0]].x += VortexDragX;
		objectSet[moveSet[0]].y += VortexDragY;
		if (SlowCenterX != -1 && SlowCenterY != -1){
		    SlowCenterX += VortexDragX;
		    SlowCenterY += VortexDragY;
		}
	    }
	    else{
		if (time - VortexTimer >= 8000){
		    VortexTimer = time;
		    VortexDragX = -1;
		    VortexDragY = -1;
		}
	    }
	}

	if (StrongHealth == 1){
	    objectSet[otherSet[0]].life += 0.002 * (objectSet[otherSet[0]].maxlife - objectSet[otherSet[0]].life);
	}

	if (objectSet[otherSet[0]].ShieldTimer == -1){
	    objectSet[otherSet[0]].ShieldTimer = time;
	}
	else{
	    if (time - objectSet[otherSet[0]].ShieldTimer >= 5000 && time - objectSet[otherSet[0]].ShieldTimer < 6000){
		objectSet[otherSet[0]].shield = 1;
	    }
	    else{
		if (time - objectSet[otherSet[0]].ShieldTimer >= 6000){
		    objectSet[otherSet[0]].ShieldTimer = time;
		    objectSet[otherSet[0]].shield = 0;
		}
	    }
	}

	if (MeteorTimer == -1){
	    MeteorTimer = time;
	}
	else{
	    if (time - MeteorTimer >= 2000 && time - SlowDownTimer < 4000){
		while (MeteorX.length <20 && MeteorY.length <20){
		    MeteorX.push(Math.random()*canvas.width + UpperLeftX);
		    MeteorY.push(Math.random()*canvas.height + UpperLeftY);
		}		    
		context.fillStyle = 'yellow';
		for (var i=0; i< MeteorX.length; i ++){
		    context.beginPath();
		    context.arc(MeteorX[i] - UpperLeftX, MeteorY[i] - UpperLeftY, 30, 0, 2*Math.PI, false);
		    context.fill();
		}
	    }
	    else{
		if (time - MeteorTimer >= 4000){
		    MeteorTimer = time;
		    MeteorX = [];
		    MeteorY = [];
		}
	    }
	}
	    
		    
	    
	    
		
	    



        launchDrone();
    }



    function drawLoop() {
        if (mapload == 1 && planeload == 1 && castleload == 1 && blackcastleload ==1 && bulletload == 1 && shieldplaneload == 1 && blackplaneload == 1) {
            drawBackGround();
            drawInformation();
            effect();
            adjustDrones();
            react();
            moves();
            hitTest();
            destroy();
            draws();
            if (otherSet.length == 0) {
                if (curLevel == maxLevel) {
                    ending();
                    return;
                }
                else {
                    context.font = '60pt Calibri';
                    context.textAlign = 'center';
                    context.textBasline = 'middle';
                    context.fillStyle = 'blue';
                    context.fillText('Level   ' + curLevel + '       Complete', canvas.width / 2, canvas.height / 2);
                    if (levelup == -1) {
                        levelup = (new Date()).getTime();
                    }
                    else {
                        if ((new Date()).getTime() - levelup >= 3000) {
                            curLevel++;
                            init();
                        }
                    }
                }
            }
            else {
                if (moveSet.length == 0) {
		    alert(lifeleft);
                    context.font = '60pt Calibri';
                    context.textAlign = 'center';
                    context.textBasline = 'middle';
                    context.fillStyle = 'red';
                    context.fillText('You Lose!', canvas.width / 2, canvas.height / 2);
                    return;
                }
            }
        }
        reqFrame(drawLoop);
    }

    function KeyDown(evt) {
        if (evt.keyCode != 116) {
            evt.preventDefault();
        }
        switch (evt.keyCode) {
            case 190:
                shootDrone = 1;
                break;
            case 87:
                Wdown = 1;
                break;
            case 83:
                Sdown = 1;
                break;
            case 65:
                Adown = 1;
                break;
            case 68:
                Ddown = 1;
                break;
            case 32:
                openShield = 1;
                break;
	    case 81:
	        explosion = 1;
	        break;
            case 38:
                if (start == 0) {
                    state = (state - 1 + 3) % 3;
                    starting();
                }
                else {
                    if (start == 2) {
                        difficulty = (difficulty - 1 + 4) % 4;
                        setDifficulty();
                    }
                }

                break;
            case 40:
                if (start == 0) {
                    state = (state + 1 + 3) % 3;
                    starting();
                }
                else {
                    if (start == 2) {
                        difficulty = (difficulty + 1 + 4) % 4;
                        setDifficulty();
                    }
                }
                break;

            case 13:
                if (start == 0) {
                    switch (state) {
                        case 0:
                            start = 1;
                            instruction();
                            break;
                        case 1:
                            start = 2;
                            setDifficulty();
                            break;
                        case 2:
                            start = 3;
                            curLevel = 1;
                            init();
                            drawLoop();
                            break;
                    }
                }
                else {
                    if (start == 1 || start == 2 || start == 4) {
                        start = 0;
                        starting();
                    }
                }
                break;
        }
    }

    function instruction() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillText('No intruction, press Enter to return', canvas.width / 2, canvas.height / 2);
    }

    function setDifficulty() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        if (difficulty == 0) {
            context.fillStyle = 'red';
        }
        else {
            context.fillStyle = 'yellow';
        }
        context.rect(canvas.width / 2 - 150, canvas.height / 2 - 130, 300, 60);
        context.stroke();
        context.fill();


        context.beginPath();
        if (difficulty == 1) {
            context.fillStyle = 'red';
        }
        else {
            context.fillStyle = 'yellow';
        }
        context.rect(canvas.width / 2 - 150, canvas.height / 2 - 30, 300, 60);
        context.stroke();
        context.fill();
        context.beginPath();
        if (difficulty == 2) {
            context.fillStyle = 'red';
        }
        else {
            context.fillStyle = 'yellow';
        }
        context.rect(canvas.width / 2 - 150, canvas.height / 2 + 70, 300, 60);
        context.stroke();
        context.fill();
        context.beginPath();
        if (difficulty == 3) {
            context.fillStyle = 'red';
        }
        else {
            context.fillStyle = 'yellow';
        }
        context.rect(canvas.width / 2 - 150, canvas.height / 2 + 170, 300, 60);
        context.stroke();
        context.fill();
        context.font = '40pt Calibri';
        context.textAlign = 'center';
        context.fillStyle = 'black';
        context.textBaseline = 'middle';
        context.fillText('Easy', canvas.width / 2, canvas.height / 2 - 100);
        context.font = '40pt Calibri';
        context.fillText('Normal', canvas.width / 2, canvas.height / 2);
        context.font = '40pt Calibri';
        context.fillText('Hard', canvas.width / 2, canvas.height / 2 + 100);
        context.font = '40pt Calibri';
        context.fillText('Very Hard', canvas.width / 2, canvas.height / 2 + 200);
    }

    var shootX = 0;
    var shootY = 0;

    function doClick(evt) {
	if (start==3){
	    shootX = evt.pageX - canvas.offsetLeft + UpperLeftX;
	    shootY = evt.pageY - canvas.offsetTop + UpperLeftY;
	    launchBullet();
	}
    }


    function KeyUp(evt) {
        switch (evt.keyCode) {
            case 190:
                shootDrone = 0;
                break;
            case 87:
                Wdown = 0;
                break;
            case 83:
                Sdown = 0;
                break;
            case 65:
                Adown = 0;
                break;
            case 68:
                Ddown = 0;
                break;
            case 32:
                openShield = 0;
                break;
	    case 81:
	        explosion = 0;
	        break;
        }
    }

    starting();
    window.addEventListener("keyup", KeyUp, false);
    window.addEventListener("keydown", KeyDown, false);
    canvas.addEventListener("click", doClick, false);
}
