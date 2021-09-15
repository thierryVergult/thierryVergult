opayra = {};

function setCamera(scene) {
    
  const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 0, BABYLON.Vector3.Zero());   

  var bullseye = {};
  bullseye.x = ( opayra.algo.X + (opayra.algo.X + opayra.val.length)) / 2;
  bullseye.y = opayra.algo.yMax / 2;

  console.log( 'point: (x:' + bullseye.x + ' , y:' + bullseye.y + ')');
  
  camera.setPosition( new BABYLON.Vector3( bullseye.x, bullseye.y, -1));

  camera.setTarget(   new BABYLON.Vector3( bullseye.x, bullseye.y,  1));

  scene.activeCamera.radius = 7.5; // magic number, should be replaced / calculated
  
  //camera.inputs.remove(camera.inputs.attached.mousewheel);
  camera.wheelPrecision = 500; // makes zooming very slow, what I want
  
  camera.lowerAlphaLimit = - Math.PI * 6 / 8;
  camera.upperAlphaLimit = - Math.PI * 2 / 8;
  
  camera.lowerBetaLimit = Math.PI * 2 / 8;
  camera.upperBetaLimit = Math.PI * 6 / 8;

  camera.inertia = 0.5; // makes the scene rotating slower when the mouse is picking it
  
  camera.attachControl(scene.canvas, true);

  // no lights needed, since all emissive

  opayra.camera = camera; // good for later exploration of 'undocumented' features
}

function defineAnimation() {

  // define an animation to rotate the candy bars around the Y axis
  opayra.animBox = new BABYLON.Animation(
    "boxAnimation", // name
    "rotation.y", // property to animate
    30, // frames per second
    BABYLON.Animation.ANIMATIONTYPE_FLOAT, // datatype
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE // loopmode
  );

  opayra.animKeys = [];

  // these values will be set at run time, from the actual rotation.y value, plus or minus 90 degrees
  // so these values needs to be accessable in the rotation function, so store them in the opayra object
  opayra.animKeys.push( { frame:  0, value: 0 });
  opayra.animKeys.push( { frame: 30, value: Math.PI/2 });

  opayra.animBox.setKeys(opayra.animKeys);
}

opayra.recreateScene = function( nrOfFaces) {
  // scene, canvas & engine are accessible
  scene.dispose();
  opayra.algo.facesMax = nrOfFaces;
  scene = createScene(canvas, engine);

  opayra.FaceNrInFront = 0;

  opayra.tooltipBarFaceCat = -1;
  opayra.barPicked = false;
  
  var tooltipElement = document.getElementById('candy-bar-tooltip');
  tooltipElement.remove();

  // redo later, since not generic at all
  document.getElementById('candy-sub-cat4').parentNode.style.display = ( nrOfFaces == 4 ? 'inline' : 'none' );
};

opayra.rotateBarsRadio = function(p) {

  var turns = p.barNr - ( opayra.FaceNrInFront || 0);
  
  // when the number of turns are less than half the number of faces, just do these turns
  // if not, turn the other way
  //   number of turns in the opposite side = number of faces - turns
  //   and flip the sign (direction)

  if (Math.abs(turns) > opayra.faces / 2) {
    turns = ( opayra.faces - Math.abs(turns)) * Math.sign(turns) * -1;
  }

  console.log('radio ' + p.barNr + ' ; turns : ' + turns);
  
  // Delta for one turn is a full circle divided by the number of angles of the polygon
  // multiply then by the number of turns of faces
  const radiansDelta = 2 * Math.PI / opayra.faces * turns;  

  opayra.FaceNrInFront = p.barNr;
  
  // set the animation key values : start from the actual position of the rotation along the Y axis, and add the just calculated delta
  opayra.animKeys[0].value = opayra.bar[0].rotation.y;
  opayra.animKeys[1].value = opayra.bar[0].rotation.y + radiansDelta;

  for ( i = 0; i < opayra.in.bar.length; i++){
    // beginAnimation parameters : target, theBabylon.js object to be animated ; from, number, the frame at which to start the animation ; to : the frame at which to end the animation
    // so animation of one second, since frames per second is set to 30 in the definition of this animation
    scene.beginAnimation( opayra.bar[i], 0, 30);
  }

};

function oneBar(b, scene) {
  const totalOfBar = opayra.total[b],
        C = 100,
        n = opayra.faces;
  
  //
  // fill a canvas with rectangles, and use that as a dynamic texture to lay over the bar
  //
  // * n vertical lanes, one for each side of the candy bar
  //   * such a vertical lane is then composed of many rectangles, the heigth is the fraction of the value, width a constant
  // * and then one more vertical lane for top and wottom of the candy bar, just fully filled with white
  //
  // Canvas : (x,y) nul-point is the left top corner : x horizontal (to the right), y vertical (to the bottom)
  // x------->  x
  // |
  // |
  // v
  // y
  //
  var Dyntexture = new BABYLON.DynamicTexture("dynamic texture", {width:C*(n+1), height: C}, scene);   
  var ctx = Dyntexture.getContext();

  for ( let i = 0; i < n; i++) {
    var y0 = C;

    for ( let j = 0, s = 0; j < opayra.in.bar[b][i].length; j++) { 
      //console.log( b + ': ' + opayra.in.bar[b][i].length + ':' + opayra.in.bar[b][i][j] + '    :    ' +  opayra.col[j]);
      //ctx.fillStyle = opayra.in.col[b][j] || opayra.col[j];
      ctx.fillStyle = (opayra.in.face.color[i] || opayra.col)[j];
      const v = opayra.in.bar[b][i][j];
      s += v;

      let y = Math.trunc((1-(s/totalOfBar))*C),
          h = y0-y; //(v/totalOfBar*C);

      y0 = y;

      if ( ( opayra.config.debug || false ) && ( b == (opayra.config.debugTextureBarNr || 0))) {
        console.log( 'debug: bar: ' + b + ' face: ' + i + ' cat: ' + j + ' y: ' + y + ' h:' + h);
      }

      // fillRect(x: , y: , width: , height: 
      // a rectangle within a vertical lane: x is fixed, y is growing, width is a constant, and heigth is the fraction of the value to the total
      ctx.fillRect(i*C, y, C-1, h);
      
    }
  }
  
  ctx.fillStyle = 'white';
  ctx.fillRect(n*C, 0, C, C);
    
  Dyntexture.update();
  
  // shows the first dynamic texture in a canvas below the babylon canvas, in case debugging

  if ( ( opayra.config.debug || false ) && ( b == (opayra.config.debugTextureBarNr || 0))) {
    // create a new canvas element and place it at the same level of, but after, the babylon canvas element
    var debugCanvas = document.createElement('canvas');
    canvas.insertAdjacentElement( 'afterend', debugCanvas);

    // add an ugly border to the new debug canvas
    debugCanvas.style.border = '2px solid greenyellow';

    // and set width & height, as used for the dynamic texture
    debugCanvas.width = C * (n+1);
    debugCanvas.height = C;

    // create a 2d context, to apply drawImage on this context, copying the canvas (only available from the babylon canvas context))
    // so from babbylon we have the context, not the canvas, so luckily the canvas is an attribute of the context
    var debugCanvasContext = debugCanvas.getContext('2d');
    
    debugCanvasContext.drawImage( ctx.canvas, 0, 0);
  }

  //
  //  clip a part out of the UV-space (0-1, in the 2 dimensions)
  //
  //  (v)
  //  1
  //  ^
  //  |
  //  0 --> 1 (u)
  //
  //  further reading: https://doc.babylonjs.com/divingDeeper/materials/using/texturePerBoxFace
  //  
  //  To map part of the image the bottom left coordinates and top right coordinates are used. 
  //  Using (0, 0) and (1, 1) will use the whole of the texture atlas.
  //
  //  To set this to face one in its current orientation you would use
  //  faceUV[1] = new BABYLON.Vector4(Ubottom_left, Vbottom_left, Utop_right, Vtop_right);
  //
  var faceUV = [
        new BABYLON.Vector4(n/(n+1),0, 1, 1), // bottom : white: right hand rectangle
                                              // horizontal: u, 1st & 3th parameter, so up till 1
                                              // vertical (v) : 2nd & 4th parameter : 0 to 1, full scale
        new BABYLON.Vector4(n/(n+1),0, 0,1), // sides, inverse x values to have it applied counter-clockwise
                                             // horizontal: u, 1st & 3th parameter, from n / n+1 down to 0
        new BABYLON.Vector4(n/(n+1),0, 1, 1) // top : white: right hand rectangle
      ];
  
  const bar = BABYLON.MeshBuilder.CreateCylinder( 'bar'+b, { 
    diameter: 1, 
    tessellation: n, // crucial parameter, for this very one I opted to use a tessallated cylinder, to avoid all calculations when constructing the figure myself, rectangle by rectangle
    height: totalOfBar,
    faceUV: faceUV  // also crucial, but silver
  });
  
  // adjust bar so that the first face is shown first.
  bar.rotation.y = Math.PI * (n+2) / ( 2 * n);  // formule empirisch opgebouwd


  bar.position.x = opayra.algo.X + b + ( (b+1) * 0.1);  // + b works, since the diameter of each bar (cylinder) is 1
  bar.position.y = opayra.total[b] / 2;

  const mat = new BABYLON.StandardMaterial( 'mat' + b);
  mat.emissiveTexture = Dyntexture;
  bar.material = mat;

  bar.animations = [];
  bar.animations.push( opayra.animBox);

  opayra.bar[b] = bar;
  
  bar.enableEdgesRendering();	
  bar.edgesWidth = 4;
  bar.edgesColor = new BABYLON.Color4(1, 1, 1, 0.5);

  // on click / pick : sets the barPicked state
  
  const onpickAction = new BABYLON.ExecuteCodeAction(
    BABYLON.ActionManager.OnPickTrigger,
      function(evt) {
        var boxClick = evt.meshUnderPointer;
        
        if (boxClick) {
          console.log( 'action picked: ' + boxClick.name);
          opayra.barPicked = true;
        }
      }
    );
  
  bar.actionManager = new BABYLON.ActionManager(scene);
  bar.actionManager.registerAction(onpickAction);  
  
  // show primary category label under the bar
  let Writer = BABYLON.MeshWriter(scene, {scale: 1});
  
  let catLabel = new Writer(
    opayra.in.barLabel[b],
    {
      "anchor": "left",
      "letter-height": 0.35,
      "letter-thickness": 0.02,
      "color": "#808080", // grey  // "#FFFFFF" : white
      "position": {
        "x": opayra.algo.X - 0.0 + b + ( (b+1) * 0.00),  // to do: find better algo, or other solution (vertical?) in case of longer labels
        "y": -0.25,
        "z": -0.75
      }
    }
  );
  
  let catMesh = catLabel.getMesh();
  catMesh.rotation.x = - Math.PI / 2;
}

//
// find the category nr, given a bar, face and y value (y being a value between 0 and the sum of all category values)
//
function catNr (b, f, y) {

  const catValues = opayra.in.bar[b][f];

  for (let i = 0, s = 0; i < catValues.length; i++) {
    if ( y < s) { // the sum is now greater then the y value, so bingo, return the previous category
      return i-1;
    }
    s = s + catValues[i];
  }
  
  // nothing found, so it must be the last category
  return catValues.length - 1;
  
}

function createScene( canvas, engine) {
  
  document.getElementById( 'candy-bar-graph-header-title').innerHTML = opayra.in.title;
  
  opayra.bar = []; // used to have access to the bars in the animation function

  // find biggest sum of categories. We can limit this to one single face, for all bars, given that the sum in a bar is the same for all faces
  var bigSum = 0;
  for ( let b = 0, s = 0; b < opayra.val.length; b++) {
    s = opayra.val[b][0].reduce((a,b) => a+b);
    bigSum = Math.max( bigSum, s);
  }
  
  //
  // crucial : scale down all numbers so it is max 4 (yMax)
  // this will probably not work when the canvas gets other dimensions, but we are already a little closer to a auto-scaler.
  //

  opayra.algo.scale = Math.trunc( bigSum / opayra.algo.yMax ) + 1;

  console.log( 'bigSum=' + bigSum + ' scale=' + opayra.algo.scale);

  // populate the in array, with scaled down values
  opayra.in.bar = [];

  for ( let b = 0; b < opayra.val.length; b++) {
    opayra.in.bar[b] = [];

    for ( let f = 0; f < Math.min( opayra.algo.facesMax || 99, opayra.val[b].length ); f++) {
      opayra.in.bar[b][f] = [];

      for ( let c = 0; c < opayra.val[b][f].length; c++) {
        opayra.in.bar[b][f][c] = opayra.val[b][f][c] / opayra.algo.scale
      }
    }
  }

  opayra.faces = opayra.in.bar[0].length;

  document.getElementById('candy-sub-cat1').checked = true;


  opayra.total = [];
  // to do : check if all totals of a bar match. Now only the 0 face (left) is taken into consideration for making the sum (height)
  for (i = 0; i < opayra.in.bar.length; i++) {
    opayra.total[i] = opayra.in.bar[i][0].reduce((a,b) => a+b);
  }

  opayra.max = opayra.total.reduce((a,b) => (a>b? a: b));  // wordt dit nog gebruikt, na al het gereschufle?
  //console.log( opayra.max);

  opayra.bgColor = new BABYLON.Color3(0.85, 0.85, 0.85); // lightgrey
  
  opayra.barPicked = false;
  opayra.tooltipBarFaceCat = -1;

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = opayra.bgColor;

  setCamera(scene);

  defineAnimation();

  //let x = -2; // to do: dynamic, so it is centered (depends from nr of bars)
  

  // bars
  for ( let i = 0; i < opayra.total.length; i++) {
    oneBar(i, scene);
  }

  // scaled Y axis values
  opayra.yAxValues = [];
  for ( let i = 0; i < opayra.in.yAxValues.length; i++) {
    opayra.yAxValues[i] = (opayra.in.yAxValues[i] / opayra.algo.scale).toFixed(2);
  }

  XYaxis( scene, { 
    x_units : opayra.in.bar.length, 
    y_max : opayra.algo.yMax,
    y_values : opayra.yAxValues,
    y_valuesReal : opayra.in.yAxValues,
    xStart : opayra.algo.X
  });

  scene.onPointerPick = function(e, picked) {

    if(picked.hit ) {
      
      if ( (picked.pickedMesh.name.substr(0,3) == 'bar') && ( picked.faceId < ( opayra.faces * 2)) ) {
        //console.log(picked);
        console.log( 'pointer picked:' + picked.pickedMesh.name + ':' 
                   + 'faceid: ' + picked.faceId
                   + ' face: ' + Math.trunc( picked.faceId/2)
                   + '  y:' + picked.pickedPoint._y.toFixed(3)
                   + '  x:' + picked.pickedPoint._x.toFixed(3));

        var barNr = parseInt( picked.pickedMesh.name.replace( 'bar', '')),
            faceNr = opayra.faces - Math.trunc( picked.faceId/2) - 1, // empirically determined
            rectangleNr = catNr(barNr, faceNr, picked.pickedPoint._y),
            faceLabel = opayra.in.face.catLabel[faceNr][rectangleNr] || ( 'face ' + faceNr ),
            value = opayra.val[barNr][faceNr][rectangleNr];

        if (opayra.tooltipBarFaceCat == (barNr* 100) + (faceNr*10) + rectangleNr) {
          opayra.tooltipBarFaceCat = -1;
          opayra.barPicked = false;

        } else {
          opayra.tooltipBarFaceCat = (barNr* 100) + (faceNr*10) + rectangleNr;

          tooltip.innerHTML = ( opayra.in.barLabelLong[barNr] || opayra.in.barLabel[barNr] )
                            + '<br>'
                            + opayra.in.face.category[faceNr] + ': ' + faceLabel
                            + '<br>' 
                            + value.toFixed(2);  // make the 2 positions to fixed maybe dynamic, 0, or 2, can be decided when scanning the input numbers
        }
      }
    }
  }

  // event listener for `click` events on canvas to show tooltip.

          // alternative : see if the Babylon GUI is better then this
          // - better: follows the object when rotating, .. but this freewheeling can be restricted for such kind of graph
          //   (or do a css transform, but that becomes soon really ugly)
  
  var tooltip = document.createElement('span');  // use span, no div, to have it on one line for the fixed one
  tooltip.id = 'candy-bar-tooltip';

  if (opayra.config.tooltipPosition == 'pointer') {
    canvas.insertAdjacentElement( 'afterend', tooltip);
    tooltip.classList.add( 'candy-bar-tooltip-on-pointer');
  } else {
    var candyTitle = document.getElementById( 'candy-bar-graph-header-title');
    candyTitle.insertAdjacentElement( 'afterend', tooltip);
    tooltip.classList.add( 'candy-bar-tooltip-fixed');
  }

  var elemLeft = canvas.offsetLeft + canvas.clientLeft,
      elemTop  = canvas.offsetTop + canvas.clientTop;
  
  canvas.addEventListener('click', function(event) {
    if (opayra.config.tooltipPosition == 'pointer') {

      var x = event.pageX - elemLeft,
          y = event.pageY - elemTop;

      console.log( 'canvas click: x: ' + x + ' - y:' + y);
      
      tooltip.style.left = (x-20) + 'px';
      tooltip.style.top  = (y-80) + 'px';
    }

    if (opayra.barPicked && opayra.tooltipBarFaceCat >= 0) {
      tooltip.style.visibility= 'visible';
      opayra.barPicked = false;
    }
    else {
      tooltip.style.visibility= 'hidden';
    }
        
  }, false);

return scene;

}
