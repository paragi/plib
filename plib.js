/*============================================================================*\
  Grapichal presentation library for HTML5

  (c) Simon Rigét at Paragi

  Version 0.8.1
  
  Basicly free to use.

  A Javascript to present sensordata, using HTML5 canvas.

  Present sensordata etc. in an easy to view maner
  Aims to present numbers without irrelevant information and in a maner that can be viewed
  with a glance.

  A collection of graphical presentation of sensor readings 

  uses HTML5 canvas tags, with a predefined size. 
  The presentation are partially vectored to fit most resonable sizes


  temp settings
    indoor
    outdoor
    water
    hot water


  id value is an array/object a graph vill be displayed, if output emmelemt is a canvas
  
  Option object:
  
  display=<type> : Select display type
    n     : number
    b     : bar   
    g     : gauge 
    v     : verbal
  
  high=n  : High scale value
  low=n   : Low scale value (Make high-low divisible with 5 to get nice round numbers)

  prefix  : HTML string

  predefined color scale setting (Graphics)
  color | bgcolor = <type>   : Select scale color 
    tempout     : Temperatur scale outdoor
    tempin    : Temperatur scale indoor
    tempwater    : Water temperature 
    tempboiler    : Water boiler temperature 
    pressure : Pressur scale blue white red
    water    : water level scale
    light    : light (rainbow roygcbp)
    proces   : bluish yellow redish
    bgr    : blue green red
    byr    : blue yellow red
    gyr    : green yellow red
    rgr    : red green red
    rwr         : Red white red
    brightness  : dark to light
    humidity    : air humidity 0 - 100 % R
    filter      : Polution state white brown black 0 - 100%

  
  custom settings of predefined color scales
  sh<%>   : High end of scale where 0 it the top, 100 the bottom.
  sl<%>   : low end of scale where 0 it the top, 100 the bottom.
  bgsh<%>   : High end of scale where 0 it the top, 100 the bottom.
  bgsl<%>   : low end of scale where 0 it the top, 100 the bottom.

  Value can be a numeric value or an object; etiher as an array of numbers or 
  containing scalar arrays named y,[x],[z]
\*============================================================================*/

var p={};
// Supported types of data
p._types=['number','words','bytes','bits','temperature','presure','waterlevel'
  ,'volt','ampere','windspeed','speed'];

// Supported options
p._options=[ 'verbal', 'bar', 'gauge', 'graph', 'high', 'low', 'color', 'xhigh' , 'xlow'
  , 'colorhigh', 'colorlow', 'bgcolor', 'bgcolorhigh', 'bgcolorlow'
  , 'prefix', 'show_prefix', 'show_value', 'precision'
  , 'hand-color', 'outdoor','precision', 'indoor', 'hot-water'];


// Supported scale or background color gradients
p._colors=["tempout","tempin","tempwater","tempboiler","pressure","water","light","bgr","byr"
  ,"gyr","rgr"];

// Defaults values
p._defaults={
   valueChange:false
  ,graphicOut:false
  ,handColor:"#F00"
  ,precision:2
  ,high:100
  ,low:0
  ,colorhigh:100
  ,colorlow:0
  // [font style] [font weight] [#px (for font size)] [font face] 
  // basic font faces: arial, serif, sans-serif, cursive, fantasy, monospac, Century Gothic
  // ,font:"normal #px monospac"
 ,font:"normal #px Helvetica"
};

// Prefixes for very large and small numbers
p._prefix_small=['','m','&#181;','n','p','f','a','z','y'];
p._prefix_big=['','K','M','G','T','P','E','Z','Y','H'];
// for bytes: KMGTPEZYXWVU

// array of pressentations and there settings
p._elm={};

/*============================================================================*\
  Present a number or array
  type and options can be omitted on second call to function, with the same ID

  If value are not given, only the scale are presented\*============================================================================*/
p.present=function(id,val,type,opt){
  function error(text){
    throw new Error("p.present('"+id+"',"+val+",'"+type+"','"+opt+"') "+ text);
  }

  if(!id) error("Tag ID must be given");
  
  // Get pressentations settings
  if(typeof p._elm[id] === 'object'){
    var pres=p._elm[id];
    // See if we need to redraw the whole pressentation
    pres.valueChange= (typeof opt === 'undefined' || pres.opt==opt);
  }

  // Create new pressentation
  if(typeof pres !== 'object' || !pres.valueChange){
    var pres=p._elm[id]=Object.create(p._defaults);
    // Get tag element  
    pres.tag=document.getElementById(id);
    if(typeof pres.tag !== 'object') error("Parameter 1 must be a tag id");

    // See if its a canvas object
    if(typeof pres.tag.getContext === 'function') pres.graphicOut=true;

    // Store pressentation option string for later comparison
    pres.opt=opt;

  }

  // Process options
  if(!pres.valueChange){
    // Add option array to presention
    if(typeof opt ==='object'){
      for(var key in opt)
        if(key in p._options)
          pres[key]=opt[key];
        else
          console.error("option %s is not supported",key);
    // Interpret option string
    }else if(typeof opt === 'string'){
      var opta=opt.split(' ');
      var opte;
      for(var key in opta){
        opte=opta[key].split('=');
        if( p._options.indexOf(opte[0]) >= 0){
          if(typeof(opte[1]) !== 'undefined')
            pres[opte[0]]=opte[1];
          else
            pres[opte[0]]=true;
        }
      }
    }

    // Make graphic option values sane
    if(pres.graphicOut){
      //scale color gradient 
      if(!pres.color && p._colors.indexOf(type) >=0) pres.color=type;
      if(p._colors.indexOf(pres.color) === null) pres.color="pressur";

      // Make high low values into numbers
      pres.high=+(pres.high);
      pres.low=+(pres.low);
      if(pres.high<=pres.low) pres.low=pres.high-10;


      // Scale color preset
      pres.colorhigh = +(pres.colorhigh);
      pres.colorlow=+(pres.colorlow);
      if(pres.colorhigh<0) pres.colorhigh=0;
      if(pres.colorhigh>100) pres.colorhigh=100;
      if(pres.colorlow>100) pres.colorlow=100;
      if(pres.colorlow<1) pres.colorlow=1;    
      // Scale color preset
      if(pres.high<=pres.low) pres.low=pres.high-10;
    }
  }

  // Process value
  pres.val=val;  
  if(pres.prefix && pres.prefix.length>0) pres.show_prefix=true;;

  // Choose presentation engine
  if(pres.gauge && pres.graphicOut) p.gauge(pres);
  else if(pres.graph && pres.graphicOut) p.graph(pres);
  else if(pres.bar && pres.graphicOut) p.bar(pres);
  else if(pres.verbal) p.verbal(pres);
  else p.text(pres); // Default
}

/*============================================================================*\
  Gauge display 

  Make an overlay canvas to the canvas object that contains the actual value 
  part, so that simple changes in readout value dose not result in a total redraw.
  

Brug div tag og opret alle canvasses her
\*============================================================================*/
p.gauge= function(pres){

  // Set some dimentions
  if(pres.tag.offsetHeight>pres.tag.offsetWidth)
    var r=pres.tag.offsetWidth/2
  else
    var r=pres.tag.offsetHeight/2
  var rw=r/20;

  // Calculate font height
  var lenL=(p.humanizeNumber(pres.low,2)+'').length;
  var len=(p.humanizeNumber(pres.high,2)+'').length;
  if(lenL>len) len=lenL;
  var fh=parseInt(r/len/1.7);

  var noValue=(!pres.val && pres.val!==0);

  // Create layers
  if(!pres.diskLayer || !pres.valueLayer){
    pres.valueChange=false;
    // Add layers
    var housingLayer=p._addLayer(pres.tag).getContext("2d");
    pres.diskLayer=p._addLayer(pres.tag).getContext("2d");
    var scaleLayer=p._addLayer(pres.tag).getContext("2d");
    pres.valueLayer=p._addLayer(pres.tag).getContext("2d");

    // preset origin to center
    housingLayer.translate(pres.tag.offsetWidth/2,pres.tag.offsetHeight/2);
    pres.diskLayer.translate(pres.tag.offsetWidth/2,pres.tag.offsetHeight/2);
    scaleLayer.translate(pres.tag.offsetWidth/2,pres.tag.offsetHeight/2);
    pres.valueLayer.translate(pres.tag.offsetWidth/2,pres.tag.offsetHeight/2);

    scaleLayer.font=pres.font.replace("#", fh); 
  }

  // Draw static parts
  if(!pres.valueChange){
    // Housing

    housingLayer.lineWidth=0;
    housingLayer.strokeStyle="#888";

    // Outer ring 1
    // x0,y0,r0, x1,y1,r1
    var radial=housingLayer.createRadialGradient(r*0.6,r*0.6,r/3, r*0.6,r*0.6,r*2);
    radial.addColorStop(0,'#000');
    radial.addColorStop(1,'#999');
    housingLayer.fillStyle=radial;
    housingLayer.beginPath();
    housingLayer.arc(0,0,r,0,2*Math.PI);
    housingLayer.fill();
    housingLayer.closePath();

    // Outer ring 2
    var radial=housingLayer.createRadialGradient(-r*0.6,-r*0.6,r/3, -r*0.6,-r*0.6,r*2);
    radial.addColorStop(0,'#000');
    radial.addColorStop(1,'#999');
    housingLayer.fillStyle=radial;
    housingLayer.beginPath();
    housingLayer.arc(0,0,r-rw,0,2*Math.PI);
    housingLayer.fill();
    housingLayer.closePath();

    // Scales  

    // Make color scale as a semicirle of 270 degrees
    scaleLayer.save();
    // Set starting point
    scaleLayer.rotate(-Math.PI/4); 
    // Calculate length of scale
    var lt=(r-rw)*1.5*Math.PI, lc=lt/60;
    // make scale of small chuncks of the scale.
    for(var i=60; i>0; i--){
      scaleLayer.rotate(Math.PI/40);
      scaleLayer.beginPath();
      scaleLayer.rect(-r+2.5*rw,0,r/10,lc);
      scaleLayer.fillStyle=p._gradient(scaleLayer,pres.color,lt,i*lc-lc,pres.colorhigh,pres.colorlow);
      scaleLayer.fill();
      scaleLayer.closePath();
    }
    scaleLayer.restore();

    // Add markers 
    scaleLayer.save();
    scaleLayer.rotate(-Math.PI/4); 
    var lt=(r-rw)*4.5, lc=lt/60;
    scaleLayer.fillStyle="#eee";
    for(var i=0; i<11; i++){
      scaleLayer.beginPath();
      scaleLayer.rect(-r+6*rw,-r/70,r/10,r/35);
      scaleLayer.fill();
      scaleLayer.closePath();
      scaleLayer.rotate(Math.PI*0.15);
    }
    scaleLayer.restore();

    // Add numbers
    scaleLayer.fillStyle="#fff";
    for(var n=+(pres.low),i=0; i<6;n+=(pres.high-pres.low)/5,i++){
      nr=p.humanizeNumber(n,2)+'';
      // Calculate turn degrees
      var d=235-i*58;
      var x=Math.cos(-d*(Math.PI/180))*r*0.4-scaleLayer.measureText(nr).width/2 
      var y=Math.sin(-d*(Math.PI/180))*r*0.4+fh/5;
    scaleLayer.fillText(nr,x,y); 
    }
  }
  
 
  // Inner disc

  // Clear layer
  pres.diskLayer.clearRect(-r,-r,2*r,2*r);
  pres.diskLayer.beginPath();

  // Add light effect
  if(pres.val<=pres.high && pres.val>=pres.low){
    var radial=pres.diskLayer.createRadialGradient(-r/3,-r/3,r/6,-r*0.2,-r*0.2,r);
    radial.addColorStop(0,'#555');
    radial.addColorStop(1,'#111');
    pres.diskLayer.fillStyle=radial;
    pres.diskLayer.arc(0,0,r-2*rw,0,2*Math.PI);
    pres.diskLayer.fill();
    pres.diskLayer.closePath();
  }else{
    pres.diskLayer.fillStyle='#111';
    pres.diskLayer.arc(0,0,r-2*rw,0,2*Math.PI);
    pres.diskLayer.fill();
    pres.diskLayer.closePath();

    if(!noValue)
      // Too high
      if(pres.val>pres.high){
        // Make radial gradient
        // x0,y0,r0, x1,y1,r1
        var radial=pres.diskLayer.createRadialGradient(0,r,r*0.2,0,r*0.8,r*0.8);
        radial.addColorStop(0,'#fff');
        radial.addColorStop(0.2,'#fa0');
        radial.addColorStop(0.4,'#f22');
        radial.addColorStop(1,'#111');
        // Fill with gradient
        pres.diskLayer.fillStyle=radial;
        pres.diskLayer.beginPath();
        pres.diskLayer.arc(0,r*0.9,r,1.2*Math.PI,1.8*Math.PI);
        pres.diskLayer.arc(0,0,r-2*rw,0.17*Math.PI,0.83*Math.PI);
        pres.diskLayer.closePath();
        pres.diskLayer.fill();

      // Too low
      }else if(pres.val<pres.low){
        // Make radial gradient
        // x0,y0,r0, x1,y1,r1
        var radial=pres.diskLayer.createRadialGradient(0,r,r*0.2,0,r*0.8,r*0.8);
        radial.addColorStop(0,'#fff');
        radial.addColorStop(0.2,'#2af');
        radial.addColorStop(0.4,'#22f');
        radial.addColorStop(1,'#111');

        // Fill with gradient
        pres.diskLayer.fillStyle=radial;
        pres.diskLayer.beginPath();
        pres.diskLayer.arc(0,r*0.9,r,1.2*Math.PI,1.8*Math.PI);
        pres.diskLayer.arc(0,0,r-2*rw,0.17*Math.PI,0.83*Math.PI);
        pres.diskLayer.closePath();
        pres.diskLayer.fill();
      }
  }

  // Readings
  pres.valueLayer.clearRect(-r,-r,2*r,2*r);
  if(!noValue){
    // Clear layer
    pres.valueLayer.beginPath();

    // Add hand
    pres.valueLayer.lineWidth=r/50;
    pres.valueLayer.strokeStyle="#f00";
    var w=rw/3; hl=r-5*rw;

    // Limit value
    if(pres.val>pres.high)
      var d=-55;
    else if(pres.val<pres.low)
      var d=240;
    else
      var d=225-((pres.val-pres.low) * 270/(pres.high-pres.low));
   
    // Draw hand
    var dx=Math.cos(-d*(Math.PI/180)),dy=Math.sin(-d*(Math.PI/180));
    pres.valueLayer.moveTo(Math.cos((-d-90)*(Math.PI/180))*w,Math.sin((-d-90)*(Math.PI/180))*w);
    pres.valueLayer.lineTo(Math.cos(-d*(Math.PI/180))*hl,Math.sin(-d*(Math.PI/180))*hl);
    pres.valueLayer.shadowOffsetX=r/30;
    pres.valueLayer.shadowOffsetY=r/30;
    pres.valueLayer.shadowBlur=3;
    pres.valueLayer.shadowColor="black";
    pres.valueLayer.lineTo(Math.cos((-d+90)*(Math.PI/180))*w,Math.sin((-d+90)*(Math.PI/180))*w);
    // Draw the base of the hand
    pres.valueLayer.moveTo(3*w,0);
    pres.valueLayer.arc(0,0,3*w,0,2*Math.PI);
    pres.valueLayer.stroke(); 
    pres.valueLayer.shadowOffsetX=0;
    pres.valueLayer.shadowOffsetY=0;
    pres.valueLayer.shadowBlur=0;
    // Fill up hand
    pres.valueLayer.fillStyle="#f00";
    pres.valueLayer.fill();

    // Add center dot
    pres.valueLayer.beginPath();
    pres.valueLayer.arc(0,0,r/30,0,2*Math.PI);
    pres.valueLayer.fillStyle="#222";
    pres.valueLayer.fill();
    pres.valueLayer.closePath();
  }

  // Add textual value and/or prefix 
  var text='';
  if(pres.show_value && !noValue){ 
    // Decrease precision for very small numbers
    var o=parseFloat(((pres.high-pres.low)/25).toPrecision(1));  
    var n=(o+pres.val).toPrecision(pres.precision) - o ; 
    text=p.humanizeNumber(n,pres.precision);
  }
  if(pres.show_prefix) 
    text+=pres.prefix;

  if(text.length){
    pres.valueLayer.font=pres.font.replace("#", fh);
    pres.valueLayer.fillStyle="#ff8";
    pres.valueLayer.fillText(text,-pres.valueLayer.measureText(text).width/2,r*0.7); 
  }
}


/*============================================================================*\
  Bar display
  Temperature indicator with colored scale and numbers

  Parameters:
    Canvas ID
    Value
    High and low. Are maximum and minimum values of the scale shown.
    Color scale high and low. Defaults to +- 50 degree C
      Proper setting for Fahrenheit is  122 to -58




\*============================================================================*/
p.bar= function(pres){

  // Set some dimentions
  var fx;
  var width=pres.tag.width;
  var height=pres.tag.height;
  var text='';

  // Center frame
  if(height*0.5>=width)
    fx=0;
  else{
    fx=width/2-height/4;
    width=height/2;
  }
  
  // Set tube sizes and position
  var mx=fx+height*0.25
  var my=height*0.08
  var mw=height/7
  var mh=height*0.84;
  var mym=height*0.03;

  var fh=parseInt(height/12);
  var noValue=(!pres.val && pres.val!==0);

  // Create layers
  if(!pres.plateLayer || !pres.valueLayer || !pres.prefixLayer){
    pres.valueChange=false;
    // Add layers
    pres.plateLayer=p._addLayer(pres.tag).getContext("2d");
    var housingLayer=p._addLayer(pres.tag).getContext("2d");
    pres.valueLayer=p._addLayer(pres.tag).getContext("2d");
    pres.prefixLayer=p._addLayer(pres.tag).getContext("2d");

    // preset origin 
    pres.valueLayer.translate(mx,my-mym);

  }

  // Draw static part
  if(!pres.valueChange){
    // Draw outer frame
    housingLayer.clearRect(fx,0,width,height);
    housingLayer.lineWidth=height/100;
    housingLayer.strokeStyle="#888";
    housingLayer.fillStyle="#fff";
    housingLayer.font=pres.font.replace("#", fh);

    // Outer frame
    housingLayer.rect(fx,0,width,height);

    // Inner frame
    housingLayer.rect(mx-housingLayer.lineWidth/2,my-housingLayer.lineWidth/2-mym,mw+housingLayer.lineWidth,mh+housingLayer.lineWidth+2*mym);
    housingLayer.stroke(); 
    housingLayer.closePath();

    // Add scale markers and numbers
    housingLayer.beginPath();
    for(var y=my, n=pres.high,nr;y<=my+mh;y+=mh/4,n-=(pres.high-pres.low)/4){
      // Add marker
      housingLayer.moveTo(mx-height * 0.05 ,y); housingLayer.lineTo(mx + mw + height * 0.05,y);
      // Add number
      nr=p.humanizeNumber(n);
      housingLayer.fillText(nr,mx-height * 0.07-housingLayer.measureText(nr).width,y+fh/4); 
    }
    housingLayer.stroke(); 

    // Make empty tube
    housingLayer.translate(mx,my-mym);
    var grd=housingLayer.createLinearGradient(0,0,mw,0);
    grd.addColorStop("0","#444");
    grd.addColorStop(0.5,"#999");
    grd.addColorStop("1","#444");
    housingLayer.fillStyle=grd;
    housingLayer.fillRect(0,0,mw,mh+2*mym);
  }

  // Draw plate
  pres.plateLayer.fillStyle="#222";
  pres.plateLayer.fillRect(fx,0,width,height);

  // Add light effect
  if(pres.val<=pres.high && pres.val>=pres.low){
    var radial=pres.plateLayer.createRadialGradient(width/4,0,width/10,0,0,width);
    radial.addColorStop(0,'#555');
    radial.addColorStop(1,'#222');
    pres.plateLayer.fillStyle=radial;
    pres.plateLayer.fillRect(fx,0,width,height);

  // Too high
  }else if(!noValue)
    if(pres.val>pres.high){
      // Make radial gradient
      var radial=pres.plateLayer.createRadialGradient(mx+mw/2,0,width/5,mx+mw/2,0,width);
      radial.addColorStop(0,'#fff');
      radial.addColorStop(0.2,'#fa0');
      radial.addColorStop(0.4,'#f22');
      radial.addColorStop(1,'#111');
      // Fill with gradient
      pres.plateLayer.fillStyle=radial;
      pres.plateLayer.fillRect(fx,0,width,height);

    // Too low
    }else if(pres.val<pres.low){
      // Make radial gradient
      var radial=pres.plateLayer.createRadialGradient(mx+mw/2,height,width/5,mx+mw/2,height,width);
      radial.addColorStop(0,'#fff');
      radial.addColorStop(0.2,'#2af');
      radial.addColorStop(0.4,'#22f');
      radial.addColorStop(1,'#111');
     // Fill with gradient
      pres.plateLayer.fillStyle=radial;
      pres.plateLayer.fillRect(fx,0,width,height);
    }

  // Value  
  pres.valueLayer.clearRect(0,0,mw,mh+2*mym);
  
  if(!noValue){
    // Find starting coordinate of bar
    var gh=(pres.high-pres.val) * mh/(pres.high-pres.low) +mym;
    // Limit readout to tube coordinates
    if(gh>mh+2*mym) gh=mh+2*mym;
    else if (gh<0) gh=0; 
    
    // Make color column
    pres.valueLayer.fillStyle=p._gradient(pres.valueLayer,pres.color,mh,-mym,pres.colorhigh,pres.colorlow);
    
    // Make bar
    pres.valueLayer.fillRect(0,gh,mw,mh+2*mym-gh);

    // Make it look 3d 
    var grd=pres.valueLayer.createLinearGradient(0,0,mw,0);
    grd.addColorStop(0,"#222");
    grd.addColorStop(0.3,"transparent");
    grd.addColorStop(0.5,"transparent");
    grd.addColorStop(1,"black");
    pres.valueLayer.fillStyle=grd;
    pres.valueLayer.globalAlpha=0.6;
    pres.valueLayer.fillRect(0,gh,mw,mh+2*mym-gh);
    pres.valueLayer.globalAlpha=1;
  }

  // Add textual value and/or prefix 
  if(pres.show_value && !noValue){ 
    // Decrease precision for very small numbers
    var o=parseFloat(((pres.high-pres.low)/25).toPrecision(1));  
    var n=(o+pres.val).toPrecision(pres.precision) - o ; 
    text=p.humanizeNumber(n,pres.precision);
  } 
  if(pres.show_prefix) 
    text+=pres.prefix;

  if(text.length){
    pres.prefixLayer.clearRect(0,0,width,height);
    pres.prefixLayer.font=pres.font.replace("#", parseInt(height/12));
    pres.prefixLayer.fillStyle="#ff8";
    pres.prefixLayer.font=pres.font.replace("#", fh);

    pres.prefixLayer.fillText(text,fx+width/4-pres.prefixLayer.measureText(text).width/2,mh/4); 
  }
}


p.text= function(pres){
  // Make text
  if(pres.high && pres.low){
    // Decrease precision for very small numbers
    var o=(pres.high+pres.low)/50;  
    var n=((o+pres.val).toPrecision(pres.precision) - o).toPrecision(pres.precision);
  }else
    var n=pres.val;
  var text=p.humanizeNumber(n,pres.precision);
  if(pres.show_prefix) text+=pres.prefix;

  // Text on graphic element
  if(typeof(pres.tag.getContext) == 'function'){
    // Clear element
    var out=pres.tag.getContext("2d");
    out.clearRect(0,0,pres.tag.width,pres.tag.height);

//    out.font="Arial normal"; 
//console.log(out.font);
    //out.font-style='normal'   
    var fh=parseInt(pres.tag.width/(text.length));
    out.font=pres.font.replace("#", fh);
    out.fillStyle="#ff8";
    // Center text
    out.textBaseline = "middle";
    var x=(pres.tag.width-out.measureText(text).width)/2;
    var y=pres.tag.height/2;
    out.fillText(text,x,y); 

  // Textual element
  }else if(typeof pres.tag.innerHTML !== 'undefined')
    pres.tag.innerHTML=text;

  // Form element
  else if(typeof pres.tag.value !== 'undefined')
    pres.tag.value=text;

  else
    consol.error("Use a tag type that has an output");
};

p.verbal= function(pres){};

/*
  // Verbal presentation
  if(pres.verbal){
    if(typeof(val)=='object'){
       ;// Calculate /avr/min/max/significans etc.
    }
    // conver .toPrecision()
    //Translate numbers to text
    ;

  // Visual text presentation
  }else if(pres.text || !pres.graphicOut){
    if(typeof(val)=='object'){
      if(typeof(pres.tag.innerHTML) != 'undefined')
        ; // Make table
    }else {
      // Calculate /avr/min/max/significans etc.
      // pres.out=val ....
      ;
    }

  // Graphic presentation
  }else{ 
    // Make sane values
    if(typeof(val)=='object'){
      if(pres.gauge || pres.bar){
        // Calculate /avr/min/max
      }
    }else{
      ;
    }
*/

/*============================================================================*\
  Graph display

  Assume values are between 0 - 100 if not specified
\*============================================================================*/
p.graph= function(pres){

  // Y Values
  var yval;
  if(!isNaN(pres.val)) yval=[pres.val];
  else if(pres.val instanceof Array) yval=pres.val;
  else if(pres.val.y instanceof Array) yval=pres.val.y;

  // Create layers
  if(!pres.gritLayer || !pres.valueLayer){
    pres.valueChange=false;
    // Add layers
    pres.gritLayer=p._addLayer(pres.tag).getContext("2d");
    pres.valueLayer=p._addLayer(pres.tag).getContext("2d");
  }
  
  // Draw grit and scales
  if(!pres.valueChange){
    // Set some dimentions
    var width=pres.tag.width;
    var height=pres.tag.height;
    var fh=parseInt(height/12);
    var mh=parseInt(height/48);
    var mw=mh;

    // Find min/max values
    if(pres.val.x instanceof Array)
      var xl=pres.val.x[0],xh=pres.val.x[0];
    else
      var xl=1,xh=yval.length;

    if(yval instanceof Array)
      var yl=yval[0],yh=yval[0];
    else
      var yl=yval,yh=yval;
      
    if(isNaN(pres.xlow) || isNaN(pres.xhigh) || isNaN(pres.low) || isNaN(pres.high)){
      if(yval instanceof Array){
        for(var i=1; i<yval.length; i++){
          if(isNaN(pres.low) && yl>yval[i]) yl=yval[i];
          if(isNaN(pres.high) && yh<yval[i]) yh=yval[i];
          if(pres.val.x instanceof Array){
            if(isNaN(pres.xlow) && xl>pres.val.x[i]) xl=pres.val.x[i];
            if(isNaN(pres.xhigh) && xh<pres.val.x[i]) xh=pres.val.x[i];
          }
        }
      }
      if(isNaN(pres.low)) pres.low=yl;
      if(isNaN(pres.high)) pres.high=yh;
      if(isNaN(pres.xlow)) pres.xlow=xl;
      if(isNaN(pres.xhigh)) pres.xhigh=xh;
    }

    // Find maximum y scale text width
    pres.gritLayer.font=pres.font.replace("#", fh);
    var step=(pres.high-pres.low)/4;
    for(var text,i=0,ytw=0;i<5;i++){
      text=p.humanizeNumber(pres.high-i*(pres.high-pres.low)/4, pres.precision);
      ytw=Math.max(ytw,pres.gritLayer.measureText(text).width); 
    }

    // Set upper left corner of graph
    var gx=ytw+2*mw;
    var gy=mh+fh/2;
    var gh=height-gy-2*mh-fh;
    var gw=width-gx-2*mw;

    // Graph background color
    if(pres.bgcolor){
      if(pres.bgcolor.charAt(0)=="#")
        pres.gritLayer.fillStyle=pres.bgcolor;
      else
       pres.gritLayer.fillStyle = 
         p._gradient(pres.gritLayer,pres.bgcolor,0,0,pres.bgcolorhigh,pres.bgcolorlow);
      pres.gritLayer.fillRect(0,0,width,height); 
    }

    // Draw axis
    pres.gritLayer.fillStyle ='#FFF'; 
    pres.gritLayer.fillRect(gx,gy,gw,gh); 
    pres.gritLayer.lineWidth=1+'px';
    pres.gritLayer.strokeStyle="#888";
    pres.gritLayer.beginPath();
    // Horisontal grit
    var x=gx, y=gy+gh, step=gh/4;
    for(;y>=gy;y-=step){
      pres.gritLayer.moveTo(x,y);
      pres.gritLayer.lineTo(x+gw,y);
    }
    pres.gritLayer.stroke();
    pres.gritLayer.closePath();

    // Add y scale values
    pres.gritLayer.textBaseline = "middle";
    for(var text,i=0;i<5;i++){
      // Place text
      text=p.humanizeNumber(pres.high-i*(pres.high-pres.low)/4, pres.precision);
      x=gx-pres.gritLayer.measureText(text).width-mw; 
      y=gy+i*gh/4;
      // Find background color
      var sample = pres.gritLayer.getImageData(x, y, 1, 1).data; 
      // Write with max contrast color
      pres.gritLayer.fillStyle=(sample[0]+sample[1]+sample[2]-383>0?'#000':'#fff');
      // if(sample[3]<127) add underlaying color
      //pres.gritLayer.fillStyle="#000";
      pres.gritLayer.fillText(text,x,y); 
    }

    // vertical grit and X axis
    var vl=(5*width/height);
    if(vl>yval.length) vl=yval.length;
    var x=gx, y=gy, step=gw/vl;
    pres.gritLayer.textBaseline = "top";
    pres.gritLayer.textAlign = 'center';
    for(var i=0;i<vl;i++, x+=step){
      pres.gritLayer.moveTo(x,y);
      pres.gritLayer.lineTo(x,y+gh);
      // Add scale values
      text=p.humanizeNumber(pres.xlow+i*(pres.xhigh-pres.xlow)/vl, pres.precision);
      pres.gritLayer.fillText(text,x,y+gh+2*mh);
    }
    pres.gritLayer.stroke();
    pres.gritLayer.closePath();

    // Set origin on value layer
    pres.valueLayer.translate(gx,gy);
    pres.valueLayer.lineJoin = 'round';
    pres.w=gw, pres.h=gh, pres.x=gx,pres.y=gy;
  }
 
  // Clear value layer
  pres.valueLayer.clearRect(-pres.x,-pres.y,pres.tag.width,pres.tag.height);
  var lw=parseInt(pres.tag.height/100) || 1;

  // Make array of curve values
  var curve=[];
  var yfactor=pres.h/(pres.high-pres.low);
  if(pres.xhigh && pres.xlow)
    var xfactor=pres.w/(pres.xhigh-pres.xlow);
  else 
    var xfactor=pres.w/(yval.length-1);
  var x=0;

  for(var i in yval){
    // boundaries check
    if(yval[i]>pres.high) yval[i]=pres.high;
    if(yval[i]<pres.low) yval[i]=pres.low;
    if(pres.val.x instanceof Array){
      x=pres.val.x[i];
      if(x>pres.xhigh) x=pres.xhigh;
      if(x<pres.xlow) x=pres.xlow;
      if(isNaN(x)) x=pres.xhigh;
      x=(x-pres.xlow)*xfactor;
    }else
      x=Number(i)*xfactor;
      
    // Convert to canvas values
    curve.push(Math.round(x),Math.round((pres.high-yval[i])*yfactor));
  } 
  // draw our cardinal spline
  pres.valueLayer.beginPath();
  if(curve.length>2){
    pres.valueLayer.moveTo(curve[0], curve[1]);
    pres.valueLayer.curve(curve,1,yval.length,false);
  }else{
    pres.valueLayer.moveTo(0, curve[1]);
    pres.valueLayer.lineTo(pres.w, curve[1]);
    x=pres.w;
  }
  pres.valueLayer.strokeStyle = '#6677cc';
  pres.valueLayer.lineWidth = lw;
  pres.valueLayer.stroke();

  // Add fill
  pres.valueLayer.fillStyle= 
    p._gradient(pres.valueLayer,pres.color,pres.h,0,pres.colorhigh,pres.colorlow);
  pres.valueLayer.lineTo(x,pres.h);
  pres.valueLayer.lineTo(0,pres.h);
  pres.valueLayer.lineTo(curve[0], curve[1]);
  pres.valueLayer.closePath();
  pres.valueLayer.fill();


  // Plot points
  pres.valueLayer.fillStyle = "rgba(100,120,200,0.3)";
  pres.valueLayer.fillStyle = "rgb(100,120,200)";
  pres.valueLayer.linewidth=1;
  pres.valueLayer.beginPath();
  for(var i=0; i<curve.length ; i+=2){
    pres.valueLayer.fillRect(curve[i]-lw,curve[i+1]-lw,lw*2,lw*2);
    pres.valueLayer.closePath();
    pres.valueLayer.fill();
  }

}

/*============================================================================*\
  Make a gradient  

  A color scale internally define colors in a range from 0 to 100% of scale
  The scale are expanded to fit the view size.
  0 is the top of the scale. eg hot. the reverse of what might be expected!

  Temp scale:
  The scale are made to show outdore temperatures in the range of -50 to 50 C
  (-58 to 122 F) 
  indoor setting: h/l = 15/50 for 15 to 30 C
  

  context , lowest shown level, scale size

  size:   the size in pixel of the view area
  offset: offset start of scale. Combined with size define high low
  high and low: change the balance of the scale to suite other purposes.
          values are in % of scale
  
\*============================================================================*/
p._gradient=function(ctx,name,size,offset,high,low){
  if(typeof size ==='undefined') size=100;
  if(typeof offset==='undefined') offset=0;
  if(typeof high==='undefined') high=0;
  if(typeof low ==='undefined') low=100;
//console.log("h %s, s %s",start,size);
 
// Get canvas context object
  if(typeof(ctx.createLinearGradient) != 'function') {
    console.error("p._gradient: context is not a canvas");
    return;
  }

  // Make sane values
  high=parseInt(high);
  low=parseInt(low);
  size=parseInt(size);
  offset=parseInt(offset);

  if(high<0) high=0;
  if(low>100) low=100;
  if(low+ 0 < high+ 0){ high=0; low=100;}
  if(offset>=size) offset=0;
  if(size<=0) size=100;
    
  // Expand scale so that visible range is within high to low
  size*=100/(low-high);
  offset+=size*high/100;

// console.log("name: %s - size: %s - offset: %s - high: %s - Low: %s",name,size,offset,high,low);

  var grd=ctx.createLinearGradient(0,-offset,0,size-offset);
  // Make temperature gradient scale (Based on -50 to 50 C)     

  switch(name){
    // Temp scale shows outdore temperatures in the range of -50 to 50 C (-58 to 122 F) 
    // indoor setting: h/l = 15/50 for 15 to 30 C
    case "tempout":
      grd.addColorStop("0","#505");
      grd.addColorStop(0.07,"#727");
      grd.addColorStop("0.14","#601");
      grd.addColorStop("0.23","red");
      grd.addColorStop("0.3","yellow");
      grd.addColorStop("0.4","green");
      grd.addColorStop("0.47","cyan");
      grd.addColorStop("0.5","white");
      grd.addColorStop("0.53","#08f");
      grd.addColorStop("0.6","#00b");
      grd.addColorStop("0.7","#005");
      grd.addColorStop("0.8","#80a");
      grd.addColorStop("0.9","#639");
      grd.addColorStop("1","white");
      break;
    case "tempin":
      grd.addColorStop("0","#601");
      grd.addColorStop("0.15","red");
      grd.addColorStop("0.5","yellow");
      grd.addColorStop("0.75","green");
      grd.addColorStop("1","cyan");
      break;
    case "tempboiler": 
      grd.addColorStop(0, '#F30');
      grd.addColorStop(0.45, '#fc1');
      grd.addColorStop(0.55, '#fc1');
      grd.addColorStop(1, '#07d');
      break;
    case "tempwater":
      grd.addColorStop(0, '#b44');
      grd.addColorStop(0.25, '#fc1');
      grd.addColorStop(0.6, '#094');
      grd.addColorStop(0.9, '#07d');
      grd.addColorStop(1, '#fff');
      break;
    case "light": // roygcbp
      grd.addColorStop(0, 'Violet');
      grd.addColorStop(1 / 6, 'Indigo');
      grd.addColorStop(2 / 6, 'blue');
      grd.addColorStop(3 / 6, 'green')
      grd.addColorStop(4 / 6, 'yellow');
      grd.addColorStop(5 / 6, 'orange');
      grd.addColorStop(1, 'red');
      break;
    case "brightness":
      grd.addColorStop(0, '#ffe');
      grd.addColorStop(0.5, '#eb1');
      grd.addColorStop(1, '#221');
      break;
     case "water":
      grd.addColorStop(0,'#fc1');
      grd.addColorStop(0.2,'#029');
      grd.addColorStop(0.5,'#07c');
      grd.addColorStop(0.9,'white');
      grd.addColorStop(1,'#c51');
      break;
    case "bgr":
      grd.addColorStop(0, 'red');
      grd.addColorStop(0.45, '#2a0');
      grd.addColorStop(0.55, '#2a0');
      grd.addColorStop(1, 'blue');
      break;
    case "rgr":
      grd.addColorStop(0, 'red');
      grd.addColorStop(0.45, '#2a0');
      grd.addColorStop(0.55, '#2a0');
      grd.addColorStop(1, 'red');
      break;
    case "rwr":
      grd.addColorStop(0, 'red');
      grd.addColorStop(0.45, '#fff');
      grd.addColorStop(0.55, '#fff');
      grd.addColorStop(1, 'red');
      break;
    case "bwr":
      grd.addColorStop(0, 'red');
      grd.addColorStop(0.45, '#fff');
      grd.addColorStop(0.55, '#fff');
      grd.addColorStop(1, '#00F');
      break;
    case "byr":
      grd.addColorStop(0, 'red');
      grd.addColorStop(0.45, 'yellow');
      grd.addColorStop(0.55, 'yellow');
      grd.addColorStop(1, 'blue');
      break;
    case "gyr":
      grd.addColorStop(0, 'red');
      grd.addColorStop(0.45, 'yellow');
      grd.addColorStop(0.55, 'yellow');
      grd.addColorStop(1, '#2a0');
      break;
    case "process":
      grd.addColorStop("0.1","#d4a");
      grd.addColorStop("0.4","#fd4");
      grd.addColorStop("0.6","#fd4");
      grd.addColorStop("0.9","#76e");
      break;
    case "humidity":
      grd.addColorStop("0","#00F");
      grd.addColorStop("0.2","#76e");
      grd.addColorStop("0.9","#fd4");
      break;
    case "filter":
      grd.addColorStop(0.0,'#000');
      grd.addColorStop(0.1,'#c51');
      grd.addColorStop(0.8,'white');
      break;
    default:
      // pressure bwr
      grd.addColorStop("0","#08e");
      grd.addColorStop("0.4","#bFF");
      grd.addColorStop("0.6","#bFF");
      grd.addColorStop("1","#f00");
  }

  return grd;
}

/*============================================================================*\
  Canvas layer functions
\*============================================================================*/
p._addLayer=function(canvas){
  // Create layer stack
  if(!canvas._layerStack) canvas._layerStack=[];

  // Clone original canvas
  var i=canvas._layerStack.length;
  canvas._layerStack[i]=canvas.cloneNode(false);
  var layer=canvas._layerStack[i];

  // Set attributes specific for layers
  layer.style.position = "absolute";
  layer.style.margin = "0 0 0 0";
  layer.style.zIndex += i;
  layer.style.backgroundColor = "transparent";

  // Place layer on top of original
  var pos=p.absPos(canvas);
  layer.style.left=pos[0]+'px';  
  layer.style.top=pos[1]+'px';

  // Attach new layer to parent element
  canvas.offsetParent.appendChild(layer);

  // Redo placement on window resize
  // When implemented use "DOMAttrModified" event
  window.addEventListener('resize', function(event){
    var pos=p.absPos(canvas);
    layer.style.left=pos[0]+'px';  
    layer.style.top=pos[1]+'px';
  },canvas);

  return layer;
}

p.absPos=function (obj) {
	var curleft = curtop = 0;
  if (obj.offsetParent) do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
// console.log(obj.tagName,obj.style.margin,[curleft,curtop]);
  } while (obj = obj.offsetParent);
  return [curleft,curtop];
}

/*! Curve extension for canvas 2.1
* Epistemex (c) 2013-2014
* License: MIT
*/

/**
* Draws a cardinal spline through given point array. Points must be arranged
* as: [x1, y1, x2, y2, ..., xn, yn]. It adds the points to the current path.
*
* The method continues previous path of the context. If you don't want that
* then you need to use moveTo() with the first point from the input array.
*
* The points for the cardinal spline are returned as a new array.
*
* @param {Array} points - point array
* @param {Number} [tension=0.5] - tension. Typically between [0.0, 1.0] but can be exceeded
* @param {Number} [numOfSeg=20] - number of segments between two points (line resolution)
* @param {Boolean} [close=false] - Close the ends making the line continuous
* @returns {Array} New array with the calculated points that was added to the path
*/
CanvasRenderingContext2D.prototype.curve = function(points, tension, numOfSeg, close) {
  'use strict';
  // options or defaults
  tension = (typeof tension === 'number') ? tension : 0.5;
  numOfSeg = numOfSeg ? numOfSeg : 20;

  var pts,	// clone point array
  res = [],
  l = points.length, i,
  cache = [];
  pts = points.slice(0);	// TODO check if pre-push then concat is faster instead of slice and unshift
  if (close) {
    pts.unshift(points[l - 1]); // insert end point as first point
    pts.unshift(points[l - 2]);
    pts.push(points[0], points[1]); // first point as last point
  } else {
    pts.unshift(points[1]);	// copy 1. point and insert at beginning
    pts.unshift(points[0]);
    pts.push(points[l - 2], points[l - 1]);	// duplicate end-points
  }

  // cache inner-loop calculations as they are based on t alone
  cache.push([1, 0, 0, 0]);
  for (i = 1; i < numOfSeg; i++) {
    var st = i / numOfSeg,
    st2 = st * st,
    st3 = st2 * st,
    st23 = st3 * 2,
    st32 = st2 * 3;

    cache.push([
    st23 - st32 + 1,	// c1
    st32 - st23,	// c2
    st3 - 2 * st2 + st,	// c3
    st3 - st2	// c4
    ]);
  }
  cache.push([0, 1, 0, 0]);
  // calc. points
  parse(pts, cache);
  if (close) {
    //l = points.length;
    pts = [];
    pts.push(points[l - 4], points[l - 3], points[l - 2], points[l - 1]); // second last and last
    pts.push(points[0], points[1], points[2], points[3]); // first and second
    parse(pts, cache);
  }

  function parse(pts, cache) {
    for (var i = 2; i <= l; i += 2) {
      var pt1 = pts[i],
      pt2 = pts[i+1],
      pt3 = pts[i+2],
      pt4 = pts[i+3],
      t1x = (pt3 - pts[i-2]) * tension,
      t1y = (pt4 - pts[i-1]) * tension,
      t2x = (pts[i+4] - pt1) * tension,
      t2y = (pts[i+5] - pt2) * tension;
      for (var t = 0; t <= numOfSeg; t++) {
        var c = cache[t];
        res.push(c[0] * pt1 + c[1] * pt3 + c[2] * t1x + c[3] * t2x,
        c[0] * pt2 + c[1] * pt4 + c[2] * t1y + c[3] * t2y);
      }
    }
  }

  // add lines to path
  for(i = 0, l = res.length; i < l; i += 2)
    this.lineTo(res[i], res[i+1]);

  return res;
}

/*============================================================================*\
  Basic numeric function
\*============================================================================*/
/*============================================================================*\
  Time ago: show time differance in human readable form

https://github.com/taijinlee/humanize
\*============================================================================*/
/*
function time_ago($tm,$rcs = 1) {
   $cur_tm = time(); $dif = $cur_tm-$tm;
   $pds = array('second','minute','hour','day','week','month','year','decade','centurie','melina');
   $lngh = array(1,60,3600,86400,604800,2630880,31570560,315705600,3157056000,31570560000);
   for($v = sizeof($lngh)-1; ($v >= 0)&&(($no = $dif/$lngh[$v])<=1); $v--); if($v < 0) $v = 0; $_tm = $cur_tm-($dif%$lngh[$v]);
   $no = floor($no); if($no <> 1) $pds[$v] .='s'; $x=sprintf("%d %s ",$no,$pds[$v]);
   if(($rcs > 0)&&($v >= 1)&&(($cur_tm-$_tm) > 0)) $x .= time_ago($_tm, --$rcs);
   return $x;
}
*/


/*============================================================================*\
  Present a number in a humanly easy to read way by using prefixes for very large and 
  small numbers and by limiting numbers to a reasonable amount of significant digits.

  Returns a string

  Default base for order of magnitude = 1000
\*============================================================================*/

p.humanizeNumber=function(number,precision){

  if( typeof precision === 'undefined') precision=2;
  // Convert to exponential notation
  var f=Math.abs(number).toExponential(precision -1);

  // Extract mantissa and exponent
  var e=f.substring(f.indexOf('e')+1);
  var n=f.substring(0,f.indexOf('e'));

  // find magnitude and prefix
  if(e<-1){
    // Small numbers
    var prefix=p._prefix_small[~~(Math.abs(e-2)/3)];
    // Adjust mantissa to magnitude 
    if(prefix) n=n*Math.pow(10,(3+e%3)%3);

  }else{
    // Big numbers
    var prefix=p._prefix_big[~~(Math.abs(e)/3)];
    // Adjust mantissa to magnitude 
    if(prefix) n=n*Math.pow(10,e%3); 
  }

  // Assemble string
  if(!prefix) n=number;
  return Number(Number(n).toPrecision(precision)) + (prefix || '');
}


