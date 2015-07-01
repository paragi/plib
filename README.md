#A graphical presentation of numbers - easy to view at a glance.
Primarily for sensor readings.

Please join in, if you have anything to contribute!

###Features:
* Using only Javascript and HTML5 (No image files)
* Gauges, bars and graphs
* Mostly vectored graphics
* Easy to implement and customise
* Lots of predefined color gradients
* No dependencies
* All is done with just one simple funtion call

The aim of the project is to present numbers, without irrelevant information and in a manner that can be viewed with a glance.

![Overview](https://github.com/paragi/plib/blob/master/present.jpg)

#####Easy to use:
1 - Define a canvas tags, with the proper dimensions and an ID in you HTML:  

    <canvas id="gauge1" width="200" height="200" ></canvas>

2 - make a Javascript call to the present library function; 
use the ID, a value and some presentation options to  style it:

    p.present("gauge1",10,"gauge");

3 - When the value changes, call the present function again with the new value, but without styling options:

    p.present("gauge1",12.5);

You can have as many unique presentations on a page, as you like.


##### Option tester
Use the option tester page to fine tune your styling options and cut/paste it to your code.
(The generator is just a single html page, requiring the library)


