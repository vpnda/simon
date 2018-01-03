- The main issue that I had was trying to avoid duplicating logic all over the place and make everything as uncoupled as I could.
	- Created multiple classes and the "easy task" turned out to be a really simple instance

- I was generating two event calls when the user failed and a new Simon instance was restarted.
	- Fixed it by adding a return statement that I missed but debugging async code is fun (specially when they wait a second bewteen calls)
	- Event loop is fun :D