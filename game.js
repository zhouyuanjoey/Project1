window.onload = function () {
    var reqFrame = window.requestAnimationFrame ||
	          window.webkitRequestAnimationFrame ||
	          window.mozRequestAnimationFrame ||
	          window.oRequestAnimationFrame ||
	          window.msRequestAnimationFrame ||
	  function (/* function FrameRequestCallback */callback, /* DOMElement Element */element) {
	      window.setTimeout(callback, 20);
	  };

    var reqStart =
	  function (/* function FrameRequestCallback */callback, /* DOMElement Element */element) {
	      window.setTimeout(callback, 100);
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
        "shieldTimer": 0,
        "shield": 0,
        draw: function () {
            if (invulnerable != -1) {
                if (this.img.length >= 3) {
                    simrotateImage(this.rot, this.img[2], this.x - upperLeftX, this.y - upperLeftY, this.width, this.height);
                }
                else {
                    simrotateImage(this.rot, this.img[0], this.x - upperLeftX, this.y - upperLeftY, this.width, this.height);
                }
            }
            else {
                if (this.shield == 1) {
                    simrotateImage(this.rot, this.img[1], this.x - upperLeftX, this.y - upperLeftY, this.width, this.height);
                }
                else {
                    simrotateImage(this.rot, this.img[0], this.x - upperLeftX, this.y - upperLeftY, this.width, this.height);
                }
            }
            if (this.maxlife != 0) {
                var transX = this.x - upperLeftX;
                var transY = this.y - upperLeftY;
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
            if (this.x > 2 * canvas.width) {
                if (this.dx > 0) {
                    this.dx = -this.dx;
                }
            }

            if (this.y > 2 * canvas.height) {
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
        obj.shieldTimer = -1;
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
        obj.dx = shootX - shooter.x;
        obj.dy = shootY - shooter.y;
        obj.normalize();
        obj.rot = -Math.atan2(obj.dy, obj.dx);
        return obj;
    }

    function makeDrone(launcher, rot) {
        Empty = function () { };
        Empty.prototype = object; // don't ask why not ball.prototype=aBall;
        obj = new Empty();
        obj.img = [];
        obj.img.push(enemybullet);
        obj.rot = rot;
        obj.x = launcher.x;
        obj.y = launcher.y;
        obj.width = 45;
        obj.height = 15;
        obj.speed = 3;
        obj.rotToDxDy();
        obj.destroy = 0;
        return obj;
    }

    var objectSet; //all sets
    var moveSet;
    var bulletSet;
    var droneSet;
    var enemySet;

    var mapLoad = 0; // all loading check
    var enemyLoad = 0;
    var shieldEnemyLoad = 0;
    var planeLoad = 0;
    var bulletLoad = 0;
    var shieldplaneLoad = 0;
    var blackplaneLoad = 0;
    var enemybulletLoad = 0;
    var slowempLoad = 0;
    var meteorLoad = 0;

    var Wdown;
    var Sdown;
    var Adown;
    var Ddown;
    var openShield; //space bar
    var explosion; //Q button
    var explosionTimer;
    var droneTimer;

    var slowDownTimer; //skill timer
    var slowCenterX;
    var slowCenterY;
    var VortexTimer;
    var VortexDragX;
    var VortexDragY;
    var MeteorTimer;
    var MeteorX;
    var MeteorY;


    var upperLeftX = 0; //canvas coordinates
    var upperLeftY = canvas.height / 2;
    var startingMove = 0;

    var levelUp; //special circumstances, need to keep in mind in programming
    var invulnerable;

    var start = 0; //page index, 0 = starting page, 1 = instruction, 2 = difficulty, 3 = game, 4 = ending page
    var state = 2; //highlight option in starting page. 0 = instruction, 1 = difficulty, 2 = start

    var maxLevel = 6;
    var curLevel; //game parameter
    var difficulty = 0;
    var lifeLeft;
    var skillChosen;


    var map = new Image();
    map.src = 'map.png';
    map.onload = function () {
        mapLoad = 1;
    }

    var enemy = new Image();
    enemy.src = 'enemy.png';
    enemy.onload = function () {
        enemyLoad = 1;
    }

    var shieldEnemy = new Image();
    shieldEnemy.src = 'enemy_shields.png';
    shieldEnemy.onload = function () {
        shieldEnemyLoad = 1;
    }

    var plane = new Image();
    plane.src = 'plane.png';
    plane.onload = function () {
        planeLoad = 1;
    }

    var shieldplane = new Image();
    shieldplane.src = 'plane_shields.png';
    shieldplane.onload = function () {
        shieldplaneLoad = 1;
    }

    var blackplane = new Image();
    blackplane.src = 'plane_invulnerable.png';
    blackplane.onload = function () {
        blackplaneLoad = 1;
    }

    var enemybullet = new Image();
    enemybullet.src = 'bullet_enemy.png';
    enemybullet.onload = function () {
        enemybulletLoad = 1;
    }


    var bullet = new Image();
    bullet.src = 'bullet.png';
    bullet.onload = function () {
        bulletLoad = 1;
    }

    var slowemp = new Image();
    slowemp.src = 'emp_slow.png';
    slowemp.onload = function () {
        slowempLoad = 1;
    }

    var meteor = new Image();
    meteor.src = 'meteor.png';
    meteor.onload = function () {
        meteorLoad = 1;
    }



    function init() {
        objectSet = [];
        moveSet = [];
        bulletSet = [];
        droneSet = [];
        enemySet = [];

        Wdown = 0;
        Sdown = 0;
        Adown = 0;
        Ddown = 0;
        openShield = 0;
        explosion = 0;

        explosionTimer = -1;
        droneTimer = -1;

        slowDownTimer = -1;
        slowCenterX = -1;
        slowCenterY = -1;
        VortexTimer = -1;
        VortexDragX = -1;
        VortexDragY = -1;
        MeteorTimer = -1;
        MeteorX = [];
        MeteorY = [];

        upperLeftX = 0;
        upperLeftY = canvas.height / 2;

        levelUp = -1;
        invulnerable = -1;

        skillChosen = [];
        var skillLeft = [];
        for (var i = 0; i < 6; i++) {
            skillChosen.push(0);
            skillLeft.push(i);
        }
        for (var i = 0; i < curLevel; i++) {
            var skillPosition = Math.floor(Math.random() * skillLeft.length);
            skillChosen[skillLeft[skillPosition]] = 1;
            skillLeft.splice(skillPosition, 1);
        }
        var destWidth = 100;
        var destHeight = 100;
        var destX = Math.random() * 2 * canvas.width;
        var destY = Math.random() * 2 * canvas.height;
        var set = [];
        set.push(enemy);
        set.push(shieldEnemy);
        objectSet.push(makeObject(set, 0, destX, destY, destWidth, destHeight, 1, 2000));
        enemySet.push(0);
        destWidth = 111;
        destHeight = 70;
        destX = 50 + upperLeftX;
        destY = canvas.height / 2 + upperLeftY;
        set = [];
        set.push(plane);
        set.push(shieldplane);
        set.push(blackplane);
        objectSet.push(makeObject(set, 0, destX, destY, destWidth, destHeight, 0, 100));
        moveSet.push(1);
    }

    function draws() {
        for (var i = 0; i < objectSet.length; i++) {
            if (objectSet[i].x > upperLeftX - 30 && objectSet[i].x < upperLeftX + 30 + canvas.width && objectSet[i].y > upperLeftY - 30 && objectSet[i].y < upperLeftY + 30 + canvas.height) {
                objectSet[i].draw();
            }
        }
    }

    function moves() {
        var preX = upperLeftX;
        var preY = upperLeftY;
        //---------------------------------------------------------------------------------------------------------------
        //would like to replace your moves with what I wrote below and after this code snippet have code to center the camera on the player's ship
        /*
        for (var i = 0; i < moveSet.length; i++) {
        objectSet[i].moveB;
        }
        */
        //if we could do this for all non-stationary bojects that would be nice
        //---------------------------------------------------------------------------------------------------------------
        objectSet[moveSet[0]].moveNB();

        upperLeftX = objectSet[moveSet[0]].x - canvas.width / 2;
        upperLeftY = objectSet[moveSet[0]].y - canvas.height / 2;

        if (upperLeftX < 0) { upperLeftX = 0 }
        if (upperLeftX > canvas.width) { upperLeftX = canvas.width }
        if (upperLeftY < 0) { upperLeftY = 0 }
        if (upperLeftY > canvas.height) { upperLeftY = canvas.height }

        for (var i = 0; i < bulletSet.length; i++) {
            objectSet[bulletSet[i]].moveNB();
        }

        for (var i = 0; i < droneSet.length; i++) {
            objectSet[droneSet[i]].moveB();
        }


        if (objectSet[moveSet[0]].x < 0) {
            objectSet[moveSet[0]].x = 0;
        }
        if (objectSet[moveSet[0]].x >= 2 * canvas.width) {
            objectSet[moveSet[0]].x = 2 * canvas.width - 1;
        }
        if (objectSet[moveSet[0]].y < 0) {
            objectSet[moveSet[0]].y = 0;
        }
        if (objectSet[moveSet[0]].y >= 2 * canvas.height) {
            objectSet[moveSet[0]].y = 2 * canvas.height - 1;
        }

        if (levelUp == -1) {
            objectSet[enemySet[0]].dx = objectSet[1].x - objectSet[enemySet[0]].x;
            objectSet[enemySet[0]].dy = objectSet[1].y - objectSet[enemySet[0]].y;
	    if (objectSet[enemySet[0]].dx *objectSet[enemySet[0]].dx +objectSet[enemySet[0]].dy * objectSet[enemySet[0]].dy <10000){
		objectSet[enemySet[0]].dx=0;
		objectSet[enemySet[0]].dy=0;
	    }
	    else{
		objectSet[enemySet[0]].rot = -Math.atan2(objectSet[enemySet[0]].dy, objectSet[enemySet[0]].dx);
		objectSet[enemySet[0]].normalize();
		objectSet[enemySet[0]].moveNB();
	    }
        }
    }

    function launchDrone() {
        var time = (new Date()).getTime();
        if (droneTimer != -1 && time - droneTimer < 250 * (3.5 - difficulty)) {
            return;
        }
        droneTimer = time;
        droneSet.push(objectSet.length);
        objectSet.push(makeDrone(objectSet[enemySet[0]], Math.random() * Math.PI * 2));
    }

    function launchBullet() {
        bulletSet.push(objectSet.length);
        objectSet.push(makeBullet(objectSet[moveSet[0]]));
    }

    function launchShield() {
        if (objectSet[moveSet[0]].shieldTimer == -1) {
            objectSet[moveSet[0]].shieldTimer = (new Date()).getTime();
            objectSet[moveSet[0]].shield = 1;
        }
    }

    function launchExplosion() {
        if (explosionTimer == -1) {
            for (var i = 0; i < droneSet.length; i++) {
                objectSet[droneSet[i]].destroy = 1;
                explosionTimer = (new Date()).getTime();
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

        if (levelUp == -1 && objectSet[moveSet[0]].shield == 0) {
            for (var i = 0; i < MeteorX.length; i++) {
                if (invulnerable == -1) {
                    if (((objectSet[moveSet[0]].x - MeteorX[i]) * (objectSet[moveSet[0]].x - MeteorX[i]) + (objectSet[moveSet[0]].y - MeteorY[i]) * (objectSet[moveSet[0]].y - MeteorY[i])) < 900) {
                        objectSet[moveSet[0]].life -= 1;
                        if (objectSet[moveSet[0]].life <= 0) {
                            if (lifeLeft == 0) {
                                objectSet[moveSet[0]].destroy = 1;
                            }
                            else {
                                lifeLeft--;
                                objectSet[moveSet[0]].life = objectSet[moveSet[0]].maxlife;
                                invulnerable = (new Date()).getTime();
                            }
                        }
                    }
                }
            }
        }

        for (var i = 0; i < bulletSet.length; i++) {
            if (objectSet[bulletSet[i]].x < 0 || objectSet[bulletSet[i]].x >= 2 * canvas.width || objectSet[bulletSet[i]].y < 0 || objectSet[bulletSet[i]].y >= 2 * canvas.height) {
                objectSet[bulletSet[i]].destroy = 1;
            }

            if (levelUp == -1 && objectSet[enemySet[0]].shield == 0) {
                if (BoundCheck(objectSet[bulletSet[i]], objectSet[enemySet[0]])) {
                    objectSet[bulletSet[i]].destroy = 1;
                    objectSet[enemySet[0]].life -= 100;
                    if (invulnerable == -1 && skillChosen[5] == 1 && objectSet[moveSet[0]].shield == 0) {
                        objectSet[moveSet[0]].life -= 1;
                        if (objectSet[moveSet[0]].life <= 0) {
                            if (lifeLeft == 0) {
                                objectSet[moveSet[0]].destroy = 1;
                            }
                            else {
                                lifeLeft--;
                                objectSet[moveSet[0]].life = objectSet[moveSet[0]].maxlife;
                                invulnerable = (new Date()).getTime();
                            }
                        }
                    }

                    if (objectSet[enemySet[0]].life <= 0) {
                        objectSet[enemySet[0]].destroy = 1;
                        levelUp = (new Date()).getTime();
                    }
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

        if (objectSet[moveSet[0]].shield == 0) {
            for (var i = 0; i < droneSet.length; i++) {
                if (BoundCheck(objectSet[droneSet[i]], objectSet[moveSet[0]])) {
                    objectSet[droneSet[i]].destroy = 1;
                    if (invulnerable == -1 && levelUp == -1) {
                        objectSet[moveSet[0]].life -= 5;
                        if (objectSet[moveSet[0]].life <= 0) {
                            if (lifeLeft == 0) {
                                objectSet[moveSet[0]].destroy = 1;
                            }
                            else {
                                lifeLeft--;
                                objectSet[moveSet[0]].life = objectSet[moveSet[0]].maxlife;
                                invulnerable = (new Date()).getTime();
                            }
                        }
                    }
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

                if (moveSet[0] > bulletSet[i]) {
                    moveSet[0]--;
                }

                if (enemySet.length >= 1) {
                    if (enemySet[0] > bulletSet[i]) {
                        enemySet[0]--;
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


        if (objectSet[moveSet[0]].destroy == 1) {
            objectSet.splice(moveSet[0], 1);
            for (var j = 0; j < bulletSet.length; j++) {
                if (bulletSet[j] > moveSet[0]) {
                    bulletSet[j]--;
                }
            }

            if (enemySet.length >= 1) {
                if (enemySet[0] > moveSet[0]) {
                    enemySet[0]--;
                }
            }

            for (var j = 0; j < droneSet.length; j++) {
                if (droneSet[j] > moveSet[0]) {
                    droneSet[j]--;
                }
            }
            moveSet.splice(0, 1);
        }


        if (enemySet.length >= 1) {
            if (objectSet[enemySet[0]].destroy == 1) {
                objectSet.splice(enemySet[0], 1);
                for (var j = 0; j < bulletSet.length; j++) {
                    if (bulletSet[j] > enemySet[0]) {
                        bulletSet[j]--;
                    }
                }

                if (moveSet[0] > enemySet[0]) {
                    moveSet[0]--;
                }

                for (var j = 0; j < droneSet.length; j++) {
                    if (droneSet[j] > enemySet[0]) {
                        droneSet[j]--;
                    }
                }
                enemySet.splice(0, 1);
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

                if (moveSet[0] > droneSet[i]) {
                    moveSet[0]--;
                }

                if (enemySet.length >= 1) {
                    if (enemySet[0] > droneSet[i]) {
                        enemySet[0]--;
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
        var xRatio = canvas.width / map.width * 2;
        var yRatio = canvas.height / map.height * 2;
        context.drawImage(map, upperLeftX / xRatio, upperLeftY / yRatio, map.width / 2, map.height / 2, 0, 0, canvas.width, canvas.height);
    }

    function react() {
        if (openShield == 1) {
            launchShield();
        }

        if (explosion == 1) {
            launchExplosion();
        }

        if (Wdown) {

            objectSet[moveSet[0]].speed += acceleration;
            if (slowCenterX != -1 && slowCenterY != -1 && (objectSet[moveSet[0]].x - slowCenterX) * (objectSet[moveSet[0]].x - slowCenterX) + (objectSet[moveSet[0]].y - slowCenterY) * (objectSet[moveSet[0]].y - slowCenterY) < 100 * 100) {
                if (objectSet[moveSet[0]].speed > 0.2 * speedLimit) {
                    objectSet[moveSet[0]].speed = 0.2 * speedLimit;
                }
            }
            else {
                if (objectSet[moveSet[0]].speed > speedLimit) {
                    objectSet[moveSet[0]].speed = speedLimit;
                }
            }

            objectSet[moveSet[0]].rotToDxDy();

        }
        if (Sdown) {

            objectSet[moveSet[0]].speed -= 2 * acceleration;
            if (objectSet[moveSet[0]].speed < 0) {
                objectSet[moveSet[0]].speed = 0;
            }
            objectSet[moveSet[0]].rotToDxDy();

        }
        if (Adown) {

            objectSet[moveSet[0]].rot += rotationSpeed;
            objectSet[moveSet[0]].rotToDxDy();

        }
        if (Ddown) {

            objectSet[moveSet[0]].rot -= rotationSpeed;
            objectSet[moveSet[0]].rotToDxDy();

        }
    }

    function drawInformation() {
        context.font = '20pt Times New Roman';
        context.textAlign = 'center';
        context.textBasline = 'middle';
        context.fillStyle = "#00FF00";
        context.fillText('Level       ' + curLevel, canvas.width / 2, 40);
        context.font = '15pt Century';
        context.fillStyle = 'yellow';
        var left = explosionTimer == -1 ? 0 : Math.max(Math.ceil(10 + 2 * difficulty - ((new Date()).getTime() - explosionTimer) / 1000), 0);
        context.fillText('AutoHack Available in ' + left.toString() + ' seconds', 200, 40);
        left = objectSet[moveSet[0]].shieldTimer == -1 ? 0 : Math.max(Math.ceil(6 + difficulty - ((new Date()).getTime() - objectSet[moveSet[0]].shieldTimer) / 1000), 0);
        context.fillText('Shields Available in ' + left.toString() + ' seconds', 200, 70);
        context.fillText(lifeLeft.toString() + ' Lives Remained', 200, 100);
        context.fillStyle = 'red';
        var displayY = 40;

        if (skillChosen[0] == 1) {
            context.fillText('EMP field', 1100, displayY);
            displayY += 30;
        }
        if (skillChosen[1] == 1) {
            context.fillText('Vortex', 1100, displayY);
            displayY += 30;
        }
        if (skillChosen[2] == 1) {
            context.fillText('Strong Hull', 1100, displayY);
            displayY += 30;
        }
        if (skillChosen[3] == 1) {
            context.fillText('Shields', 1100, displayY);
            displayY += 30;
        }
        if (skillChosen[4] == 1) {
            context.fillText('Blink Torpedos', 1100, displayY);
            displayY += 30;
        }
        if (skillChosen[5] == 1) {
            context.fillText('Reflective Plating', 1100, displayY);
            displayY += 30;
        }


    }

    function drawButton() {
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = '40pt Arial';



        context.beginPath();
        if (state == 0) {
            context.fillStyle = 'orange';
        }
        else {
            context.fillStyle = 'white';
        }

        context.fillText('Instruction', canvas.width / 2, canvas.height / 2);
        context.fill();


        context.beginPath();
        if (state == 1) {
            context.fillStyle = 'orange';
        }
        else {
            context.fillStyle = 'white';
        }

        context.fillText('Difficulty', canvas.width / 2, canvas.height / 2 + 100);
        context.fill();

        context.beginPath();
        if (state == 2) {
            context.fillStyle = 'orange';
        }
        else {
            context.fillStyle = 'white';
        }

        context.fillText('Start', canvas.width / 2, canvas.height / 2 + 200);
        context.fill();
    }


    function starting() {
        if (start != 0) {
            return;
        }
        canvas.addEventListener("mousemove", doMove, false);
        if (mapLoad == 1) {
            var xRatio = canvas.width / map.width * 2;
            var yRatio = canvas.height / map.height * 2;
            if (upperLeftX / xRatio + startingMove + map.width / 2 <= map.width) {
                context.drawImage(map, upperLeftX / xRatio + startingMove, upperLeftY / yRatio, map.width / 2, map.height / 2, 0, 0, canvas.width, canvas.height);
            }
            else {
                context.drawImage(map, upperLeftX / xRatio + startingMove, upperLeftY / yRatio, map.width - upperLeftX / xRatio - startingMove, map.height / 2, 0, 0, (map.width - upperLeftX / xRatio - startingMove) * xRatio, canvas.height);
                context.drawImage(map, 0, upperLeftY / yRatio, -map.width / 2 + upperLeftX / xRatio + startingMove, map.height / 2, (map.width - upperLeftX / xRatio - startingMove) * xRatio, 0, (-map.width / 2 + upperLeftX / xRatio + startingMove) * xRatio, canvas.height);
            }
            context.font = '80pt serif';
            context.textAlign = 'center';
            context.fillStyle = 'green';
            context.textBaseline = 'middle';
            context.fillText('Protect Our Planet', canvas.width / 2, canvas.height / 2 - 150);
            drawButton();
            context.drawImage(plane, 200, 320, 150, 100);
            context.drawImage(enemy, 900, 270, 200, 200);

            startingMove += 0.5;
            startingMove = (startingMove + map.width) % map.width;
        }
        reqStart(starting);
    }

    function ending() {
        canvas.removeEventListener("mousemove", doMove, false);
        start = 4;
        if (moveSet.length != 0) {
            var xRatio = canvas.width / map.width;
            var yRatio = canvas.height / map.height;
            context.drawImage(map, 0, 0, map.width, map.height, 0, 0, canvas.width, canvas.height);
            context.font = '50pt Times New Roman';
            context.textAlign = 'center';
            context.textBasline = 'center';
            context.fillStyle = 'yellow';
            context.fillText('You\'ve Defeated the Enemies!', canvas.width / 2, canvas.height / 2 - 150);
            context.font = '40pt Times New Roman';

            context.fillText('Designers', canvas.width / 3, canvas.height / 2 - 66);

            context.fillText('Original Pixel Art', canvas.width / 3, canvas.height / 2 + 66);
            context.fillText('Flocking Algorithm', canvas.width / 3, canvas.height / 2 + 133);

            context.fillText(':', canvas.width / 2, canvas.height / 2 - 66);
            context.fillText(':', canvas.width / 2, canvas.height / 2);
            context.fillText(':', canvas.width / 2, canvas.height / 2 + 66);
            context.fillText(':', canvas.width / 2, canvas.height / 2 + 133);

            context.fillText('Zhouyuan Li   ', 2 * canvas.width / 3, canvas.height / 2 - 66);
            context.fillText('Joseph Francke', 2 * canvas.width / 3, canvas.height / 2);
            context.fillText('Lexy Wenzel   ', 2 * canvas.width / 3, canvas.height / 2 + 66);
            context.fillText('Mike Gleicher ', 2 * canvas.width / 3, canvas.height / 2 + 133);
            context.font = '20pt Times New Roman';
            context.fillText('Press Enter to return to the menu', canvas.width / 2, canvas.height / 2 + 200);
        }
        else {
            context.font = '60pt Times New Roman';
            context.textAlign = 'center';
            context.textBasline = 'middle';
            context.fillStyle = 'red';
            context.fillText('Game Over', canvas.width / 2, canvas.height / 2);
            context.font = '20pt Times New Roman';
            context.fillText('Press Enter to return to Main Page', canvas.width / 2, canvas.height / 2 + 100);
        }
    }

    function effect() {
        if (levelUp != -1) {
            return;
        }

        var time = (new Date()).getTime();
        if (objectSet[moveSet[0]].shieldTimer != -1) {
            if ((time - objectSet[moveSet[0]].shieldTimer) >= 2000 && (time - objectSet[moveSet[0]].shieldTimer) < (6 + difficulty) * 1000) {
                objectSet[moveSet[0]].shield = 0;
            }
            else {
                if ((time - objectSet[moveSet[0]].shieldTimer) >= 6000) {
                    objectSet[moveSet[0]].shieldTimer = -1;
                }
            }
        }

        if (invulnerable != -1 && time - invulnerable >= 3000) {
            invulnerable = -1;
        }

        if (explosionTimer != -1 && time - explosionTimer >= (10 + 2 * difficulty) * 1000) {
            explosionTimer = -1;
        }

        if (skillChosen[0] == 1) {

            if (slowDownTimer == -1) {
                slowDownTimer = time;
            }
            else {
                if (time - slowDownTimer >= 6000 && time - slowDownTimer < 10000) {
                    if (slowCenterX == -1 && slowCenterY == -1) {
                        slowCenterX = objectSet[moveSet[0]].x;
                        slowCenterY = objectSet[moveSet[0]].y;
                    }
                    simrotateImage((time % 5000) / 5000 * 2 * Math.PI, slowemp, slowCenterX - upperLeftX, slowCenterY - upperLeftY, 200, 200);
                }
                else {
                    if (time - slowDownTimer >= 10000) {
                        slowDownTimer = time;
                        slowCenterX = -1;
                        slowCenterY = -1;
                    }
                }
            }
        }

        if (skillChosen[1] == 1) {
            if (VortexTimer == 1) {
                VortexTimer = time;
            }
            else {
                if (time - VortexTimer >= 7500 && time - VortexTimer < 8000) {
                    if (VortexDragX == -1 && VortexDragY == -1) {
                        VortexDragX = 0.03 * (objectSet[enemySet[0]].x - objectSet[moveSet[0]].x);
                        VortexDragY = 0.03 * (objectSet[enemySet[0]].y - objectSet[moveSet[0]].y);
                    }
                    objectSet[moveSet[0]].x += VortexDragX;
                    objectSet[moveSet[0]].y += VortexDragY;
                }
                else {
                    if (time - VortexTimer >= 8000) {
                        VortexTimer = time;
                        VortexDragX = -1;
                        VortexDragY = -1;
                    }
                }
            }
        }

        if (skillChosen[2] == 1) {
            objectSet[enemySet[0]].life += 0.002 * (objectSet[enemySet[0]].maxlife - objectSet[enemySet[0]].life);
        }

        if (skillChosen[3] == 1) {

            if (objectSet[enemySet[0]].shieldTimer == -1) {
                objectSet[enemySet[0]].shieldTimer = time;
            }
            else {
                if (time - objectSet[enemySet[0]].shieldTimer >= 5000 && time - objectSet[enemySet[0]].shieldTimer < 6000) {
                    objectSet[enemySet[0]].shield = 1;
                }
                else {
                    if (time - objectSet[enemySet[0]].shieldTimer >= 6000) {
                        objectSet[enemySet[0]].shieldTimer = time;
                        objectSet[enemySet[0]].shield = 0;
                    }
                }
            }
        }

        if (skillChosen[4] == 1) {

            if (MeteorTimer == -1) {
                MeteorTimer = time;
            }
            else {
                if (time - MeteorTimer >= 2000 && time - MeteorTimer < 4000) {
                    while (MeteorX.length < 20 && MeteorY.length < 20) {
                        MeteorX.push(Math.random() * canvas.width + upperLeftX);
                        MeteorY.push(Math.random() * canvas.height + upperLeftY);
                    }
                    context.fillStyle = 'yellow';
                    for (var i = 0; i < MeteorX.length; i++) {
                        simrotateImage(0, meteor, MeteorX[i] - upperLeftX, MeteorY[i] - upperLeftY, 60, 60);
                    }
                }
                else {
                    if (time - MeteorTimer >= 4000) {
                        MeteorTimer = time;
                        MeteorX = [];
                        MeteorY = [];
                    }
                }
            }
        }

        launchDrone();
    }

    function drawLoop() {
        if (start != 3) {
            return;
        }
        canvas.removeEventListener("mousemove", doMove, false);
        if (mapLoad == 1 && planeLoad == 1 && enemyLoad == 1 && shieldEnemyLoad == 1 && bulletLoad == 1 && shieldplaneLoad == 1 && blackplaneLoad == 1 && enemybulletLoad == 1 && slowempLoad == 1 && meteorLoad == 1) {
            drawBackGround();
            drawInformation();
            effect();
            adjustDrones();
            react();
            moves();
            hitTest();
            destroy();
            draws();
            if (levelUp != -1) {
                if (curLevel == maxLevel) {
                    ending();
                }
                else {
                    context.font = '60pt Times New Roman';
                    context.textAlign = 'center';
                    context.textBasline = 'middle';
                    context.fillStyle = 'blue';
                    context.fillText('Level   ' + curLevel + '       Complete', canvas.width / 2, canvas.height / 2);
                    if ((new Date()).getTime() - levelUp >= 3000) {
                        curLevel++;
                        init();
                    }
                }
            }
            else {
                if (moveSet.length == 0) {
                    ending();
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
                }
                else {
                    if (start == 2) {
                        difficulty = difficulty - 1;
                        if (difficulty < 0) {
                            difficulty = 0;
                        }
                        setDifficulty();
                    }
                }

                break;
            case 37:
                if (start == 2) {
                    difficulty = difficulty - 1;
                    if (difficulty < 0) {
                        difficulty = 0;
                    }
                    setDifficulty();
                }


                break;
            case 40:
                if (start == 0) {
                    state = (state + 1 + 3) % 3;
                }
                else {
                    if (start == 2) {
                        difficulty = difficulty + 1;
                        if (difficulty > 3) {
                            difficulty = 3;
                        }
                        setDifficulty();
                    }
                }
                break;
            case 39:
                if (start == 2) {
                    difficulty = difficulty + 1;
                    if (difficulty > 3) {
                        difficulty = 3;
                    }
                    setDifficulty();
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
                            lifeLeft = 3 - difficulty;
                            init();
                            drawLoop();
                            break;
                    }
                }
                else {
                    if (start == 1 || start == 4) {
                        start = 0;
                        starting();
                    }
                    if (start == 2 && difficulty != 4) {
                        start = 0;
                        starting();
                    }
                }
                break;
        }
    }

    function instruction() {
        canvas.removeEventListener("mousemove", doMove, false);
        var xRatio = canvas.width / map.width;
        var yRatio = canvas.height / map.height;
        context.drawImage(map, 0, 0, map.width, map.height, 0, 0, canvas.width, canvas.height);
        context.textAlign = 'center';
        context.textBasline = 'middle';
        context.fillStyle = 'orange';
        context.font = '50pt Arial';
        context.fillText('Controls:', canvas.width / 2, canvas.height / 5);
        context.fillStyle = 'yellow';
        context.font = '20pt Arial';
        context.fillText('WASD keys control movement', canvas.width / 2, 3 * canvas.height / 8);
        context.fillText('Left mouseclick to fire weapons', canvas.width / 2, canvas.height / 2);
        context.fillText('Spacebar to deploy your shields, which will recharge over time', canvas.width / 2, 5 * canvas.height / 8);
        context.fillText('Q hacks enemy droids and causes them to self-destruct', canvas.width / 2, 3 * canvas.height / 4);
        context.font = '12pt Arial';
        context.fillText('*Warning* Enemy will likely develop increased security protocols', canvas.width / 2, 3 * canvas.height / 4 + 30);
        context.fillText('The autohack tool will probe for insecurities and alert you when you may launch another attack', canvas.width / 2, 3 * canvas.height / 4 + 50);
        context.textAlign = 'left';
        context.fillStyle = '#00FF00';
        context.font = '20pt Arial';
        context.fillText('Press Enter to return to Main Page', 3 * canvas.width / 5, 15 * canvas.height / 16);
    }

    function setDifficulty() {
        canvas.addEventListener("mousemove", doMove, false);
        var xRatio = canvas.width / map.width;
        var yRatio = canvas.height / map.height;
        context.drawImage(map, 0, 0, map.width, map.height, 0, 0, canvas.width, canvas.height);

        context.font = '60pt Times New Roman';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = 'green';
        context.fillText('Di', 150, 100);
        context.fillStyle = 'yellow';
        context.fillText('ffi', 220, 100);
        context.fillStyle = 'orange';
        context.fillText('cul', 300, 100);
        context.fillStyle = 'red';
        context.fillText('ty', 375, 100);


        context.font = '40pt Arial';
        if (difficulty == 0) {
            context.fillStyle = 'green';
        }
        else {
            context.fillStyle = 'white';
        }
        context.fillText('Easy', 250, 280);

        if (difficulty == 1) {
            context.fillStyle = 'yellow';
        }
        else {
            context.fillStyle = 'white';
        }
        context.fillText('Normal', 650, 150);

        if (difficulty == 2) {
            context.fillStyle = 'orange';
        }
        else {
            context.fillStyle = 'white';
        }
        context.fillText('Hard', 950, 300);

        if (difficulty == 3) {
            context.fillStyle = 'red';
        }
        else {
            context.fillStyle = 'white';
        }
        context.fillText('Insane', 850, 400);
    }

    var shootX = 0;
    var shootY = 0;
    var buttonLeft = 150;
    var buttonUp = 30;
    var buttonWidth = 300;
    var buttonHeight = 60;
    var buttonBias = 100;

    function doMove(evt) {
        shootX = evt.pageX - canvas.offsetLeft;
        shootY = evt.pageY - canvas.offsetTop;
        switch (start) {
            case 0:
                if (shootX >= canvas.width / 2 - buttonLeft && shootX <= canvas.width / 2 - buttonLeft + buttonWidth - 1 && shootY >= canvas.height / 2 - buttonUp && shootY <= canvas.height / 2 - buttonUp + buttonHeight - 1) {
                    state = 0;
                }
                else {
                    if (shootX >= canvas.width / 2 - buttonLeft && shootX <= canvas.width / 2 - buttonLeft + buttonWidth - 1 && shootY >= canvas.height / 2 - buttonUp + buttonBias && shootY <= canvas.height / 2 - buttonUp + buttonBias + buttonHeight - 1) {
                        state = 1;
                    }
                    else {
                        if (shootX >= canvas.width / 2 - buttonLeft && shootX <= canvas.width / 2 - buttonLeft + buttonWidth - 1 && shootY >= canvas.height / 2 - buttonUp + 2 * buttonBias && shootY <= canvas.height / 2 - buttonUp + 2 * buttonBias + buttonHeight - 1) {
                            state = 2;
                        }
                        else {
                            state = 3;
                        }
                    }
                }
                break;
            case 2:
                if (shootX >= 250 - 100 && shootX < 250 + 100 && shootY >= 280 - 30 && shootY < 280 + 30) {
                    difficulty = 0;
                    setDifficulty();
                }
                else {
                    if (shootX >= 650 - 100 && shootX < 650 + 100 && shootY >= 150 - 30 && shootY < 150 + 30) {
                        difficulty = 1;
                        setDifficulty();
                    }
                    else {
                        if (shootX >= 950 - 100 && shootX < 950 + 100 && shootY >= 300 - 30 && shootY < 300 + 30) {
                            difficulty = 2;
                            setDifficulty();
                        }
                        else {
                            if (shootX >= 850 - 100 && shootX < 850 + 100 && shootY >= 400 - 30 && shootY < 400 + 30) {
                                difficulty = 3;
                                setDifficulty();
                            }
                            else {
                                difficulty = 4;
                                setDifficulty();
                            }
                        }
                    }
                }
                break;
        }
    }

    function doClick(evt) {
        switch (start) {
            case 0:
                if (state == 0) {
                    start = 1;
                    instruction();
                }
                if (state == 1) {
                    start = 2;
                    setDifficulty();
                }
                if (state == 2) {
                    start = 3;
                    curLevel = 1;
                    lifeLeft = 3 - difficulty;
                    init();
                    drawLoop();
                }
                break;
            case 2:
                if (difficulty != 4) {
                    start = 0;
                    starting();
                }
                break;
            case 3:
                shootX = evt.pageX - canvas.offsetLeft + upperLeftX;
                shootY = evt.pageY - canvas.offsetTop + upperLeftY;
                launchBullet();
                break;
        }
    }


    function KeyUp(evt) {
        switch (evt.keyCode) {
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
