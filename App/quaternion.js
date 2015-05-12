/*
////////////////////////////////////////////////////////////////////////////////
-------------------------------------------------------------------------------
                              QUATERNION (IH)
-------------------------------------------------------------------------------
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
*/

/**
 * Quaternion constructor
 * Class representing the group of Quaternions (IH)
 * @param scalar    Scalar argument of quaternion
 * @param vectorial Vectorial argument of quaternion
 */
function Quaternion(scalar, vectorial) {
    this.s = scalar;
    if (typeof(vectorial) !== 'undefined') {
        this.v = vectorial.slice(0, 3);
    }
}

/**
 * Operator +
 * @param  q Quartenion to be added
 * @return Sum of this quartenion with q
 */
Quaternion.prototype.add = function(q) {
    return new this.constructor(this.s + q.s, add(this.v, q.v));
}

/**
 * Operator x
 * @param  q Quartenion to be multiplied
 * @return Product of this quartenion with q
 */
Quaternion.prototype.mul = function(q) {
    return new this.constructor(
        this.s * q.s - dot(this.v, q.v),
        add(add(scalar(this.s, q.v), scalar(q.s, this.v)), cross(this.v, q.v))
    );
}

/**
 * Operator *
 * @return Conjugate of this quartenion
 */
Quaternion.prototype.conjugate =  function() {
    return new this.constructor(this.s, negate(this.v));
}

/**
 * Operator (vec4)
 * @return Cast of quartenion to vec4
 */
Quaternion.prototype.toVec4 = function() {
    return vec4(this.s, this.v[0], this.v[1], this.v[2]);
}

/**
 * Operator ||
 * @return Norm of this quartenion
 */
Quaternion.prototype.norm = function() {
    return dot(this.toVec4(), this.toVec4());
}

/**
 * @return Normalized version of this quartenion
 */
Quaternion.prototype.normalize = function() {
    return new this.constructor(
        this.s/this.norm(),
        scalar(1/this.norm(), this.v)
    );
}

/**
 * Operator q()q^-1
 * Use quartenion properties to represent a rotation in IR³
 * @param  vector Vector to be rotated
 * @return Vector rotated by this quartenion
 */
Quaternion.prototype.rotate = function(vector) {
    vq = new Quaternion(0, vector);
    return this.mul(vq.mul(this.inverse())).v;
}

/*
////////////////////////////////////////////////////////////////////////////////
-------------------------------------------------------------------------------
                        ROTATION QUATERNION (IH_1)
-------------------------------------------------------------------------------
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
*/

// Make subclass of Quaternion
RotationQuaternion.prototype = new Quaternion();
RotationQuaternion.prototype.constructor = RotationQuaternion;

/**
 * RotationQuaternion constructor
 * Class representing the subgroup of Quaternions (IH) which represent
 * all possible rotations in IR³
 *
 * @param scalar    Scalar argument of quaternion
 * @param vectorial Vectorial argument of quaternion
 */
function RotationQuaternion(scalar, vectorial) {
    Quaternion.call(this, scalar, vectorial);
}

RotationQuaternion.identity = new Quaternion(1, vec3());

/**
 * Operator ^-1
 * @return Inverse of this quartenion (same as conjugate)
 */
RotationQuaternion.prototype.inverse = function() {
    return this.conjugate();
}

/*
////////////////////////////////////////////////////////////////////////////////
-------------------------------------------------------------------------------
                            RELATED FUNCTIONS
-------------------------------------------------------------------------------
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
*/

/**
 * @param  angle Angle of rotation
 * @param  axis  Axis of rotation
 * @return RotationQuartenion which represents an object being rotated
 *         by an angle around an axis
 */
function createRotationQuaternionFromAngleAndAxis(angle, axis) {
    return new RotationQuaternion(
        Math.cos(radians(angle/2)),
        scalar( Math.sin(radians(angle/2)), axis)
    );
}
