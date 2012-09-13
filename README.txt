This is the first project of CS 679 Computer Game Technology.
Collaborators are Zhouyuan Li and Joey Francke
from University of Wisconsin-Madison.
Zhouyuan Li: lizy@cs.wisc.edu
Joey Francke: francke@cs.wisc.edu

In the first phase, we implemented a simple collision game of smiling face.
Without collision, a single smiling face satisfy the following physics law:
                 Vx=Constant
		 Vy^2+H=Constant
If it hits the ceiling,Vy is reversed. If it hits the side wall, Vx is reversed.
For collision, two smiling face satisfy totally elastic collision model, where the tangential velocities of them are not changed, but their normal velocities are swaped.

To play the game, You can press "enter" to pause or run the game.
Either in paused or running mode, to add a smiling face, click anywhere on the canvas that doesn't have a smiling face.
Either in paused or running mode, you can select a smiling face by holding ctrl button and clicking it. The selected face color will change to green, and its velocity becomes zero. 
After you  select a smiling face, you can use up,down,left,right button to move it. The mass of the selected smiling face is infinite so that any other smiling face that collide with it will just bump back.

Enjoy the game! 
