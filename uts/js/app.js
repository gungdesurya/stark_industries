"use strict";

var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

var currentlyPressedKeys = {};

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}


function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}


var pitch = 0;
var pitchRate = 0;

var yaw = 0;
var yawRate = 0;

var xPos = 0;
var yPos = 0.4;
var zPos = 20.0;

var speed = 0;

function handleKeys() {
    if (currentlyPressedKeys[33]) {
        // Page Up
        pitchRate = 0.1;
    } else if (currentlyPressedKeys[34]) {
        // Page Down
        pitchRate = -0.1;
    } else {
        pitchRate = 0;
    }

    if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
        // Left cursor key or A
        yawRate = 0.1;
    } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
        // Right cursor key or D
        yawRate = -0.1;
    } else {
        yawRate = 0;
    }

    if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
        // Up cursor key or W
        speed = 0.003;
    } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
        // Down cursor key
        speed = -0.003;
    } else {
        speed = 0;
    }

}


var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var cubeVertexPositionBuffer;
var cubeVertexColorBuffer;
var cubeVertexIndexBuffer;

var bodyVertexPositionBuffer;
var bodyVertexColorBuffer;
var bodyVertexIndexBuffer;

var armVertexPositionBuffer;
var armVertexColorBuffer;
var armVertexIndexBuffer;

var footVertexPositionBuffer;
var footVertexColorBuffer;
var footVertexIndexBuffer;

function initBuffers() {
    
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    var vertices = [
        // Front face
        -2.0, -2.0,  1.0,
         1.0, -2.0,  1.0,
         1.0,  1.0,  1.0,
        -2.0,  1.0,  1.0,

        // Back face
        -2.0, -2.0, -1.0,
        -2.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -2.0, -1.0,

        // Top face
        -2.0,  1.0, -1.0,
        -2.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom face
        -2.0, -2.0, -1.0,
         1.0, -2.0, -1.0,
         1.0, -2.0,  1.0,
        -2.0, -2.0,  1.0,

        // Right face
         1.0, -2.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -2.0,  1.0,

        // Left face
        -2.0, -2.0, -1.0,
        -2.0, -2.0,  1.0,
        -2.0,  1.0,  1.0,
        -2.0,  1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 24;

    cubeVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    var colors = [
        [0.8, 0.0, 0.0, 1], // Front face
        [0.8, 0.0, 0.0, 1], // Back face
        [0.8, 0.0, 0.0, 0.8], // Top face
        [0.8, 0.0, 0.0, 0.8], // Bottom face
        [0.8, 0.0, 0.0, 0.8], // Right face
        [0.8, 0.0, 0.0, 0.8]  // Left face
    ];
    var unpackedColors = [];
    for (var i in colors) {
        var color = colors[i];
        for (var j=0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
    cubeVertexColorBuffer.itemSize = 4;
    cubeVertexColorBuffer.numItems = 24;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 36;

    // body
    bodyVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bodyVertexPositionBuffer);
    var vertices = [
        // Front face
        -2.0, -3.0,  1.0,
         1.0, -3.0,  1.0,
         1.0,  1.0,  1.0,
        -2.0,  1.0,  1.0,

        // Back face
        -2.0, -3.0, -1.0,
        -2.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -3.0, -1.0,

        // Top face
        -2.0,  1.0, -1.0,
        -2.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom face
        -2.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -2.0, -1.0,  1.0,

        // Right face
         1.0, -3.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -3.0,  1.0,

        // Left face
        -2.0, -3.0, -1.0,
        -2.0, -3.0,  1.0,
        -2.0,  1.0,  1.0,
        -2.0,  1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    bodyVertexPositionBuffer.itemSize = 3;
    bodyVertexPositionBuffer.numItems = 24;

    bodyVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bodyVertexColorBuffer);
    var colors = [
        [0.0, 0.8, 0.0, 1], // Front face
        [0.0, 0.8, 0.0, 1], // Back face
        [0.0, 0.8, 0.0, 0.8], // Top face
        [0.0, 0.8, 0.0, 0.8], // Bottom face
        [0.0, 0.8, 0.0, 0.8], // Right face
        [0.0, 0.8, 0.0, 0.8]  // Left face
    ];
    var unpackedColors = [];
    for (var i in colors) {
        var color = colors[i];
        for (var j=0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
    bodyVertexColorBuffer.itemSize = 4;
    bodyVertexColorBuffer.numItems = 24;

    bodyVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bodyVertexIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    bodyVertexIndexBuffer.itemSize = 1;
    bodyVertexIndexBuffer.numItems = 36;

    // kaki
    footVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, footVertexPositionBuffer);
    var vertices = [
        // Front face
        -0.5, -3.0,  1.0,
         1.0, -3.0,  1.0,
         1.0,  1.0,  1.0,
        -0.5,  1.0,  1.0,

        // Back face
        -0.5, -3.0, -1.0,
        -0.5,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -3.0, -1.0,

        // Top face
        -0.5,  1.0, -1.0,
        -0.5,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom face
        -0.5, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -0.5, -1.0,  1.0,

        // Right face
         1.0, -3.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -3.0,  1.0,

        // Left face
        -0.5, -3.0, -1.0,
        -0.5, -3.0,  1.0,
        -0.5,  1.0,  1.0,
        -0.5,  1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    footVertexPositionBuffer.itemSize = 3;
    footVertexPositionBuffer.numItems = 24;

    footVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, footVertexColorBuffer);
    var colors = [
        [0.8, 0.8, 0.0, 1], // Front face
        [0.8, 0.8, 0.0, 1], // Back face
        [0.8, 0.8, 0.0, 0.8], // Top face
        [0.8, 0.8, 0.0, 0.8], // Bottom face
        [0.8, 0.8, 0.0, 0.8], // Right face
        [0.8, 0.8, 0.0, 0.8]  // Left face
    ];
    var unpackedColors = [];
    for (var i in colors) {
        var color = colors[i];
        for (var j=0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
    footVertexColorBuffer.itemSize = 4;
    footVertexColorBuffer.numItems = 24;

    footVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, footVertexIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    footVertexIndexBuffer.itemSize = 1;
    footVertexIndexBuffer.numItems = 36;

    // lengan
    armVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexPositionBuffer);
    var vertices = [
        // Front face
        -0.5, -3.0,  1.0,
         1.0, -3.0,  1.0,
         1.0,  1.0,  1.0,
        -0.5,  1.0,  1.0,

        // Back face
        -0.5, -3.0, -1.0,
        -0.5,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -3.0, -1.0,

        // Top face
        -0.5,  1.0, -1.0,
        -0.5,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom face
        -0.5, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -0.5, -1.0,  1.0,

        // Right face
         1.0, -3.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -3.0,  1.0,

        // Left face
        -0.5, -3.0, -1.0,
        -0.5, -3.0,  1.0,
        -0.5,  1.0,  1.0,
        -0.5,  1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    armVertexPositionBuffer.itemSize = 3;
    armVertexPositionBuffer.numItems = 24;

    armVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexColorBuffer);
    var colors = [
        [0.0, 0.0, 0.8, 1], // Front face
        [0.0, 0.0, 0.8, 1], // Back face
        [0.0, 0.0, 0.8, 0.8], // Top face
        [0.0, 0.0, 0.8, 0.8], // Bottom face
        [0.0, 0.0, 0.8, 0.8], // Right face
        [0.0, 0.0, 0.8, 0.8]  // Left face
    ];
    var unpackedColors = [];
    for (var i in colors) {
        var color = colors[i];
        for (var j=0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
    armVertexColorBuffer.itemSize = 4;
    armVertexColorBuffer.numItems = 24;

    armVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, armVertexIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    armVertexIndexBuffer.itemSize = 1;
    armVertexIndexBuffer.numItems = 36;
}


var rCube = 0;

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(mvMatrix);

    mat4.rotate(mvMatrix, degToRad(-pitch), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(-yaw), [0, 1, 0]);
    mat4.translate(mvMatrix, [-xPos, -yPos, -zPos]);


    // body
    mvPushMatrix();
    mat4.rotate(mvMatrix, degToRad(rCube), [0, 1, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, bodyVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, bodyVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, bodyVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bodyVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, bodyVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvPopMatrix();

    // head
    mat4.translate(mvMatrix, [0.0, 3.0, 0.0]);

    mvPushMatrix();
    mat4.rotate(mvMatrix, degToRad(rCube), [0, 1, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);


    // tangan kiri
    mat4.translate(mvMatrix, [1.5, -3.0, 0.0]);

    mvPushMatrix();

    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, armVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, armVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, armVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvPopMatrix();

    // tangan kanan
    mat4.translate(mvMatrix, [-4.5, 0.0, 0.0]);

    mvPushMatrix();

    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, armVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, armVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, armVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, armVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvPopMatrix();

    // kaki kanan
    mat4.translate(mvMatrix, [3, -4.0, 0.0]);

    mvPushMatrix();

    gl.bindBuffer(gl.ARRAY_BUFFER, footVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, footVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, footVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, footVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, footVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, footVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvPopMatrix();

    // kaki kiri
    mat4.translate(mvMatrix, [-1.5, 0.0, 0.0]);

    mvPushMatrix();

    gl.bindBuffer(gl.ARRAY_BUFFER, footVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, footVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, footVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, footVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, footVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, footVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvPopMatrix();
}


var lastTime = 0;
var joggingAngle = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        if (speed != 0) {
            xPos -= Math.sin(degToRad(yaw)) * speed * elapsed;
            zPos -= Math.cos(degToRad(yaw)) * speed * elapsed;

            //joggingAngle += elapsed * 0.6; // 0.6 "fiddle factor" - makes it feel more realistic :-)
            yPos = Math.sin(degToRad(joggingAngle)) / 20 + 0.4
        }

        yaw += yawRate * elapsed;
        pitch += pitchRate * elapsed;

        //rPyramid += (90 * elapsed) / 1000.0;
        rCube -= (45 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
}


function tick() {
    requestAnimFrame(tick);
    handleKeys();
    drawScene();
    animate();
}


function webGLStart() {
    var canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders()
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}