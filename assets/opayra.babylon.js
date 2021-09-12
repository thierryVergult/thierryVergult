function XYaxis(scene, p) {

    const YaxisH = p.y_max,
          Hdelta = p.ax_padding || 0.5,
          margin = p.text_margin || 0.2,
          X_length = p.x_units + Hdelta,
          axisWidth = 1,
          axisColor = new BABYLON.Color3(0.46, 0.48, 0.5),
          axisAlpha = 0.6,
          Yax_posX = p.xStart - Hdelta;
  
    const Yaxis = BABYLON.MeshBuilder.CreatePlane( 'Yaxis', {
      width : axisWidth,
      height : YaxisH + Hdelta,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    });
  
    Yaxis.rotation.y = Math.PI / 2;
    Yaxis.position.x = Yax_posX;
    Yaxis.position.y = ( YaxisH + Hdelta) / 2;

    opayra.Yaxis = Yaxis;  // nice for debugging, but not sure to keep this, see also groundX
                           // maybe very useful to apply candy bar specific stuff on it, outside of this file, which is considered like a library
  
    const matY = new BABYLON.StandardMaterial( 'Yaxis.mat');
    matY.emissiveColor = axisColor;
    matY.alpha = axisAlpha;
    Yaxis.material = matY;
    
    // define the points to draw the lines from
    const yPoints = [ // along the Z axis
      new BABYLON.Vector3( Yax_posX, 0, - axisWidth / 2),
      new BABYLON.Vector3( Yax_posX, 0, axisWidth / 2)
    ], yxPoints  = [ // along the X axis
      new BABYLON.Vector3( Yax_posX + margin,    0, .45),  // to do, I stopped here : w / 2 * 0.9 (? needed?)
      new BABYLON.Vector3( Yax_posX + X_length,  0, .45)
    ];
  
    // draw horizontal lines on the Y-axis plane, and add labels at the right & left hand side (base)
    let Writer = BABYLON.MeshWriter(scene, {scale: 1});
  
    for (i = 0; i < p.y_values.length; i++) {
      yLine = BABYLON.MeshBuilder.CreateLines( "yline-" + i, {points: yPoints}, scene);
      yLine.position.y = p.y_values[i];
  
      yLine.enableEdgesRendering();	
      yLine.edgesWidth = 5.0;
      yLine.edgesColor = new BABYLON.Color4( 0, 1, 1, 0.5);
      
      // also lines parallel with the X axis
      xLine = BABYLON.MeshBuilder.CreateLines( "xline-" + i, {points: yxPoints}, scene);
      xLine.position.y = p.y_values[i]; //xLine.position.y + i;
      
      let xlineBaseLabel = new Writer(
        (p.y_valuesReal[i]).toString(),
        {
          "anchor": "left",
          "letter-height": 0.25,
          "letter-thickness": 0.05,
          "color": "#FFFFFF",
          "position": {
            "x": Yax_posX + X_length + margin,
            "z": 0.5
          }
        }
      );
  
      let textMesh = xlineBaseLabel.getMesh();
      textMesh.position.y = p.y_values[i] - 0.2;
        
      //textMesh.rotation.y = -Math.PI/2;
      textMesh.rotation.x = -Math.PI/2;
  
      let textMesh2 = textMesh.clone();
      textMesh2.position.x = Yax_posX + margin;
      textMesh2.position.y = textMesh2.position.y + margin + margin;
      textMesh2.position.z = 0.5;
      textMesh2.rotation.y = -Math.PI/4;
    
    }
  
    // X-axis
  
    const groundX = BABYLON.MeshBuilder.CreateGround( 'ground', { width: X_length, height: axisWidth});
    groundX.material = matY;
    //console.log( 'groundX.position.x: ' + groundX.position.x);
    groundX.position.x = Yax_posX + (X_length / 2);

    opayra.Xaxis = groundX; // nice for debugging, but not sure to keep this

    
  }