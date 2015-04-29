// OBS: Não está mais sendo desenhado o cubo na inicialização
// desenha apenas os objetos que são carregados a partir dos .obj

var program;
var canvas;
var gl;

var numVertices  = 36;

var pointsArray = [];
var normalsArray = [];

// Os vertices e normais de todos os objetos.
var pointsArrayAll = [];
var normalsArrayAll = [];
// Um buffer para cada objeto.
var nBuffers = [];
var vBuffers = [];

var quant_objects = 0;

var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5, -0.5, -0.5, 1.0 )
    ];

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

// matriz de translacao
var transMatrix;
var transMatrixLoc;

// matriz de escala
var scaleMatrix;
var scaleMatrixLoc;

//var ctm;
var ambientColor, diffuseColor, specularColor;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 1;
var theta =[0, 0, 0];

var centroid = [];
var dimension = {};
var dmax = [];

var thetaLoc;

// camera definitions
var eye = vec3(1.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var cradius = 1.0;
var ctheta = 0.0;
var cphi = 0.0;

// our universe
var xleft = -1.0;
var xright = 1.0;
var ybottom = -1.0;
var ytop = 1.0;
var znear = -100.0;
var zfar = 100.0;

var flag = true;

// first round
var first = true

// shading type
var fileShading = 0;
var flatShading = 1;
var smoothShading = 2;

var shading = flatShading;
var old_shading = shading;

var fileNormals = [];
var flatNormals = [];
var smoothNormals = [];

// generate a quadrilateral with triangles
function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = vec4(cross(t1, t2), 0);

     pointsArray.push(vertices[a]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[b]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal);   
     pointsArray.push(vertices[a]);  
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[d]); 
     normalsArray.push(normal);    

     flatNormals = normalsArray;
     smoothNormals = normalsArray;
}

// define faces of a cube
function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

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
    
    // draw simple cube for starters
    if (first) { colorCube(); first = !first; }

    // create vertex and normal buffers
    // Não está criando o cubo no começo da execução.
    //createBuffers()

    thetaLoc = gl.getUniformLocation(program, "theta"); 

    // create light components
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    // create model view and projection matrices
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // cria a matriz de translação
    transMatrixLoc = gl.getUniformLocation(program, "transMatrix");
    // cria a matriz de escala
    scaleMatrixLoc = gl.getUniformLocation(program, "scaleMatrix");

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
                //carregou mais um objeto.
                quant_objects++;
                //render();
                //createBuffers();
            };

            reader.readAsText(f);
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

    // Não está aletarando os shadings. Utiliza sempre smooth shading
    /*if (shading != old_shading) {
        switch (shading) {
          case fileShading:   normalsArray = fileNormals;   break;
          case flatShading:   normalsArray = flatNormals;   break;
          case smoothShading: normalsArray = smoothNormals; break;
        }
        createBuffers();
        old_shading = shading;
        console.log("Changind to " + shading);
    }*/

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var wrapper = document.getElementById( "gl-wrapper" );
    var ratio = wrapper.clientHeight/wrapper.clientWidth;
            
    
            
    if (flag) theta[axis] += 2.0;
            
    eye = vec3(cradius * Math.sin(ctheta) * Math.cos(cphi),
               cradius * Math.sin(ctheta) * Math.sin(cphi), 
               cradius * Math.cos(ctheta));

    modelViewMatrix = lookAt(eye, at, up);
              
    // Cria a matriz de model view.
    modelViewMatrix = mult(modelViewMatrix, scaleM(vec3(ratio, 1, 1)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], [1, 0, 0] ));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], [0, 1, 0] ));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], [0, 0, 1] ));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Cria a matriz de projeção ortogonal
    projectionMatrix = ortho(xleft, xright, ybottom, ytop, znear, zfar);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Para cada objeto que existe no canvas crias buffers correspondentes aos
    // vertices e normais desse objeto.
    // Cria a matriz de translação e escala especifica para redimensionar e color
    // o objeto no centro do canvas e desenha o objeto.
    for (i = 0; i < quant_objects; i++)
    {
        createBuffers(i);
        // Cria a matriz de tranlação, para colocar o centro do objeto na origem.
        transMatrix = translate(negate(centroid[i]));
        gl.uniformMatrix4fv(transMatrixLoc, false, flatten(transMatrix));

        // Cria a matriz de escala, para colocar o objeto todo do canvas.
        scaleMatrix = scaleM( vec3(2/dmax[i], 2/dmax[i], 2/dmax[i]) );
        gl.uniformMatrix4fv( scaleMatrixLoc, false, flatten(scaleMatrix) );

        // Desenha os triangulos de cada objeto.        
        gl.drawArrays( gl.TRIANGLES, 0, pointsArrayAll[i].length );
    }    

    requestAnimFrame(render);
}

function createBuffers(object) {
    
    nBuffers[object] = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffers[object] );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArrayAll[object]), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    vBuffers[object] = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffers[object] );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArrayAll[object]), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function loadObject(data) {

    // TO DO: convert strings into array of vertex and normal vectors
    var result = loadObjFile(data, shading);
    
    fileNormals   = result[2];
    flatNormals   = result[3];
    smoothNormals = result[4];
    dimension     = result[5];
    centroid.push(result[0]);  
    pointsArrayAll.push(result[1]);
    
    if (fileNormals.length == 0) fileNormals = smoothNormals;

    dmax.push(Math.sqrt(
        Math.pow(dimension.maxX-dimension.minX, 2)
        + Math.pow(dimension.maxY-dimension.minY, 2)
        + Math.pow(dimension.maxZ-dimension.minZ, 2)
    ));

    normalsArrayAll.push(smoothNormals);

    console.log(centroid);
    console.log(dmax);
}
