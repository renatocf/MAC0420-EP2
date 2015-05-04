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

// translation and scale matrices
var transMatrix, scaleMatrix;
var transMatrixLoc, scaleMatrixLoc;

// rotate matrix
var rotateMatrix, rotateMatrixLoc;
// rotation quaternion
var rquat = [0, 0, 0, 1];

// tranlation matrix responsible for zoom in and zoom out.
var zoomMatrix;
var zoomCoords = [0.0, 0.0, 0.0];

// Mouse click coordinates
var mouseupX, mouseupY;
var mousedownX, mousedownY;
var mupcanX, mupcanY;
var mdowncanX, mdowncanY;

var selectObj = false;
var flagT = false;
var flagR = false;
var flagS = false;

//var ctm;
var ambientColor, diffuseColor, specularColor;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 1;
var theta =[0, 0, 0];

//var centroid = [];
//var dimension = {};
//var dmax = [];

var thetaLoc;

// camera definitions
var eye = vec3(1.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

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

    thetaLoc = gl.getUniformLocation(program, "theta");

    // create light components
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    // create model view and projection matrices
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // create translation and and scale matrices
    transMatrixLoc = gl.getUniformLocation(program, "transMatrix");
    scaleMatrixLoc = gl.getUniformLocation(program, "scaleMatrix");

    // create rotation matrix
    rotateMatrixLoc = gl.getUniformLocation(program, "rotateMatrix");

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    document.getElementById("ButtonF").onclick = function(){shading = flatShading;};
    document.getElementById("ButtonS").onclick = function(){shading = smoothShading;};
    document.getElementById("ButtonN").onclick = function(){shading = fileShading;};

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

    document.onmousedown = function (evt) {
        mousedownX = evt.clientX;
        mousedownY = evt.clientY;
        var rst = viewportToCanonicalCoordinates(mousedownX, mousedownY);
        mdowncanX = rst[0];
        mdowncanY = rst[1];
        switch (evt.which) {
            case 1:
                if (evt.shiftKey) {
                    // Selecionar o objeto mais proximo da camera.
                    // Não sei como!
                    selectObj = true;
                } 
                break;
        }

    };
    
    document.onmouseup = function (evt) {
        mouseupX = evt.clientX;
        mouseupY = evt.clientY;
        var rst = viewportToCanonicalCoordinates(mouseupX, mouseupY);
        mupcanX = rst[0];
        mupcanY = rst[1];
        switch (evt.which) {
            case 1:
                // Rotatcionar a camera!
                // Não sei como ainda!
                // Rotaciona entorno do eixo y 45 todo vez que 
                // ocorrer um evento de mouse up.
                if (objects.length != 0)
                {
                    var axis = [0, 1, 0];
                    axis = normalize(axis);
                    var lquat = createRotationQuaternion(axis, 45);
                    rquat = quaternionMulti(lquat, rquat);
                }
                break;
            case 3:
                // Zoom in and zoom out.
                var d1 = mupcanX - mdowncanX;
                var d2 = mupcanY - mdowncanY;
                if ( Math.abs(d1) > Math.abs(d2) )
                    zoomCoords[2] = zoomCoords[2] + d1;
                else
                    zoomCoords[2] = zoomCoords[2] + d2;

                // Valores maiores que 1.5 deforma a imagem, o objeto
                // sai do campo de visão.
                if (zoomCoords[2] > 1.5)
                    zoomCoords[2] = 1.5;
                // Valores menores que -7, deixam a imagem muito pequena.
                else if (zoomCoords[2] < -7)
                    zoomCoords[2] = -7;
                console.log(zoomCoords[2]);
                break;                          
        }
    };

    document.onkeyup = function (evt) {
        console.log(evt.keyCode);
        if (selectObj) {  // if there is a selected object.
            switch (evt.keyCode) {
                case 46: // delete key
                    alert("Delect object");
                    // remove o objeto de objects.
                    selectObj = false;                
                    break;
                case 88: // x key
                    if (flagT) {
                        alert("translate on x-axis");
                        flagT = false;
                    }
                    else if (flagR) {
                        alert("rotate on x-axis");
                        flagR = false;
                    }
                    else if (flagS) {
                        alert("scale on x-axis");
                        flagS = false;
                    }
                    else { 
                        alert("Delect object");
                    // remove o objeto de objects.
                    selectObj = false; 
                    }               
                    break;
                case 89: // y key
                    if (flagT) {
                        alert("translate on y-axis");
                        flagT = false;
                    }
                    else if (flagR) {
                        alert("rotate on y-axis");
                        flagR = false;
                    }
                    else if (flagS) {
                        alert("scale on y-axis");
                        flagS = false; 
                    } 
                    break;
                case 90: // z key
                    if (flagT) {
                        alert("translate on z-axis");
                        flagT = false;
                    }
                    else if (flagR) {
                        alert("rotate on z-axis");
                        flagR = false;
                    }
                    else if (flagS) {
                        alert("scale on z-axis");
                        flagS = false;
                    }
                    break;
                case 84: // t key                
                    alert("translate object");
                    flagT = true;
                    break;
                case 83: // s key
                    alert("Scale object");
                    flagS = true;
                    break;
                case 82: // r key
                    alert("Rotate object");
                    flagR = true;
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

    render();
}

var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var wrapper = document.getElementById( "gl-wrapper" );
    var ratio = wrapper.clientHeight/wrapper.clientWidth;

    if (flag) theta[axis] += 2.0;

    // create eye
    eye = vec3(cradius * Math.sin(ctheta) * Math.cos(cphi),
               cradius * Math.sin(ctheta) * Math.sin(cphi),
               cradius * Math.cos(ctheta));

    // create model view matrix
    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = mult(modelViewMatrix, scaleM(vec3(ratio, ratio, ratio)));

    zoomMatrix = translate( zoomCoords );
    modelViewMatrix = mult(modelViewMatrix, zoomMatrix);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );

    // create persperctive projection matrix
    projectionMatrix = perspective(fovy, 1/ratio, near, far);
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    // create rotation matrix from quaternion
    rotateMatrix = createRotMatrixFromQuat( rquat );
    gl.uniformMatrix4fv( rotateMatrixLoc, false, flatten(rotateMatrix) );

    for (i = 0; i < objects.length; i++)
    {
        var object = objects[i];
        var radius = object.radius;

        createBuffers(object);

        // create translation matrix to set object in the origin
        transMatrix = translate(negate(object.centroid));
        gl.uniformMatrix4fv( transMatrixLoc, false, flatten(transMatrix) );

        // create scale matrix to fit object inside the canvas
        scaleMatrix = scaleM(vec3(1/radius, 1/radius, 1/radius));
        gl.uniformMatrix4fv( scaleMatrixLoc, false, flatten(scaleMatrix) );

        // draw triangles
        gl.drawArrays( gl.TRIANGLES, 0, object.pointsArray.length );
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

    objects.push(newObject);
    console.log(newObject);
}

function viewportToCanonicalCoordinates(x, y) {
    var vp_right = document.documentElement.clientWidth;
    var vp_top = document.documentElement.clientHeight;
    var can_x;
    var can_y;

    can_x = (x * (2/vp_right)) - 1;
    // O ponto (0, 0) no canvas e o conto superior esquerdo.
    can_y = 1 - (y * (2/vp_top));

    return [can_x, can_y];  
}

function normalOfTriagle(p0, p1, p2)
{
    var a = subtract(p1, p0);
    var b = subtract(p2, p1);    
    var normal = vec4(cross(a, b), 0);
    normal = normalize(normal);

    return normal;
}
