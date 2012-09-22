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
    var speedLimit = 10;
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
        draw: function () {
            simrotateImage(this.rot, this.img, this.x - UpperLeftX, this.y - UpperLeftY, this.width, this.height);
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
        obj.lastshoot = -1;
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
    var shootBullet = 0;
    var shootDrone = 0;
    var Wdown = 0;
    var Sdown = 0;
    var Adown = 0;
    var Ddown = 0;


    var map = new Image();
    map.src = 'map.png';
    map.onload = function () {
        mapload = 1;
    }
    var UpperLeftX = 0;
    var UpperLeftY = canvas.height / 2;
    var sourceWidth = map.width / 2;
    var sourceHeight = map.height / 2;

    var castle = new Image();
    var destWidth = 100;
    var destHeight = 100;
    var destX = 1.8*canvas.width;
    var destY = canvas.height;
    objectSet.push(makeObject(castle, 0, destX, destY, destWidth, destHeight, 0, 2000));
    otherSet.push(0);
    castle.src = 'castle.png';
    castle.onload = function () {
        castleload = 1;
    }

    var plane = new Image();
    destWidth = 111;
    destHeight = 70;
    destX = 50 + UpperLeftX;
    destY = canvas.height / 2 + UpperLeftY;
    objectSet.push(makeObject(plane, 0, destX, destY, destWidth, destHeight, 0, 100));
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
	     objectSet[moveSet[i]].moveNB();
	 }
        

        UpperLeftX = objectSet[moveSet[0]].x - canvas.width / 2;
        UpperLeftY = objectSet[moveSet[0]].y - canvas.height / 2;

        if (UpperLeftX < 0) { UpperLeftX = 0 }
        if (UpperLeftX > (map.width / sourceWidth - 1 ) * canvas.width) { UpperLeftX =  (map.width / sourceWidth - 1 ) * canvas.width}
        if (UpperLeftY < 0) { UpperLeftY = 0 }
        if (UpperLeftY > (map.height / sourceHeight - 1 ) * canvas.height) { UpperLeftY = (map.height / sourceHeight - 1 ) * canvas.height }

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
            if (objectSet[moveSet[i]].x >= map.width / sourceWidth  * canvas.width) {
                objectSet[moveSet[i]].x =  map.width / sourceWidth * canvas.width - 1;
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
            var time = (new Date()).getMilliseconds();
            if ((time - objectSet[otherSet[i]].lastshoot < 250 && time - objectSet[otherSet[i]].lastshoot && time - objectSet[otherSet[i]].lastshoot>=0) ||  (time - objectSet[otherSet[i]].lastshoot < -749 && time - objectSet[otherSet[i]].lastshoot && time - objectSet[otherSet[i]].lastshoot>=-999)){
                continue;
            }
            objectSet[otherSet[i]].lastshoot = time;

            droneSet.push(objectSet.length);
            objectSet.push(makeDrone(objectSet[otherSet[i]], 1));
        }
    }

    function launchBullet() {
        for (var i = 0; i < moveSet.length; i++) {
            var time = (new Date()).getMilliseconds();
	    if ((time - objectSet[moveSet[i]].lastshoot < 250 && time - objectSet[moveSet[i]].lastshoot && time - objectSet[moveSet[i]].lastshoot>=0) ||  (time - objectSet[moveSet[i]].lastshoot < -749 && time - objectSet[moveSet[i]].lastshoot && time - objectSet[moveSet[i]].lastshoot>=-999)){
                continue;
            }
            objectSet[moveSet[i]].lastshoot = time;

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
	    objectSet[droneSet[i]].rot=-Math.atan2(objectSet[droneSet[i]].dy,objectSet[droneSet[i]].dx);	    
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

    function BoundCheck(obj1,obj2){
	var xd=obj1.x-obj2.x;
	var yd=obj1.y-obj2.y;
	var ox=Math.cos(obj2.rot);
	var oy=-Math.sin(obj2.rot)
	if (Math.abs((xd*ox+yd*oy)/Math.sqrt(ox*ox+oy*oy))<obj2.width/2 && Math.abs((-oy*xd+ox*yd)/Math.sqrt(ox*ox+oy*oy))<obj2.height/2){
	    return 1;
	}
	return 0;
    }

	
	

    function hitTest() {
        for (var i = 0; i < bulletSet.length; i++) {
            if (objectSet[bulletSet[i]].x < 0 || objectSet[bulletSet[i]].x >= map.width / sourceWidth * canvas.width || objectSet[bulletSet[i]].y < 0 || objectSet[bulletSet[i]].y >= map.height / sourceHeight * canvas.height) {
                objectSet[bulletSet[i]].destroy = 1;
            }
	    
	    for (var j = 0; j < otherSet.length; j++) {
		if (BoundCheck(objectSet[bulletSet[i]],objectSet[otherSet[j]])){
		    objectSet[bulletSet[i]].destroy = 1;
		    objectSet[otherSet[j]].life -= 100;
		    if (objectSet[otherSet[j]].life <= 0) {
			objectSet[otherSet[j]].destroy = 1;
		    }
			break;
		}
	    }

	    for (var j = 0; j < droneSet.length; j++) {
		if (BoundCheck(objectSet[bulletSet[i]],objectSet[droneSet[j]])){
		    objectSet[bulletSet[i]].destroy = 1;
		    objectSet[droneSet[j]].destroy = 1;
		    break;
		}    
	    }
	}

	for (var i = 0; i < droneSet.length; i++) {           
	    for (var j = 0; j < moveSet.length; j++) {
		if (BoundCheck(objectSet[droneSet[i]],objectSet[moveSet[j]])){
		    objectSet[droneSet[i]].destroy = 1;
		    objectSet[moveSet[j]].life -= 5;		  
		    if (objectSet[moveSet[j]].life <= 0) {
			objectSet[moveSet[j]].destroy = 1;
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
        context.drawImage(map, UpperLeftX/xRatio, UpperLeftY/yRatio, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    }

    function react() {
        if (shootBullet == 1) {
            launchBullet();
        }
        if (shootDrone == 1) {
            launchDrone();
        }
        if (Wdown) {
            for (var i = 0; i < moveSet.length; i++) {
                objectSet[moveSet[i]].speed += acceleration;
                if (objectSet[moveSet[i]].speed > speedLimit) {
                    objectSet[moveSet[i]].speed = speedLimit;
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



    function drawLoop() {
        if (mapload == 1 && planeload == 1 && castleload == 1 && bulletload == 1) {
            drawBackGround();
            adjustDrones();
            react();
            moves();
            hitTest();
            destroy();
            draws();
            if (otherSet.length == 0) {
                context.font = '60pt Calibri';
                context.textAlign = 'center';
                context.textBasline = 'middle';
                context.fillStyle = 'red';
                context.fillText('You Win!', canvas.width / 2, canvas.height / 2);
                return;
            }
	    else{
		if (moveSet.length == 0){
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
        switch (evt.keyCode) {
            case 188:
                shootBullet = 1;
                break;
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
        }
    }

    function KeyUp(evt) {
        switch (evt.keyCode) {
            case 188:
                shootBullet = 0;
                break;
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
        }
    }

    window.addEventListener("keyup", KeyUp, false);
    window.addEventListener("keydown", KeyDown, false);
    drawLoop();
}
