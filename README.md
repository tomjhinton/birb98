# birb98

# birbAlbums
For @sableRaph's weekly Creative Coding Challenge. The Challenge topic was 'Windows 98 and other classic operating systems'.

- Took the 3D maze screensaver as a starting point.
- Had considered doing the pipe screensaver as a shader.
- Dismissed that as too hard because raymarching is harder than I am good with shaders.
- Had not considered properly that mazes are also hard.
- Found the textures.
- Did not feel bad about downloading the textures because I think Microsoft are doing OK these days.

Built the maze using Three.js and Cannon-Es. Created a block to act as the player and set the camera to follow that. Not the smoothest but sort of works.

- One of the potential topics this week was 'Noodle snake'
- Built a quick bowl of noodle snakes and stuck them in the maze.
- Used the rat from the original maze as a shoddy texture on a block.
- The aim is to head between them.
- In the original screensaver there was a diamond?(I think?) that turned things upside down.
- So each time you find the snake or the rat you turn upside down.
- The controls are backwards if you're upside down.
- Isn't that fun?

Getting this far proved relatively simple, left me with loads of time to get the next bit right. That was to make it so the maze was generative. As I write this the maze is still not generative.

[Here is how I should've made a maze.](https://weblog.jamisbuck.org/2015/10/31/mazes-blockwise-geometry.html
)

[Bunch of maze algorithms.](https://www.jamisbuck.org/mazes/)


- Tried many variations of generative process, never got it right so just hard coded a few.
- You can make it play a vaguley generative loop that changes each time you find a goal.
- That's tone.js with samples from Tidal Cycles.

[Meodai's take on Inigo Quilez Gradients](https://codepen.io/meodai/pen/MWEYqEb?editors=0010)
- Used this badly for my background again, you should have a look though, can definitely be used well.
