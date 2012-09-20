
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
    var sight = 200;

    var object = {
        "img": null,
        "rot": 0,
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0,
        "targetx": 0, //when the player can move with arrow keys
        "targety": 0, //these should no longer be needed
        "dx": 0,
        "dy": 0,
        "speed": 0,
        draw: function () {
            simrotateImage(this.rot, this.img, this.x, this.y, this.width, this.height);
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
            this.dx = this.speed * Math.cos(obj.rot);
            this.dy = this.speed * -Math.sin(obj.rot);
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

    function makeObject(img, rot, x, y, width, height, targetx, targety, speed) {
        Empty = function () { };
        Empty.prototype = object; // don't ask why not ball.prototype=aBall;
        obj = new Empty();
        obj.img = img;
        obj.rot = rot;
        obj.x = x;
        obj.y = y;
        obj.width = width;
        obj.height = height;
        obj.targetx = targetx;
        obj.targety = targety;
        obj.speed = speed;
        obj.rotToDxDy();
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
        return obj;
    }

    var droneSet = [];
    var objectSet = [];
    var moveSet = [];
    var bulletSet = [];
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
    objectSet.push(makeObject(castle, 0, destX, destY, destWidth, destHeight, destX, destY, 0));
    castle.src = 'castle.png';
    castle.onload = function () {
        castleload = 1;
    }

    var plane = new Image();
    destWidth = 111;
    destHeight = 70;
    destX = 50;
    destY = canvas.height / 2;
    objectSet.push(makeObject(plane, 0, destX, destY, destWidth, destHeight, destX, destY, 10));
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


    function doClick(evt) {
        for (var i = 0; i < moveSet.length; i++) {
            objectSet[moveSet[i]].targetx = evt.pageX - canvas.offsetLeft;
            objectSet[moveSet[i]].targety = evt.pageY - canvas.offsetTop;
        }
    }

    function draws() {
        for (var i = 0; i < objectSet.length; i++) {
            //---------------------------------------------------------------------------------------------------
            //TO DO: add check for if object is visible (dont draw it if you cannot see it)
            //----------------------------------------------------------------------------------------------------
            objectSet[i].draw();
        }
        for (var i = 0; i < droneSet.length; i++) {
            droneSet[i].draw();
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
            var dx = objectSet[moveSet[i]].targetx - objectSet[moveSet[i]].x;
            var dy = objectSet[moveSet[i]].targety - objectSet[moveSet[i]].y;
            if (dy == 0 && dx == 0) {
            }
            else {
                objectSet[moveSet[i]].rot = -Math.atan2(dy, dx);
            }
            if (dx * dx + dy * dy > objectSet[moveSet[i]].speed * objectSet[moveSet[i]].speed) {
                objectSet[moveSet[i]].x += objectSet[moveSet[i]].speed * dx / Math.sqrt(dx * dx + dy * dy);
                objectSet[moveSet[i]].y += objectSet[moveSet[i]].speed * dy / Math.sqrt(dx * dx + dy * dy);
            }
            else {
                objectSet[moveSet[i]].x = objectSet[moveSet[i]].targetx;
                objectSet[moveSet[i]].y = objectSet[moveSet[i]].targety;
            }
            if (objectSet[moveSet[i]].x < sight) {
                UpperLeftX -= (sight - objectSet[moveSet[i]].x) / canvas.width * sourceWidth;
            }

            if (UpperLeftX < 0) {
                UpperLeftX = 0;
            }
            if (objectSet[moveSet[i]].x > canvas.width - 1 - sight) {
                UpperLeftX += (objectSet[moveSet[i]].x - (canvas.width - 1 - sight)) / canvas.width * sourceWidth;
            }
            if (UpperLeftX + sourceWidth > map.width - 1) {
                UpperLeftX = map.width - 1 - sourceWidth;
            }

            if (objectSet[moveSet[i]].y < sight) {
                UpperLeftY -= (sight - objectSet[moveSet[i]].y) / canvas.height * sourceHeight;
            }

            if (UpperLeftY < 0) {
                UpperLeftY = 0;
            }

            if (objectSet[moveSet[i]].y > canvas.height - 1 - sight) {
                UpperLeftY += (objectSet[moveSet[i]].y - (canvas.height - 1 - sight)) / canvas.height * sourceHeight;
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
            droneSet[i].moveB();
        }

        for (var i = 0; i < objectSet.length; i++) {
            objectSet[i].x -= (UpperLeftX - preX) / sourceWidth * canvas.width;
            objectSet[i].y -= (UpperLeftY - preY) / sourceHeight * canvas.height;
        }
        for (var i = 0; i < moveSet.length; i++) {
            objectSet[moveSet[i]].targetx -= (UpperLeftX - preX) / sourceWidth * canvas.width;
            objectSet[moveSet[i]].targety -= (UpperLeftY - preY) / sourceHeight * canvas.height;
        }
    }

    function launchDrone() {
        droneSet.push(makeDrone(objectSet[0], 1));
    }

    var ali = .9;
    function adjustDrones() {
        var newDX = new Array(droneSet.length);
        var newDY = new Array(droneSet.length);
        for (var i = droneSet.length - 1; i >= 0; i--) {
            var bi = droneSet[i];
            var bix = bi.x;
            var biy = bi.y;
            newDX[i] = 0;
            newDY[i] = 0;
            for (var j = droneSet.length - 1; j >= 0; j--) {
                var bj = droneSet[j];
                var dx = bj.x - bix;
                var dy = bj.y - biy;
                var d = Math.sqrt(dx * dx + dy * dy);
                newDX[i] += (bj.dx / (d + ali));
                newDY[i] += (bj.dy / (d + ali));
            }
        }
        for (var i = droneSet.length - 1; i >= 0; i--) {
            droneSet[i].dx = newDX[i];
            droneSet[i].dy = newDY[i];
        }
        bounce();
        for (var i = droneSet.length - 1; i >= 0; i--) {
            droneSet[i].normalize();
        }

    }

    function bounce() {

        for (var i = droneSet.length - 1; i >= 0; i--) {
            var bi = droneSet[i];
            var bix = bi.x;
            var biy = bi.y;
            for (var j = i - 1; j >= 0; j--) {
                var bj = droneSet[j];
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

    function destroy() {
        var i = 0;
        while (i < bulletSet.length) {
            if (objectSet[bulletSet[i]].x > (map.width - 1 - UpperLeftX) / sourceWidth * canvas.width || objectSet[bulletSet[i]].x < (0 - UpperLeftX) / sourceWidth * canvas.width || objectSet[bulletSet[i]].y > (map.height - 1 - UpperLeftY) / sourceHeight * canvas.height || objectSet[bulletSet[i]].y < (0 - UpperLeftY) / sourceHeight * canvas.height) {
                objectSet.splice(bulletSet[i], 1);
                for (var j = 0; j < bulletSet.length; j++) {
                    if (bulletSet[j] > bulletSet[i]) {
                        bulletSet[j]--;
                    }
                }
                bulletSet.splice(i, 1);
            }
            else {
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
        if (mapload == 1 && planeload == 1 && castleload == 1 && bulletload == 1) {
            drawBackGround();
            adjustDrones();
            moves();
            destroy();
            draws();
        }
        reqFrame(drawLoop);
    }

    function doShoot(evt) {
        if (evt.keyCode == 49) {
            for (var i = 0; i < moveSet.length; i++) {
                bulletSet.push(objectSet.length);
                objectSet.push(makeObject(bullet, objectSet[moveSet[i]].rot, objectSet[moveSet[i]].x, objectSet[moveSet[i]].y, 15, 5, 0, 0, 20));
            }
        }
        if (evt.keyCode == 32) {
            launchDrone();
        }
    }

    canvas.addEventListener("click", doClick, false);
    window.addEventListener("keydown", doShoot, false);
    drawLoop();
}