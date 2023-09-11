var gl;
var color;
var animation;
var degree0 = 0;
var degree1 = 0;
var matrixStack = [];
//parameters for boat
var tBody = 0;
var tDirection = 1;
// mMatrix is called the model matrix, transforms objects
// from local object space to world space.
var mMatrix = mat4.create();
var uMMatrixLocation;
var aPositionLocation;
var uColorLoc;

var circleBuf;
var circleIndexBuf;
var sqVertexPositionBuffer;
var sqVertexIndexBuffer;

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
  gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
  gl_PointSize = 10.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;

uniform vec4 color;

void main() {
  fragColor = color;
}`;
var xx = 2;
function changeToWire(){
  xx = 1;
}
function changeToSolid(){
  xx = 2;
}
function changeToPoint(){
  xx = 0;
}

function pushMatrix(stack, m) {
  //necessary because javascript only does shallow push
  var copy = mat4.create(m);
  stack.push(copy);
}

function popMatrix(stack) {
  if (stack.length > 0) return stack.pop();
  else console.log("stack has no matrix to pop!");
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function vertexShaderSetup(vertexShaderCode) {
  shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, vertexShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function fragmentShaderSetup(fragShaderCode) {
  shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, fragShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initShaders() {
  shaderProgram = gl.createProgram();

  var vertexShader = vertexShaderSetup(vertexShaderCode);
  var fragmentShader = fragmentShaderSetup(fragShaderCode);

  // attach the shaders
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  //link the shader program
  gl.linkProgram(shaderProgram);

  // check for compilation and linking status
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  //finally use the program.
  gl.useProgram(shaderProgram);

  return shaderProgram;
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl2"); // the graphics webgl2 context
    gl.viewportWidth = canvas.width; // the width of the canvas
    gl.viewportHeight = canvas.height; // the height
  } catch (e) {}
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

function initSquareBuffer() {
  // buffer for point locations
  const sqVertices = new Float32Array([
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ]);
  sqVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
  sqVertexPositionBuffer.itemSize = 2;
  sqVertexPositionBuffer.numItems = 4;

  // buffer for point indices
  const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  sqVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
  sqVertexIndexBuffer.itemsize = 1;
  sqVertexIndexBuffer.numItems = 6;
}

function drawSquare(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    sqVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  gl.drawElements(
    xx ==2 ? gl.TRIANGLES: (xx==1 ? gl.LINE_LOOP : gl.POINTS),
    sqVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}

function initTriangleBuffer() {
  // buffer for point locations
  const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  triangleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
  triangleBuf.itemSize = 2;
  triangleBuf.numItems = 3;

  // buffer for point indices
  const triangleIndices = new Uint16Array([0, 1, 2]);
  triangleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
  triangleIndexBuf.itemsize = 1;
  triangleIndexBuf.numItems = 3;
}

function drawTriangle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    triangleBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  gl.drawElements(
    xx ==2 ? gl.TRIANGLES: (xx==1 ? gl.LINE_LOOP : gl.POINTS),
    triangleIndexBuf.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}

function initCircleBuffer() {
  const circleVertices = [];
  const numberOfSegments = 100;

  for (let i = 0; i < numberOfSegments; i++) {
    const angle = (i / numberOfSegments) * 2 * Math.PI;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    circleVertices.push(x, y);
  }
  // Buffer for point locations
  circleVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(circleVertices),
    gl.STATIC_DRAW
  );
  circleVertexBuffer.itemSize = 2;
  circleVertexBuffer.numItems = numberOfSegments;
}

function drawCircle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // Buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    circleVertexBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.uniform4fv(uColorLoc, color);

  // Now draw the circle using triangle fan
  gl.drawArrays(xx ==2 ? gl.TRIANGLE_FAN: (xx==1 ? gl.LINE_LOOP : gl.POINTS), 0, circleVertexBuffer.numItems);
}

////////////////////////////////////////////////////////////////////////
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // stop the current loop of animation
  if (animation) {
    window.cancelAnimationFrame(animation);
  }

  var animate = function () {
    gl.clearColor(1, 1, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);

    //this function will take all the circle arguments and draw them
    function circleProps(x, y, s, t, r, g, b) {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [x, y, 1]);
      //mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
      mMatrix = mat4.scale(mMatrix, [s, t, 1]);
      color = [r, g, b, 1];
      drawCircle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }

    //this function will take all the triangle arguments and draw them
    function triangleProps(x, y, s, t, r, g, b, rotAngle) {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [x, y, 1]);
      mMatrix = mat4.rotate(mMatrix, rotAngle, [0.0, 0.0, 1.0]);
      mMatrix = mat4.scale(mMatrix, [s, t, 1]);
      color = [r, g, b, 1];
      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }
    //this array contains some square parameters(x,y,s,t,r,g,b)
    var squaresIndexes = [
      [0, -0.2, 2, 0.3, 0.2, 0.2, 1], //river
      [0, -0.1, 0.3, 0.002, 1, 1, 1], //whiteline1
      [0.7, -0.3, 0.3, 0.002, 1, 1, 1], //whiteline2
      [-0.7, -0.2, 0.3, 0.002, 1, 1, 1], //whiteline3
      [0.2, 0.18, 0.04, 0.4, 0.6, 0, 0], //trunk1
      [0.5, 0.23, 0.07, 0.5, 0.6, 0, 0], //trunk2
      [0.8, 0.205, 0.05, 0.45, 0.6, 0, 0], //trunk3
      [0.65, -0.23, 0.02, 0.6, 0, 0, 0], //windmillpole1
      [-0.55, -0.23, 0.02, 0.6, 0, 0, 0], //windmillpole2
      [-0.54, -0.62, 0.5, 0.2, 1, 1, 1], //house1
      [-0.54, -0.445, 0.45, 0.15, 1, 0, 0], //roof
      [-0.55, -0.65, 0.05, 0.14, 1, 0.85, 0], //door
      [-0.37, -0.57, 0.05, 0.05, 1, 0.85, 0], //window1
      [-0.71, -0.57, 0.05, 0.05, 1, 0.85, 0], //window2
      [-0.503, -0.8, 0.29, 0.07, 1, 0.4, 0], //cartop
      [-0.503, -0.87, 0.43, 0.07, 0, 0.4, 1], //carmid
    ];

    //this function will take all the square arguments and draw them

    function squares(x, y, s, t, r, g, b) {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [x, y, 0.0]);
      mMatrix = mat4.scale(mMatrix, [s, t, 1]);
      color = [r, g, b, 1];
      drawSquare(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }
    //draw sky
    squares(0, 0.5, 2, 1, 0.404, 0.796, 0.86);
    //draw mountains
    //first back
    triangleProps(-0.6, 0.125, 1, 0.25, 0.6, 0, 0, 0);
    //first front
    triangleProps(-0.575, 0.128, 1, 0.25, 0.8, 0.4, 0, 6.5);
    //second back
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [1, 0.4, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0, 0.5, 0.0]);
    color = [0.6, 0, 0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    //second front
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.rotate(mMatrix, degToRad(15), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix, [2.5, 1, 1]);
    mMatrix = mat4.translate(mMatrix, [0.041, -0.115, 0.0]);
    color = [0.8, 0.4, 0, 1]; //204, 102
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    //third
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [1, 0.2, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.8, 0.5, 0.0]);
    color = [0.8, 0.4, 0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    //draw back-grass
    squares(0, -0.5, 2, 1, 0.4, 0.9, 0);
    //second-grass
    triangleProps(1.1, -1.2, 2.5, 1.8, 0.4, 0.8, 0, degToRad(-75));

    //draw river
    let sq;
    sq = 0;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    sq = 1;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    sq = 2;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    sq = 3;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );

    //draw trees
    //all three trunks
    sq = 4;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    sq = 5;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    sq = 6;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );

    //now all tree leaves with - right, middle left order
    //first
    triangleProps(0.8, 0.45, 0.28, 0.28, 0, 0.4, 0, 0);
    triangleProps(0.8, 0.49, 0.31, 0.31, 0, 0.6, 0, 0);
    triangleProps(0.8, 0.53, 0.34, 0.34, 0, 0.8, 0, 0);
    //second
    triangleProps(0.5, 0.54, 0.38, 0.38, 0, 0.4, 0, 0);
    triangleProps(0.5, 0.58, 0.41, 0.41, 0, 0.6, 0, 0);
    triangleProps(0.5, 0.62, 0.44, 0.44, 0, 0.8, 0, 0);
    //third
    triangleProps(0.2, 0.4, 0.25, 0.25, 0, 0.4, 0, 0);
    triangleProps(0.2, 0.44, 0.28, 0.28, 0, 0.6, 0, 0);
    triangleProps(0.2, 0.48, 0.31, 0.31, 0, 0.8, 0, 0);

    //draw the 5 birds
    var birdIndex = [
      [0.14, 0.0125, 1.1, 55, -0.98, 55, 0.013, 0.68, 0.012, 0.03],
      [0.12, 0.012, -2, 68, -4.3, 60.3, -0.38, 0.76, 0.011, 0.025],
      [0.12, 0.012, 3.8, 68, 1.2, 74.2, 0.305, 0.845, 0.011, 0.025],
      [0.08, 0.01, 0, 83, -3.3, 79.8, -0.13, 0.81, 0.01, 0.02],
      [0.06, 0.007, 2, 125, -2.4, 124.5, -0.01, 0.87, 0.005, 0.01],
    ];
    for (let i = 0; i < 5; i++) {
      //right
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.rotate(mMatrix, degToRad(7), [0.0, 0.0, 1.0]);
      mMatrix = mat4.scale(mMatrix, [birdIndex[i][0], birdIndex[i][1], 1.0]);
      mMatrix = mat4.translate(mMatrix, [
        birdIndex[i][2],
        birdIndex[i][3],
        0.0,
      ]);
      color = [0, 0, 0, 1];
      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
      //left
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.rotate(mMatrix, degToRad(-7), [0.0, 0.0, 1.0]);
      mMatrix = mat4.scale(mMatrix, [birdIndex[i][0], birdIndex[i][1], 1.0]);
      mMatrix = mat4.translate(mMatrix, [
        birdIndex[i][4],
        birdIndex[i][5],
        0.0,
      ]);
      color = [0, 0, 0, 1];
      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
      //body
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [birdIndex[i][6], birdIndex[i][7], 0]);
      mMatrix = mat4.scale(mMatrix, [birdIndex[i][8], birdIndex[i][9], 1]);
      color = [0, 0, 0, 1];
      drawSquare(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }

    //draw the boat
    tBody += 0.005 * tDirection;
    if (tBody >= 0.9 || tBody <= -0.7) {
      tDirection *= -1;
    }
    //red triangle
    triangleProps(tBody, 0, 0.25, 0.2, 1, 0, 0, degToRad(-90));
    //black squares
    squares(-0.105 + tBody, 0, 0.01, 0.3, 0, 0, 0);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.158 + tBody, -0.02, 1]);
    mMatrix = mat4.rotate(mMatrix, degToRad(-20), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix, [0.005, 0.28, 1]);
    color = [0, 0, 0, 1];
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    //base
    squares(-0.105 + tBody, -0.18, 0.25, 0.06, 1, 1, 1);
    triangleProps(0.02 + tBody, -0.18, 0.1, 0.06, 1, 1, 1, degToRad(180));
    triangleProps(-0.23 + tBody, -0.18, 0.1, 0.06, 1, 1, 1, degToRad(180));

    //draw windmills
    degree0 -= 1.5;
    var fanMatrix = [0, 90, 180, 270];
    sq = 7;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    sq = 8;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    //fan and pole for right
    for (let i = 0; i < 4; i++) {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [0.65, 0.06, 1]);
      mMatrix = mat4.rotate(
        mMatrix,
        degToRad(fanMatrix[i] + degree0),
        [0.0, 0.0, 1.0]
      );
      mMatrix = mat4.scale(mMatrix, [0.04, 0.4, 1]);
      color = [1, 0.7, 0, 1];
      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }
    circleProps(0.65, 0.06, 0.02, 0.02, 0, 0, 0);

    //fan and pole for right
    for (let i = 0; i < 4; i++) {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [-0.55, 0.06, 1]);
      mMatrix = mat4.rotate(
        mMatrix,
        degToRad(fanMatrix[i] + degree0),
        [0.0, 0.0, 1.0]
      );
      mMatrix = mat4.scale(mMatrix, [0.04, 0.4, 1]);
      color = [1, 0.7, 0, 1];
      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }
    circleProps(-0.55, 0.06, 0.02, 0.02, 0, 0, 0);

    //draw all the static circles here
    //grass
    circleProps(-0.25, -0.65, 0.08, 0.05, 0.565, 1, 0.565);
    circleProps(-0.02, -0.65, 0.05, 0.05, 0, 0.5, 0);
    circleProps(-0.15, -0.65, 0.13, 0.08, 0.13, 0.55, 0.13);

    circleProps(-0.95, -0.65, 0.08, 0.05, 0.565, 1, 0.565);
    circleProps(-0.87, -0.65, 0.1, 0.07, 0.13, 0.55, 0.13);

    circleProps(-0.25, -1.05, 0.1, 0.08, 0.565, 1, 0.565);
    circleProps(0.15, -1.07, 0.1, 0.1, 0, 0.5, 0);
    circleProps(-0.05, -1.05, 0.2, 0.15, 0.13, 0.55, 0.13);

    circleProps(0.87, -0.55, 0.09, 0.06, 0.565, 1, 0.565);
    circleProps(0.99, -0.55, 0.12, 0.08, 0.13, 0.55, 0.13);
    //clouds and then sun
    circleProps(-0.9, 0.6, 0.17, 0.09, 1, 1, 1);
    circleProps(-0.7, 0.57, 0.14, 0.07, 1, 1, 1);
    circleProps(-0.56, 0.55, 0.12, 0.055, 1, 1, 1);
    //this is sun
    circleProps(-0.76, 0.82, 0.12, 0.12, 1, 1, 0);
    var sunMatrix = [0,45,90,135,180,225,270,315];
    degree1+=0.5;
    for (let i = 0; i < 8; i++) {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [-0.76, 0.82, 1]);
      mMatrix = mat4.rotate(
        mMatrix,
        degToRad(sunMatrix[i] + degree1),
        [0.0, 0.0, 1.0]
      );
      mMatrix = mat4.scale(mMatrix, [0.01, 0.3, 1]);
      color = [1, 1, 0, 1];
      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }

    //house
    sq = 9;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    sq = 10;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    triangleProps(-0.315, -0.445, 0.09, 0.15, 1, 0, 0, 0);
    triangleProps(-0.765, -0.445, 0.09, 0.15, 1, 0, 0, 0);
    sq = 11;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    sq = 12;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    sq = 13;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );

    //this is car
    sq = 14;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    triangleProps(-0.355, -0.8, 0.07, 0.07, 1, 0.4, 0, 0);
    triangleProps(-0.65, -0.8, 0.07, 0.07, 1, 0.4, 0, 0);
    circleProps(-0.65, -0.92, 0.04, 0.04, 0, 0, 0);
    circleProps(-0.355, -0.92, 0.04, 0.04, 0, 0, 0);
    circleProps(-0.355, -0.92, 0.03, 0.03, 0.5, 0.5, 0.5);
    circleProps(-0.65, -0.92, 0.03, 0.03, 0.5, 0.5, 0.5);
    sq = 15;
    squares(
      squaresIndexes[sq][0],
      squaresIndexes[sq][1],
      squaresIndexes[sq][2],
      squaresIndexes[sq][3],
      squaresIndexes[sq][4],
      squaresIndexes[sq][5],
      squaresIndexes[sq][6]
    );
    triangleProps(-0.719, -0.87, 0.07, 0.07, 0, 0.4, 1, 0);
    triangleProps(-0.287, -0.87, 0.07, 0.07, 0, 0.4, 1, 0);

    animation = window.requestAnimationFrame(animate);
  };

  animate();
}

// This is the entry point from the html
function webGLStart() {
  var canvas = document.getElementById("webglCanvas");
  initGL(canvas);

  shaderProgram = initShaders();

  //get locations of attributes declared in the vertex shader
  const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);

  uColorLoc = gl.getUniformLocation(shaderProgram, "color");

  initSquareBuffer();
  initTriangleBuffer();
  initCircleBuffer();

  drawScene();
}

window.onload = webGLStart;

