window.onload = function () {
    var reqFrame = window.requestAnimationFrame ||
	          window.webkitRequestAnimationFrame ||
	          window.mozRequestAnimationFrame ||
	          window.oRequestAnimationFrame ||
	          window.msRequestAnimationFrame ||
	          function (/* function FrameRequestCallback */callback, /* DOMElement Element */element) {
	              window.setTimeout(callback, 1000 / 60);
	          };
    var canvas = document.getElementById("mycanvas");
    var context = canvas.getContext("2d");

    var strokeColor = 'black';
    var circ = Math.PI * 2;

    // make everything go the same speed
    var speed = 4.0;

    var aBoid = {
        "x": 100,
        "y": 100,
        "vX": 10,
        "vY": 10,
        "color": 'yellow',
        "radius": 5,

        draw: function () {
            context.strokeStyle = strokeColor;
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, circ, true);
            context.moveTo(this.x, this.y);
            context.lineTo(this.x + 4 * this.vX, this.y + 4 * this.vY);
            context.closePath();
            context.stroke();
            context.fill();
        },

        move: function () {
            this.x += this.vX;
            this.y += this.vY;
            if (this.x > canvas.width) {
                if (this.vX > 0) {
                    this.vX = -this.vX;
                }
            }
            if (this.y > canvas.height) {
                if (this.vY > 0) {
                    this.vY = -this.vY;
                }
            }
            if (this.x < 0) {
                if (this.vX < 0) {
                    this.vX = -this.vX;
                }
            }
            if (this.y < 0) {
                if (this.vY < 0) {
                    this.vY = -this.vY;
                }
            }
        },

        norm: function () {
            var z = Math.sqrt(this.vX * this.vX + this.vY * this.vY);
            if (z < .001) {
                this.vX = (Math.random() - .5) * speed;
                this.vY = (Math.random() - .5) * speed;
                this.norm();
            } else {
                z = speed / z;
                this.vX *= z;
                this.vY *= z;
            }
        }
    };

    function makeBoid(x, y) {
        Empty = function () { };
        Empty.prototype = aBoid;
        boid = new Empty();
        boid.x = x;
        boid.y = y;
        return boid;
    }

    theBoids = [];
    for (var i = 0; i < 32; i++) {
        b = makeBoid(50 + Math.random() * 500, 50 + Math.random() * 300);
        theBoids.push(b)
    }
    for (var i = 0; i < 16; i++) {
        b = makeBoid(50 + Math.random() * 500, 50 + Math.random() * 300);
        b.color = 'orange';
        b.radius = 10;
        theBoids.push(b)
    }
    for (var i = 0; i < 8; i++) {
        b = makeBoid(50 + Math.random() * 500, 50 + Math.random() * 300);
        b.color = 'red';
        b.radius = 15;
        theBoids.push(b)
    }
    for (var i = 0; i < 4; i++) {
        b = makeBoid(50 + Math.random() * 500, 50 + Math.random() * 300);
        b.color = 'purple';
        b.radius = 20;
        theBoids.push(b)
    }

    function drawBoids() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < theBoids.length; i++) {
            theBoids[i].draw();
        }
    }

    function bounce(boidList) {

        for (var i = boidList.length - 1; i >= 0; i--) {
            var bi = boidList[i];
            var bix = bi.x;
            var biy = bi.y;
            for (var j = i - 1; j >= 0; j--) {
                var bj = boidList[j];
                var bjx = bj.x;
                var bjy = bj.y;
                var dx = bjx - bix;
                var dy = bjy - biy;
                var d = dx * dx + dy * dy;
                var impactDistance = (bi.radius + bj.radius)
                impactDistance *= impactDistance;
                if (d < impactDistance) {
                    bj.vX = dy;
                    bj.vY = dx;
                    bi.vX = -dx;
                    bi.vY = -dy;
                }
            }
        }
    }

    // Reynold's like alignment
    // each boid tries to make it's velocity to be similar to its neighbors
    // recipricol falloff in weight (allignment parameter + d
    // this assumes the velocities will be renormalized
    function align(boidList) {
        var ali = .6; // alignment parameter - between 0 and 1

        // make temp arrays to store results
        // this is inefficient, but the goal here is to make it work first
        var newVX = new Array(boidList.length);
        var newVY = new Array(boidList.length);

        // do the n^2 loop over all pairs, and sum up the contribution of each
        for (var i = boidList.length - 1; i >= 0; i--) {
            var bi = boidList[i];
            var bix = bi.x;
            var biy = bi.y;
            newVX[i] = 0;
            newVY[i] = 0;

            for (var j = boidList.length - 1; j >= 0; j--) {
                var bj = boidList[j];
                // compute the distance for falloff
                var dx = bj.x - bix;
                var dy = bj.y - biy;
                var d = Math.sqrt(dx * dx + dy * dy);
                // add to the weighted sum
                newVX[i] += (bj.vX / (d + ali));
                newVY[i] += (bj.vY / (d + ali));
            }
        }
        for (var i = boidList.length - 1; i >= 0; i--) {
            boidList[i].vX = newVX[i];
            boidList[i].vY = newVY[i];
        }
    }

    function moveBoids() {
        align(theBoids);
        bounce(theBoids);
        for (var i = 0; i < theBoids.length; i++) {
            theBoids[i].norm();
            theBoids[i].move();
        }
    }

    function doClick(evt) {
        theBoids.push(makeBoid(evt.pageX - canvas.offsetLeft,
								evt.pageY - canvas.offsetTop));
    }
    canvas.addEventListener("click", doClick, false);

    function drawLoop() {
        moveBoids();
        drawBoids();
        reqFrame(drawLoop);
    }
    drawLoop();
}