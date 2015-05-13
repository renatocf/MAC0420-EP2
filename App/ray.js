function Ray(e, d) {
    this.e = e;
    this.d = d;
    this.direction = normalize(subtract(d, e));
}

Ray.prototype.intersect = function(x, y, z, near, far) {

    var a = x[0] - y[0]; var d = x[0] - z[0]; var g = this.d[0];
    var b = x[1] - y[1]; var e = x[1] - z[1]; var h = this.d[1];
    var c = x[2] - y[2]; var f = x[2] - z[2]; var i = this.d[2];

    var j = x[0] - this.e[0];
    var k = x[1] - this.e[1];
    var l = x[2] - this.e[2];

    var M = a*(e*i - h*f) + b*(g*f - d*i) + c*(d*h - e*g);

    var t = -( f*(a*k - j*b) + e*(j*c - a*l) + d*(b*l - k*c) )/M;
    if ((t > near) || (t < far)) return -1;

    var beta =  ( j*(e*i - h*f) + k*(g*f - d*i) + l*(d*h - e*g) )/M;
    if ((beta < 0) || (beta > 1 - gamma)) return -1;

    var gamma = ( i*(a*k - j*b) + h*(j*c - a*l) + g*(b*l - k*c) )/M;
    if ((gamma < 0) || (gamma > 1)) return -1;

    return t;
}
