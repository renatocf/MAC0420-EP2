var program;
var canvas;
var gl;

var lightPosition = vec4( 10.0, 10.0, 10.0, 0.0 );
var lightAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

// transformation and projection matrices
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

// tranlation matrix responsible for zoom in and zoom out.
var zoomMatrix;
var zoomCoords = [0.0, 0.0, 0.0];

// normal matrix
var normalMatrix, normalMatrixLoc;

// translation and scale matrices
var transMatrix, transMatrixObj, scaleMatrix;
var transMatrixLoc, transMatrixObjLoc, scaleMatrixLoc;

// rotate matrix
var rotateMatrix, rotateMatrixLoc;

// Mouse click coordinates
var actualX, actualY;
var lastX, lastY;
var actualcanX, actualcanY;
var lastcanX, lastcanY;

var mousedownL = false;
var mousedownR = false;

var selectObj; // index of the selected object
var flagSelect = false;
var flagT = false;
var flagR = false;
var flagS = false;
var flagX = false;
var flagY = false;
var flagZ = false;

//var ctm;
var ambientColor, diffuseColor, specularColor;

// camera definitions
var trackball;

var eye = vec4(1.0, 0.0, 0.0, 1.0);
var at = vec4(0.0, 0.0, 0.0, 1.0);
var up = vec4(0.0, 1.0, 0.0, 1.0);

var cradius = 2.0;
var ctheta = 0.0;
var cphi = 0.0;

// our universe
var near = -1.0;
var far = 1.0;
var fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)

var flag = true;

// shading type
var fileShading = 0;
var flatShading = 1;
var smoothShading = 2;

var shading = smoothShading;

// loaded objects
var objects = [];

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // create viewport and clear color
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    // enable depth testing for hidden surface removal
    gl.enable(gl.DEPTH_TEST);

    //  load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // create light components
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    // create model view and projection matrices
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // create normal matrix
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    // create translation and and scale matrices
    transMatrixLoc = gl.getUniformLocation(program, "transMatrix");
    scaleMatrixLoc = gl.getUniformLocation(program, "scaleMatrix");
    transMatrixObjLoc = gl.getUniformLocation(program, "transMatrixObj");

    //create rotation matrix
    rotateMatrixLoc = gl.getUniformLocation(program, "rotateMatrix");

    document.getElementById('files').onchange = function (evt) {

        // TO DO: load OBJ file and display
        var files = evt.target.files; // FileList object

        for (var i = 0, f; f = files[i]; i++) {

            var reader = new FileReader();

            reader.onload = function(e) {
                loadObject(e.target.result);
            };

            reader.readAsText(f);
        }
    };

    canvas.onmousedown = function (evt) {
        lastX = evt.clientX;
        lastY = evt.clientY;
        var rst = viewportToCanonicalCoordinates(lastX, lastY);
        lastcanX = rst[0];
        lastcanY = rst[1];

        switch (evt.which) {
            case 1:
                mousedownL = true;
                if (evt.shiftKey) {
                    // Selecionar o objeto mais proximo da camera.
                    flagSelect = true;
                    selectObj = 0; // indice do objeto selecionado.
                }
                break;
            case 3:
                mousedownR = true;
                break;
        }

    };

    canvas.onmousemove = function (evt) {
        actualX = evt.clientX;
        actualY = evt.clientY;
        var rst = viewportToCanonicalCoordinates(actualX, actualY);
        actualcanX = rst[0];
        actualcanY = rst[1];
        switch (evt.which) {
            case 1:
                if (flagSelect && mousedownL) { // estamos manipulando um objeto.
                    var dx = lastcanX - actualcanX;
                    var dy = lastcanY - actualcanY;
                    var dist = Math.sqrt(dx*dx + dy*dy);

                    // Foi escolhida a opcao de translacao
                    if (flagT) {
                        dist = dist * objects[selectObj].radius;
                        if (flagX) {
                            if (actualcanX > lastcanX)
                                objects[selectObj].transValues[0] -= dist;
                            else
                                objects[selectObj].transValues[0] += dist;
                        }
                        else if (flagY) {
                            if (actualcanY > lastcanY)
                                objects[selectObj].transValues[1] -= dist;
                            else
                                objects[selectObj].transValues[1] += dist;
                        }
                        else if (flagZ) {
                           if ((actualcanX >= lastcanX && actualcanY >= lastcanY) ||
                                (actualcanX <= lastcanX && actualcanY >= lastcanY))
                                objects[selectObj].transValues[2] -= dist;
                            else
                                objects[selectObj].transValues[2] += dist;

                            // Keep objects visible.
                            if (objects[selectObj].radius < 1) {
                                if (objects[selectObj].transValues[2] < -1)
                                    objects[selectObj].transValues[2] = -1;
                            }
                            else
                                if (objects[selectObj].transValues[2] < -1 * objects[selectObj].radius)
                                    objects[selectObj].transValues[2] = -1 * objects[selectObj].radius;
                        }

                        lastcanX = actualcanX;
                        lastcanY = actualcanY;
                    }
                    // Foi escolhida a opcao de escala
                    else if (flagS) {
                        if (flagX) {
                            if (actualcanX > lastcanX)
                                objects[selectObj].scaleValues[0] += dist;
                            else
                                objects[selectObj].scaleValues[0] -= dist;
                        }
                        else if (flagY) {
                            if (actualcanY > lastcanY)
                                objects[selectObj].scaleValues[1] += dist;
                            else
                                objects[selectObj].scaleValues[1] -= dist;
                        }
                        else if (flagZ) {
                            if ((actualcanX >= lastcanX && actualcanY >= lastcanY) ||
                                (actualcanX <= lastcanX && actualcanY >= lastcanY))
                                objects[selectObj].scaleValues[2] += dist;
                            else
                                objects[selectObj].scaleValues[2] -= dist;
                        }

                        lastcanX = actualcanX;
                        lastcanY = actualcanY;
                    }
                    else if (flagR) {
                        // Rotacionar o objeto atraves de um trackaball.

                        var trackball_obj = new Trackball(objects[selectObj].centroid,
                                                          Math.abs(objects[selectObj].radius)/2);

                        objects[selectObj].rotationMatrix = mult(objects[selectObj].rotationMatrix,
                            trackball_obj.rotation(lastcanX, lastcanY, actualcanX, actualcanY, 'm'));

                        console.log(objects[selectObj].rotationMatrix);
                    }
                }
                else {
                    if (mousedownL) {
                        var camera_rotate = trackball.rotation(actualcanX, actualcanY,
                                                               lastcanX, lastcanY, 'm');

                        eye = camera_rotate.rotate(eye);
                        at = camera_rotate.rotate(at);
                        up = camera_rotate.rotate(up);
                    }
                }
                break;
            case 3:
                if (mousedownR) {
                    // Zoom in and zoom out.
                    var dx = lastcanX - actualcanX;
                    var dy = lastcanY - actualcanY;
                    var dist = Math.sqrt(dx*dx + dy*dy);

                    var new_near = near, new_far = far;

                    if ((actualcanX >= lastcanX && actualcanY >= lastcanY) ||
                        (actualcanX <= lastcanX && actualcanY >= lastcanY)) {
                        // zoomCoords[2] = zoomCoords[2] + dist;
                        new_far  += dist/2;
                        new_near -= dist/2;
                    }
                    else {
                        // zoomCoords[2] = zoomCoords[2] - dist;
                        new_far  -= dist/2;
                        new_near += dist/2;
                    }

                    if (new_far - new_near < 1) break;
                    if (new_far - new_near > 16) break;

                    far = new_far;
                    near = new_near;
                    console.log("near: " + near + " far: " + far);
                    cradius = far-near;

                    // create eye
                    eye = vec4(cradius * Math.sin(ctheta) * Math.cos(cphi),
                               cradius * Math.sin(ctheta) * Math.sin(cphi),
                               cradius * Math.cos(ctheta));

                    // create trackball
                    trackball = new Trackball(vec3(0, 0, 0), Math.abs(near-far)/2);
                }
                break;
        }
    };

    canvas.onmouseup = function (evt) {
        mousedownL = false;
        mousedownR = false;

        flagS = flagR = flagT = false;
        flagX = flagY = flagZ = false;
    }

    document.onkeyup = function (evt) {
        if (flagSelect) {  // if there is a selected object.
            switch (evt.keyCode) {
                case 46: // delete key
                    console.log("Delect object");
                    // remove o objeto de objects.
                    objects.splice(selectObj, selectObj+1);
                    flagSelect = false;
                    selectObj = -1;
                    break;
                case 88: // x key
                    if (!flagT && !flagS && !flagR) {
                        console.log("Delect object");
                        // remove o objeto de objects.
                        objects.splice(selectObj, selectObj+1);
                        flagSelect = false;
                        selectObj = -1;
                    }
                    console.log("x-axis");
                    flagX = true;
                    break;
                case 89: // y key
                    console.log("y-axis");
                    flagY = true;
                    break;
                case 90: // z key
                    console.log("z-axis");
                    flagZ = true;
                    break;
                case 84: // t key
                    console.log("translate object");
                    flagT = true;
                    break;
                case 83: // s key
                    console.log("Scale object");
                    flagS = true;
                    break;
                case 82: // r key
                    console.log("Rotate object");
                    flagR = true;
                    break;
                case 27: // tecla ESC, des-selecionda o objeto
                    flagSelect = false;
                    selectObj = -1;
                    break;
                // teste
                case 79: // tecla 'o' ou 'O' muda o objeto selecionado para o proximo da lista.
                    selectObj = selectObj + 1;
                    if (selectObj > objects.length)
                        selectObj = 0;
                    break;
            }
        }
    };

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
       flatten(specularProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
       flatten(lightPosition) );

    gl.uniform1f(gl.getUniformLocation(program,
       "shininess"),materialShininess);

    // create eye
    eye = vec4(cradius * Math.sin(ctheta) * Math.cos(cphi),
               cradius * Math.sin(ctheta) * Math.sin(cphi),
               cradius * Math.cos(ctheta));

    // create trackball
    trackball = new Trackball(vec3(0, 0, 0), Math.abs(near-far)/2);

    render();
}

var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var wrapper = document.getElementById( "gl-wrapper" );
    var ratio = wrapper.clientHeight/wrapper.clientWidth;

    // create model view matrix
    var e = vec3(eye[0], eye[1], eye[2]);
    var a = vec3(at[0], at[1], at[2]);
    var u = vec3(up[0], up[1], up[2]);
    modelViewMatrix = lookAt(e, a, u);
    modelViewMatrix = mult(modelViewMatrix, scaleM(vec3(ratio, ratio, ratio)));

    zoomMatrix = translate( zoomCoords );
    modelViewMatrix = mult(modelViewMatrix, zoomMatrix);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );

    // create persperctive projection matrix
    projectionMatrix = perspective(fovy, 1/ratio, near, far);
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    // create rotation matrix from quaternion
    //rotateMatrix = createRotMatrixFromQuat( rquat );
    //gl.uniformMatrix4fv( rotateMatrixLoc, false, flatten(rotateMatrix) );

    for (i = 0; i < objects.length; i++)
    {
        var object = objects[i];
        var radius = object.radius;

        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
                        flatten(ambientProduct));
        gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
                         flatten(diffuseProduct) );
        gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
                         flatten(specularProduct) );

        createBuffers(object);

        if (selectObj == i) {
                // muda a cor do objeto selecionado para um tom de azul.
                if (flagSelect) {
                    var materialDiffuse_obj = vec4( 0.2, 0.3, 0.6, 1.0 );
                    var diffuseProduct_obj = mult(lightDiffuse, materialDiffuse_obj);
                    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
                                flatten(diffuseProduct_obj) );
                }
            }
        else
            gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
                flatten(diffuseProduct) );


        // create translation matrix to set object in the origin and capture
        // the manipulation of the objects.
        transMatrix = translate(negate(object.centroid));
        gl.uniformMatrix4fv( transMatrixLoc, false, flatten(transMatrix) );

        // create translation matrix to set object in the origin and capture
        // the manipulation of the objects.
        transMatrixObj = translate(negate(object.transValues));
        gl.uniformMatrix4fv( transMatrixObjLoc, false, flatten(transMatrixObj) );

        // create scale matrix to fit object inside the canvas and capture the
        // manipulation of the objects.
        scaleMatrix = scaleM(vec3(1/radius, 1/radius, 1/radius));
        scaleMatrix = mult(scaleMatrix, scaleM(object.scaleValues));
        gl.uniformMatrix4fv( scaleMatrixLoc, false, flatten(scaleMatrix) );

        rotateMatrix = object.rotationMatrix;
        gl.uniformMatrix4fv( rotateMatrixLoc, false, flatten(rotateMatrix) );

        // create normal matrix: Matrix that fix the normal vector after the transformations
        var aux_matrix = mult(modelViewMatrix, transMatrix);
        aux_matrix = mult(aux_matrix, scaleMatrix);
        aux_matrix = mult(aux_matrix, rotateMatrix);
        normalMatrix = transpose( invert4x4( aux_matrix ) );
        gl.uniformMatrix4fv( normalMatrixLoc, false, flatten(normalMatrix) );

        // draw triangles
        gl.drawArrays( gl.TRIANGLES, 0, object.pointsArray.length );

        if (flagSelect && i == selectObj)
            drawAxes(object);
    }

    requestAnimFrame(render);
}

function createBuffers(object) {

    var nBuffers = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffers );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(object.selectShading()), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffers = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffers );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(object.pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function loadObject(data) {

    // TO DO: convert strings into array of vertex and normal vectors
    var newObject = loadObjFile(data);

    newObject.selectShading = function() {
        switch (shading) {
          case fileShading:   return this.fileNormals;
          case flatShading:   return this.flatNormals;
          case smoothShading: return this.smoothNormals;
        }
    }

    // Insere os valores de escala do objeto. Inicializados com 1, pois
    // o objeto ainda não foi manipulado.
    newObject.scaleValues = vec3(1.0, 1.0, 1.0);

    // Insere os valores de translação do objeto. Inicializados com 0, pois
    // o objeto ainda não foi manipulado.
    newObject.transValues = vec3(0.0, 0.0, 0.0);

    // Insere os angulos de rotacao do objeto. Inicializados com 0, pois
    // o objeto ainda não foi manipulado.
    newObject.rotationMatrix = mat4(1);

    objects.push(newObject);
    console.log(newObject);
}

function viewportToCanonicalCoordinates(x, y) {
    var vp_right = canvas.width;
    var vp_top = canvas.height;
    var can_x;
    var can_y;

    can_x = (x * (2/vp_right)) - 1;
    // O ponto (0, 0) no canvas e o conto superior esquerdo.
    can_y = 1 - (y * (2/vp_top));

    return [can_x, can_y];
}

function drawAxes(object) {
    gl.lineWidth(2);

    // var materialAmbient_axes = vec4( 0.3, 0.7, 0.2, 1.0 );
    var materialAmbient_axes = vec4( 0, 1, 0, 1 );
    var lightAmbient_axes = vec4( 1, 1, 1, 1 );

    var ambientProduct_axes = mult(lightAmbient_axes, materialAmbient_axes);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
                  flatten(ambientProduct_axes) );

    var zeros = vec4(0.0, 0.0, 0.0, 1.0);

    var diffuseProduct_axes = mult(lightDiffuse, zeros);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
                  flatten(diffuseProduct_axes) );

    var specularProduct_axes = mult(lightSpecular, zeros);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
                  flatten(specularProduct_axes) );

    var lines = [
        vec4(object.dimension.maxX*1.4, 0.0, 0.0, 1.0),
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(0.0, object.dimension.maxY*1.3, 0.0, 1.0),
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(0.0, 0.0, object.dimension.maxZ*1.4, 1.0)
    ];

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(lines), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    gl.drawArrays( gl.LINE_STRIP, 0, 5);
}
