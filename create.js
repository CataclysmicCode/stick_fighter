class Prototype {
    constructor(points) {
        this.points = points;
        this.grabSize = 5;
    }

    update() {

        this.display();
        if (!game.grabbed && mouse.buttonPressed) {
            for (var i = 0; i < this.points.length; i += 2) {
                if (
                    game.dist(
                        this.points[i],
                        this.points[i + 1],
                        mouse.x,
                        mouse.y
                    ) < this.grabSize
                ) {
                    game.grabbed = [this, i];
                }
            }
        }
    }

    /*
        Draws a quadratic Bezier curve from (x1, y1) to (x2, y2) with control point (cx, cy).
        The curve is drawn using a series of line segments to approximate the curve.
    */
    curve(x1, y1, cx, cy, x2, y2) {
        
        //begin
        ctx.setLineWidth(1);
        ctx.beginPath();

        // Calculate the optimal amount of segments based on the curve's length and curvature
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const curvature =
            Math.sqrt(Math.pow(cx - x1, 2) + Math.pow(cy - y1, 2)) +
            Math.sqrt(Math.pow(cx - x2, 2) + Math.pow(cy - y2, 2));

        // Adjust the divisor for desired smoothness
        let amount = Math.ceil(distance / game.PLANCK_RES);

        // Increase the number of segments for curves with high curvature
        amount = Math.max(amount, Math.ceil((curvature / game.PLANCK_RES) * 4));

        for (var i = 0; i <= amount; i++) {
            // Calculate t for the current segment
            const t = i / amount;

            // Calculate the coordinates using the quadratic Bezier curve formula
            const x =
                Math.pow(1 - t, 2) * x1 +
                2 * (1 - t) * t * cx +
                Math.pow(t, 2) * x2;
            const y =
                Math.pow(1 - t, 2) * y1 +
                2 * (1 - t) * t * cy +
                Math.pow(t, 2) * y2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x1, y1, this.grabSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, this.grabSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, this.grabSize, 0, 2 * Math.PI);
        ctx.fill();
    }

    /*
        Draws a cubic Bezier curve from (x1, y1) to (x2, y2) with control points (cx1, cy1) and (cx2, cy2).
        The curve is drawn using a series of line segments to approximate the curve.
    */
    bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
        //begin
        ctx.setLineWidth(1);
        ctx.beginPath();

        // Calculate the optimal amount of segments based on the curve's length and curvature
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const curvature =
            Math.sqrt(Math.pow(cx1 - x1, 2) + Math.pow(cy1 - y1, 2)) +
            Math.sqrt(Math.pow(cx2 - cx1, 2) + Math.pow(cy2 - cy1, 2)) +
            Math.sqrt(Math.pow(cx2 - x2, 2) + Math.pow(cy2 - y2, 2));

        // Adjust the divisor for desired smoothness
        let amount = Math.ceil(distance / game.PLANCK_RES);

        // Increase the number of segments for curves with high curvature
        amount = Math.max(amount, Math.ceil((curvature / game.PLANCK_RES) * 4)); // Adjust divisor as needed

        for (var i = 0; i <= amount; i++) {
            // Calculate t for the current segment
            const t = i / amount;

            // Calculate the coordinates using the cubic Bezier curve formula
            const x =
                Math.pow(1 - t, 3) * x1 +
                3 * Math.pow(1 - t, 2) * t * cx1 +
                3 * (1 - t) * Math.pow(t, 2) * cx2 +
                Math.pow(t, 3) * x2;
            const y =
                Math.pow(1 - t, 3) * y1 +
                3 * Math.pow(1 - t, 2) * t * cy1 +
                3 * (1 - t) * Math.pow(t, 2) * cy2 +
                Math.pow(t, 3) * y2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx1, cy1, this.grabSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx2, cy2, this.grabSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x1, y1, this.grabSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, this.grabSize, 0, 2 * Math.PI);
        ctx.fill();

        /*
    ctx.beginPath();
    ctx.moveTo(cx1, cy1);
    ctx.lineTo(x1, y1);
    ctx.moveTo(cx2, cy2);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    */
    }
}
class CurvePrototype extends Prototype {
    constructor() {
        super([10, 10, 10, 100, 100, 100]);
    }

    display() {
        const p = this.points;
        this.curve(p[0], p[1], p[2], p[3], p[4], p[5]);
    }

    apply() {
        const p = this.points,
            x1 = p[0],
            y1 = p[1],
            cx = p[2],
            cy = p[3],
            x2 = p[4],
            y2 = p[5];

        // Calculate the optimal amount of segments based on the curve's length and curvature
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const curvature =
            Math.sqrt(Math.pow(cx - x1, 2) + Math.pow(cy - y1, 2)) +
            Math.sqrt(Math.pow(cx - x2, 2) + Math.pow(cy - y2, 2));

        // Adjust the divisor for desired smoothness
        let amount = Math.ceil(distance / game.PLANCK_RES);

        // Increase the number of segments for curves with high curvature
        amount = Math.max(amount, Math.ceil((curvature / game.PLANCK_RES) * 4));

        var vs = [];
        for (var i = 0; i <= amount; i++) {
            // Calculate t for the current segment
            const t = i / amount;

            // Calculate the coordinates using the quadratic Bezier curve formula
            const x =
                Math.pow(1 - t, 2) * x1 +
                2 * (1 - t) * t * cx +
                Math.pow(t, 2) * x2;
            const y =
                Math.pow(1 - t, 2) * y1 +
                2 * (1 - t) * t * cy +
                Math.pow(t, 2) * y2;

            vs.push(planck.Vec2(game.toGameX(x), game.toGameY(y)));
        }

        // Add a line to planck
        world.createBody().createFixture({
            shape: planck.Chain(vs),
            friction: 0.7,
        });
    }
}
class BezierPrototype extends Prototype {
    constructor() {
        super([10, 10, 10, 100, 100, 10, 100, 100]);
    }

    display() {
        const p = this.points;
        this.bezier(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);
    }

    apply() {
        const p = this.points,
            x1 = p[0],
            y1 = p[1],
            cx1 = p[2],
            cy1 = p[3],
            cx2 = p[4],
            cy2 = p[5],
            x2 = p[6],
            y2 = p[7];

        // Calculate the optimal amount of segments based on the curve's length and curvature
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const curvature =
            Math.sqrt(Math.pow(cx1 - x1, 2) + Math.pow(cy1 - y1, 2)) +
            Math.sqrt(Math.pow(cx2 - cx1, 2) + Math.pow(cy2 - cy1, 2)) +
            Math.sqrt(Math.pow(cx2 - x2, 2) + Math.pow(cy2 - y2, 2));

        // Adjust the divisor for desired smoothness
        let amount = Math.ceil(distance / game.PLANCK_RES);

        // Increase the number of segments for curves with high curvature
        amount = Math.max(amount, Math.ceil((curvature / game.PLANCK_RES) * 4)); // Adjust divisor as needed

        var vs = [];
        for (var i = 0; i <= amount; i++) {
            // Calculate t for the current segment
            const t = i / amount;

            // Calculate the coordinates using the cubic Bezier curve formula
            const x =
                Math.pow(1 - t, 3) * x1 +
                3 * Math.pow(1 - t, 2) * t * cx1 +
                3 * (1 - t) * Math.pow(t, 2) * cx2 +
                Math.pow(t, 3) * x2;
            const y =
                Math.pow(1 - t, 3) * y1 +
                3 * Math.pow(1 - t, 2) * t * cy1 +
                3 * (1 - t) * Math.pow(t, 2) * cy2 +
                Math.pow(t, 3) * y2;

            vs.push(planck.Vec2(game.toGameX(x), game.toGameY(y)));
        }

        // Add a line to planck
        world.createBody().createFixture({
            shape: planck.Chain(vs),
            friction: 0.7,
        });
    }
}

var curveProto = new CurvePrototype();
var bezierProto = new BezierPrototype();
