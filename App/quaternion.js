function createRotationQuaternion(axis, angle) {
    var quat = [];

    quat[3] = Math.cos( radians(angle/2) );
    quat[0] = axis[0] * Math.sin( radians(angle/2) );
    quat[1] = axis[1] * Math.sin( radians(angle/2) );
    quat[2] = axis[2] * Math.sin( radians(angle/2) );

    return quat;
}

function quaternionMulti(q1, q2) {
	var result = [];
	result[3] = (q1[3]*q2[3] - q1[0]*q2[0] - q1[1]*q2[1] - q1[2]*q2[2]);
	result[0] = (q1[3]*q2[0] + q1[0]*q2[3] + q1[1]*q2[2] - q1[2]*q2[1]);
	result[1] = (q1[3]*q2[1] - q1[0]*q2[2] + q1[1]*q2[3] + q1[2]*q2[0]);
	result[2] = (q1[3]*q2[2] + q1[0]*q2[1] - q1[1]*q2[0] + q1[2]*q2[3]);

	return result;
}


function  createRotMatrixFromQuat(quat) {
	var rmatrix = mat4();
	
	rmatrix[0][0] = 1 - 2*quat[1]*quat[1] - 2*quat[2]*quat[2];
	rmatrix[0][1] = 2*quat[0]*quat[1] + 2*quat[3]*quat[2];
	rmatrix[0][2] = 2*quat[0]*quat[2] - 2*quat[3]*quat[1];
	rmatrix[0][3] = 0;
	rmatrix[1][0] = 2*quat[0]*quat[1] - 2*quat[3]*quat[2];
	rmatrix[1][1] = 1 - 2*quat[0]*quat[0] - 2*quat[2]*quat[2];
	rmatrix[1][2] = 2*quat[1]*quat[2] + 2*quat[3]*quat[2];
	rmatrix[1][3] = 0;
	rmatrix[2][0] = 2*quat[0]*quat[2] + 2*quat[3]*quat[1];
	rmatrix[2][1] = 2*quat[1]*quat[2] - 2*quat[3]*quat[0];
	rmatrix[2][2] = 1 - 2*quat[0]*quat[0] - 2*quat[1]*quat[1];
	rmatrix[2][3] = 0;
	rmatrix[3] 	  = vec4(0, 0, 0, 1);

	return rmatrix;

}

function inverseQuaternion(quat) {
	var result = [];

	result[0] = quat[0];
	result[1] = -quat[1];
	result[2] = -quat[2];
	result[3] = -quat[3];

	return result;
}


          
    