/*
////////////////////////////////////////////////////////////////////////////////
-------------------------------------------------------------------------------
                                 TRACKBALL
-------------------------------------------------------------------------------
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
*/

/**
 * Trackball constructor
 * Class representing a virtual trackball
 * @param center Center for the trackball
 * @param radius Radius for the trackball
 */
function Trackball(center, radius) {
    this.center = center;
    this.radius = radius;
}

/**
 * Create rotation quaternion
 * @param  x1 x-axis initial position
 * @param  y1 y-axis initial position
 * @param  x2 x-axis final position
 * @param  y2 y-axis final position
 * @return Rotation quaternion to rotate vector in the trackball
 */
Trackball.prototype.rotation = function(x1, y1, x2, y2, mORq) {
    var z1 = this.calculateZ(x1, y1);
    var z2 = this.calculateZ(x2, y2);

    var V1 = normalize(vec3(x1, y1, z1));
    var V2 = normalize(vec3(x2, y2, z2));

    var N = cross(V1, V2);
    var theta = 4 * Math.acos(dot(V1, V2));

    if (N[0] == 0 && N[1] == 0 && N[2] == 0) theta = 0;

    if (mORq == 'q') // return a quaternion
        return createRotationQuaternionFromAngleAndAxis(theta, N).normalize();

    // return a rotation matrix
    var rotationMatrix = rotate(theta, N);
    rotationMatrix.rotate = function(vector) {
        return multMatrixVec(this, vector);
    }
    return rotationMatrix;
}

/**
 * @param  x1 x-axis position
 * @param  y1 y-axis position
 * @return Depth for a bidimensional position in the trackball
 */
Trackball.prototype.calculateZ = function(x, y) {
    var r = this.radius;
    var x2 = x*x, y2 = y*y, r2 = r*r;

    if (x2 + y2 <= r2/2)
        return Math.sqrt(r2 - (x2 + y2));
    else
        return (r2/2)/Math.sqrt(x2 + y2);
}
