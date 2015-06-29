#A graphical presentation of sensor readings in an easy to view manner

###Features:
* Using only Javascript and HTML5 (No image files)
* Gauges, bars and graphs
* Mostly vectored graphics
* Easy to implement and customise
* Lots of predefined color gradients
* No dependencies

The  aim of the project is, eventually to present numbers without irrelevant information and in a manner that can be viewed with a glance.

![Overview](https://github.com/paragi/plib/blob/master/present.jpg)

#######Easy to use:
Define a HTML5 canvas tags, with a predefined size: 

    <canvas id="gauge1"  width="200" height="200" ></canvas>

Add a call to presentation lib, with some styling options:

    p.present("gauge1",0,"temperature","gauge color=tempout low=-50 high=50 prefix=\u00B0C");

Subsequent call (Without options) changes only the values as they occur:

    p.present("gauge1",12.5);

If the value is an array/object with multiple values, data will be displayed as a graph.
