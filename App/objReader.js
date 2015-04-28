function loadObjFile(data, shading) {

	// TO DO:   (i) Parse OBJ file and extract vertices and normal vectors

    var lines = data.split("\n");

    var dimension = {
        minX: Infinity, maxX: -Infinity,
        minY: Infinity, maxY: -Infinity,
        minZ: Infinity, maxZ: -Infinity
    }

    var v_count = 0;
    var vertices = [];

    var vn_count = 0;
    var normals = [];

    var f_count = 0;
    var faces = [];
    
    var pointsArray = [];
    var fileNormals = [];
    var flatNormals = [];
    var smoothNormals = [];

    for (var i = 0; i < lines.length; i++) {
        
        var elements = lines[i].split(/\s+/);
        switch (elements.shift()) {

            case "v":
                var x = parseFloat(elements[0]);
                var y = parseFloat(elements[1]);
                var z = parseFloat(elements[2]);
                var w = elements.length == 3 ? 1.0 : parseFloat(elements[3]);
                
                vertices.push(vec4(x, y, z, w));

                if(x < dimension.minX) dimension.minX = x;
                if(y < dimension.minY) dimension.minY = y;
                if(z < dimension.minZ) dimension.minZ = z;

                if(x > dimension.maxX) dimension.maxX = x;
                if(y > dimension.maxY) dimension.maxY = y;
                if(z > dimension.maxZ) dimension.maxZ = z;

                v_count++;
                break;

            case "vn":
                var v0 = parseFloat(elements[0]);
                var v1 = parseFloat(elements[1]);
                var v2 = parseFloat(elements[2]);
                var v3 = elements.length == 3 ? 0.0 : parseFloat(elements[3]);
                
                normals.push(vec4(v0, v1, v2, v3));
                vn_count++;
                break;

            case "f":
                var v0 = elements[0].split("/");
                var v1 = elements[1].split("/");
                var v2 = elements[2].split("/");
                
                faces.push([ v0, v1, v2 ]);
                f_count++;
                break;
        }
    }

    for (var i = 0, face; face = faces[i]; i++) {
        pointsArray.push(vertices[parseInt(face[0][0])-1]);
        pointsArray.push(vertices[parseInt(face[1][0])-1]);
        pointsArray.push(vertices[parseInt(face[2][0])-1]);

        if (parseInt(face[0][2])) fileNormals.push(normals[parseInt(face[0][2])-1]);
        if (parseInt(face[1][2])) fileNormals.push(normals[parseInt(face[1][2])-1]);
        if (parseInt(face[2][2])) fileNormals.push(normals[parseInt(face[2][2])-1]);
    }

    var centroid = vec3(
        (dimension.maxX+dimension.minX)/2,
        (dimension.maxY+dimension.minY)/2,
        (dimension.maxZ+dimension.minZ)/2
    );
    
	// TO DO:  (ii) If normal vectors are not in the file, you will need to calculate them

    // Normals for flat shading
    for (var i = 0, face; face = faces[i]; i++) {
        var a = parseInt(face[0][0])-1;
        var b = parseInt(face[1][0])-1;
        var c = parseInt(face[2][0])-1;

        var t1 = subtract(vertices[b], vertices[a]);
        var t2 = subtract(vertices[c], vertices[b]);
        var normal = vec4(cross(t1, t2), 0);

        for (var j = 0; j < 3; j++)
            flatNormals.push(normal);
    }

    // Normals for smooth shading, if they don't exist
    for (var i = 0; i < vertices.length; i++) {
        vertices[i].count = 0;
        vertices[i].smoothNormal = vec4(0, 0, 0, 0);
    }

    for (var i = 0, face; face = faces[i]; i++) {
        var a = parseInt(face[0][0])-1;
        var b = parseInt(face[1][0])-1;
        var c = parseInt(face[2][0])-1;

        var t1 = subtract(vertices[b], vertices[a]);
        var t2 = subtract(vertices[c], vertices[b]);
        var normal = vec4(cross(t1, t2), 0);

        vertices[a].count += 1;
        vertices[a].smoothNormal = add(vertices[a].smoothNormal, normal);

        vertices[b].count += 1;
        vertices[b].smoothNormal = add(vertices[b].smoothNormal, normal);

        vertices[c].count += 1;
        vertices[c].smoothNormal = add(vertices[c].smoothNormal, normal);
    }

    for (var vertice in vertices) {
        for (var pos in vertice.smoothNormal)
            pos /= vertice.count;
        vertice.smoothNormal = vertice.smoothNormal;
    }

    for (var i = 0, face; face = faces[i], i < faces.length; i++) {
        smoothNormals.push(normalize(vertices[parseInt(face[0][0])-1].smoothNormal));
        smoothNormals.push(normalize(vertices[parseInt(face[1][0])-1].smoothNormal));
        smoothNormals.push(normalize(vertices[parseInt(face[2][0])-1].smoothNormal));
    }

	// TO DO: (iii) Return vertices and normals and any associated information you might find useful
    return [ centroid, pointsArray, fileNormals, flatNormals, smoothNormals, dimension ];
}
