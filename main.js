/*
    Todo:

    Structures class
    Prototype class
    Car class

    Store prototypes in a organized way
*/

// Get canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Set canvas dimensions
canvas.width = 1600;
canvas.height = 800;

var scale = 20; // Drawing scale
const world = planck.World({ gravity: planck.Vec2(0, -9.8 * 3) });
const grabableBodies = [];
var game = {
    PLANCK_RES: 200,
    HALF_WIDTH: canvas.width / scale / 2,
    HALF_HEIGHT: canvas.height / scale / 2,
    WORLD: world,

    // Cam x&y
    x: 0,
    y: 0,

    // Convert canvas coords to game coords
    toGameX: function (x) {
        return (x + game.x) / scale - game.HALF_WIDTH;
    },
    toGameY: function (y) {
        return game.HALF_HEIGHT - (y - game.y) / scale;
    },

    // Conversions
    radToDeg: function (r) {
        return (r * 360) / Math.PI;
    },
    degToRad: function (r) {
        return (r * Math.PI) / 360;
    },

    // Game scale
    setScale: function (n) {
        scale = n;
        game.HALF_WIDTH = canvas.width / scale / 2;
        game.HALF_HEIGHT = canvas.height / scale / 2;
    },

    // Debug drawing
    renderWorld: function (world, ctx) {
        ctx.globalAlpha = 0.5;
        ctx.setLineWidth(0.1);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-game.x + canvas.width / 2, game.y + canvas.height / 2); // Translate to center
        ctx.scale(scale, -scale); // Flip y-axis

        // Drow bodies
        for (let body = world.getBodyList(); body; body = body.getNext()) {
            const position = body.getPosition();
            const angle = body.getAngle();

            for (
                let fixture = body.getFixtureList();
                fixture;
                fixture = fixture.getNext()
            ) {
                const shape = fixture.getShape();
                const shapeType = shape.getType();

                if (body.isDynamic()) {
                    if (body.isAwake()) {
                        ctx.strokeStyle = "red";
                        ctx.fillStyle = "pink";
                    } else {
                        ctx.strokeStyle = "gray";
                        ctx.fillStyle = "lightgray";
                    }
                } else {
                    ctx.strokeStyle = "green";
                    ctx.fillStyle = "lime";
                }

                if (shapeType === "circle") {
                    const radius = shape.getRadius();
                    ctx.beginPath();
                    ctx.arc(
                        position.x,
                        position.y,
                        radius,
                        0 + angle,
                        2 * Math.PI + angle
                    );
                    ctx.lineTo(position.x, position.y);
                    ctx.fill();
                    ctx.stroke();
                } else if (shapeType === "polygon") {
                    const vertices = shape.m_vertices;
                    ctx.beginPath();
                    for (let i = 0; i < vertices.length; i++) {
                        const vertex = vertices[i];
                        const transformedVertex = this.rotateAndTranslate(
                            vertex,
                            position,
                            angle
                        );
                        if (i === 0) {
                            ctx.moveTo(
                                transformedVertex.x,
                                transformedVertex.y
                            );
                        } else {
                            ctx.lineTo(
                                transformedVertex.x,
                                transformedVertex.y
                            );
                        }
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                } else if (shapeType === "edge") {
                    const v1 = shape.m_vertex1;
                    const v2 = shape.m_vertex2;
                    const transformedV1 = this.rotateAndTranslate(
                        v1,
                        position,
                        angle
                    );
                    const transformedV2 = this.rotateAndTranslate(
                        v2,
                        position,
                        angle
                    );
                    ctx.beginPath();
                    ctx.moveTo(transformedV1.x, transformedV1.y);
                    ctx.lineTo(transformedV2.x, transformedV2.y);
                    ctx.stroke();
                } else if (shapeType === "chain") {
                    const vertices = shape.m_vertices;
                    ctx.beginPath();
                    for (let i = 0; i < vertices.length; i++) {
                        const vertex = vertices[i];
                        if (i === 0) {
                            ctx.moveTo(vertex.x, vertex.y);
                        } else {
                            ctx.lineTo(vertex.x, vertex.y);
                        }
                    }
                    ctx.stroke();
                }
            }
        }

        // Draw joints
        /*
        for (let joint = world.getJointList(); joint; joint = joint.getNext()) {
            const bodyA = joint.getBodyA();
            const bodyB = joint.getBodyB();
            const anchorA = joint.getAnchorA();
            const anchorB = joint.getAnchorB();

            ctx.beginPath();
            ctx.moveTo(anchorA.x, anchorA.y);
            ctx.lineTo(anchorB.x, anchorB.y);
            ctx.strokeStyle = "blue";
            ctx.stroke();
        }
        */

        ctx.restore();
    },
    rotateAndTranslate: function (vertex, position, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: position.x + vertex.x * cos - vertex.y * sin,
            y: position.y + vertex.x * sin + vertex.y * cos,
        };
    },

    // Temporary
    grabbed: undefined,

    // Distance between points
    dist: function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    update: function () {

        // Design levels
        if (this.grabbed) {
            var proto = this.grabbed;
            proto[0].points[proto[1]] = mouse.x;
            proto[0].points[proto[1] + 1] = mouse.y;
            if (!mouse.buttonPressed) {
                this.grabbed = undefined;
            }
        }

        // Move camera
        this.x -= (this.x - this.stickman.getPosition().x * scale) / 5;
        this.y -= (this.y - this.stickman.getPosition().y * scale) / 5;

        this.renderWorld(world, ctx);
    },
};

class BaseCar {
    constructor(world, options = {}) {
        this.world = world;
        this.isUsing = options.isUsing ?? true;
        this.scale = options.scale ?? scale;
        this.actions = this.createActions();

        this.speed = options.speed ?? 400;
        this.torque = options.torque ?? 50;
        this.hz = options.hz ?? 4;
        this.zeta = options.zeta ?? 1;

        // Store references to bodies and joints
        this.bodies = {};
        this.joints = {};

        // Flipping mechanism when car is upside down
        this.flipState = {
            upsideDownTime: 0,
            flipping: false,
            frame: 0,
            direction: 1
        };
        this.flipConfig = {
            threshold: 1.5,
            frames: 40,
            torque: 10
        };

        this.initCar();
        grabableBodies.push({
            body: this.bodies.car,
            isWeapon: false
        });
        this.setupControls();
    }

    initCar() {

        // Car body
        this.bodies.car = this.world.createDynamicBody({
            position: planck.Vec2(0, 7),
        });
        this.bodies.car.createFixture({
            shape: planck.Box(2, 0.5),
            density: 1,
            restitution: 0.5,
            friction: 0.2,
        });

        // Wheels
        this.bodies.rearWheel = this.world.createDynamicBody(planck.Vec2(-2.2, 5.5));
        this.bodies.rearWheel.createFixture({
            shape: planck.Circle(0.5),
            density: 2,
            restitution: 0.2,
            friction: 0.9,
        });
        this.bodies.frontWheel = this.world.createDynamicBody(planck.Vec2(2.2, 5.5));
        this.bodies.frontWheel.createFixture({
            shape: planck.Circle(0.5),
            density: 2,
            restitution: 0.2,
            friction: 0.9,
        });

        // Suspension
        this.joints.rearSpring = this.world.createJoint(
            planck.WheelJoint(
                {
                    motorSpeed: 0.0,
                    maxMotorTorque: this.torque,
                    enableMotor: false,
                    frequencyHz: this.hz,
                    dampingRatio: this.zeta,
                },
                this.bodies.car,
                this.bodies.rearWheel,
                this.bodies.rearWheel.getPosition(),
                planck.Vec2(0.0, 1.0)
            )
        );
        this.joints.frontSpring = this.world.createJoint(
            planck.WheelJoint(
                {
                    motorSpeed: 0.0,
                    maxMotorTorque: this.torque,
                    enableMotor: false,
                    frequencyHz: this.hz,
                    dampingRatio: this.zeta,
                },
                this.bodies.car,
                this.bodies.frontWheel,
                this.bodies.frontWheel.getPosition(),
                planck.Vec2(0.0, 1.0)
            )
        );
    }

    createActions() {
        // Organized actions for easy extension
        return {
            driveRight: () => this.drive(-this.speed, 1),
            driveLeft: () => this.drive(this.speed, -1),
            jump: () => this.bodies.car.applyLinearImpulse(planck.Vec2(0.0, 100.0), this.bodies.car.getWorldCenter(), true),
            reset: () => this.reset(),
            // Extendable: add more actions here
        };
    }

    drive(motorSpeed, angularDelta) {
        this.joints.rearSpring.m_enableMotor = true;
        this.joints.frontSpring.m_enableMotor = true;
        this.joints.rearSpring.m_motorSpeed = motorSpeed;
        this.joints.frontSpring.m_motorSpeed = motorSpeed;
        this.bodies.car.setAngularVelocity(
            Math.max(Math.min(this.bodies.car.m_angularVelocity + angularDelta, 4), -4)
        );
    }

    reset() {
        // Re-initialize car
        this.initCar();
        this.flipState = {
            upsideDownTime: 0,
            flipping: false,
            frame: 0,
            direction: 1
        };
    }

    setupControls() {
        // Key mapping to actions
        this.keyMap = {
            ArrowLeft: "left",
            // a: "left",
            ArrowRight: "right",
            // d: "right",
        };

        this.keyState = {
            left: false,
            right: false,
        };

        // Handle keydown
        document.addEventListener("keydown", (ev) => {
            const action = this.keyMap[ev.key];
            if (!action) return;
            this.keyState[action] = true;

            if (action === "left") this.actions.driveLeft();
            if (action === "right") this.actions.driveRight();

        });

        // Handle keyup
        document.addEventListener("keyup", (ev) => {
            const action = this.keyMap[ev.key];
            if (!action) return;
            this.keyState[action] = false;

            // Stop driving
            if (action === "left" || action === "right") {
                this.joints.rearSpring.m_enableMotor = false;
                this.joints.frontSpring.m_enableMotor = false;
                this.bodies.car.setAngularVelocity(0);
            }
        });

    }

    update() {
        // Check if car is upside down
        const angle = this.bodies.car.getAngle();
        // Normalize angle to [-PI, PI]
        const normAngle = ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
        // Consider upside down if angle is near PI or -PI (within 45 degrees)
        if (!this.flipState.flipping && Math.abs(Math.abs(normAngle) - Math.PI) < Math.PI / 4) {
            this.flipState.upsideDownTime += 1 / 60; // assuming 60 FPS
            if (this.flipState.upsideDownTime > this.flipConfig.threshold) {
                this.flipState.flipping = true;
                this.flipState.frame = 0;
                this.flipState.direction = normAngle > 0 ? -1 : 1;
            }
        } else if (!this.flipState.flipping) {
            this.flipState.upsideDownTime = 0;
        }

        // Smooth flipping animation
        if (this.flipState.flipping) {
            console.log(true);
            // Apply a small torque each frame to rotate upright
            this.bodies.car.applyAngularImpulse(this.flipConfig.torque * this.flipState.direction, true);
            // Optionally, apply a small upward force to help
            this.bodies.car.applyForceToCenter(planck.Vec2(0, this.flipConfig.torque * 4), true);

            this.flipState.frame++;
            // Stop flipping after enough frames or if car is upright
            const newAngle = this.bodies.car.getAngle();
            const newNormAngle = ((newAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
            if (
                this.flipState.frame >= this.flipConfig.frames ||
                Math.abs(newNormAngle) < Math.PI / 6 // upright enough
            ) {
                this.flipState.flipping = false;
                this.flipState.upsideDownTime = 0;
            }
        }

    }

    display(ctx) {
        // Extendable: custom drawing logic here
    }
}

class Stickman {
    constructor(world, options = {}) {

        this.world = world;
        this.scale = options.scale ?? scale;
        this.isUsing = options.isUsing ?? true;

        this.walkSpeed = 0; // Dynamically set based on canJump
        this.walking = false;
        this.walkTorque = options.walkTorque ?? 7;

        this.canJump = 10;
        this.jumpTimer = 100;
        this.standingPower = options.standingPower = 20;

        this.bodies = {};
        this.joints = {};
        this.initStickman();
        this.setupControls();
        this.lastGroundNormal = planck.Vec2(0, 1); // Default to up
        this.grabJoints = []; // Store the grab joint if any
    }

    initStickman() {
        // Remove previous stickman if any
        if (this.bodies.body) {
            Object.values(this.bodies).forEach(b => this.world.destroyBody(b));
        }
        Object.values(this.joints).forEach(j => this.world.destroyJoint(j));
        this.bodies = {};
        this.joints = {};

        // Group index for self-collision disable
        const stickmanGroup = -Math.floor(Math.random() * 1000000) - 1;

        // All dimensions and positions
        const dims = {
            body: { len: 1.6, w: 0.1, x: 0, y: 8.5 + 1.6 / 2 },
            head: { r: 0.35, x: 0, y: 8.5 + 1.6 + 0.28 + 0.05 },
            upperArm: { len: 0.7, w: 0.1, y: 8.5 + 1.6 - 0.2 },
            foreArm: { len: 0.7, w: 0.1 },
            thigh: { len: 0.8, w: 0.1, y: 8.5 - 0.8 / 2 },
            calf: { len: 0.8, w: 0.1 },
            legSpacing: 0.1 // spacing between left/right legs
        };

        // Helper to create a box body
        const createBox = (name, x, y, hx, hy, angle = 0, density = 1, friction = 0.5) => {
            const body = this.world.createDynamicBody({
                position: planck.Vec2(x, y),
                angle,
                fixedRotation: false
            });
            body.createFixture(planck.Box(hx, hy), {
                density,
                friction: friction,
                filterGroupIndex: stickmanGroup // disables collision with other stickman parts
            });
            this.bodies[name] = body;
        };

        // Helper to create a circle body
        const createCircle = (name, x, y, r, density = 1, friction = 0.5) => {
            const body = this.world.createDynamicBody({
                position: planck.Vec2(x, y),
                fixedRotation: false
            });
            body.createFixture(planck.Circle(r), {
                density,
                friction: friction,
                filterGroupIndex: stickmanGroup // disables collision with other stickman parts
            });
            this.bodies[name] = body;
        };

        // Helper to create a revolute joint
        const createRevolute = (name, a, b, anchor, opts = {}) => {
            // Only add enableLimit/lowerAngle/upperAngle if any limit is specified in opts
            const hasLimit = "lowerAngle" in opts || "upperAngle" in opts || "enableLimit" in opts;
            const jointOpts = {
                collideConnected: false,
                ...opts
            };
            if (hasLimit) {
                jointOpts.enableLimit = opts.enableLimit ?? true;
                jointOpts.lowerAngle = opts.lowerAngle ?? -Math.PI / 2;
                jointOpts.upperAngle = opts.upperAngle ?? Math.PI / 2;
            }
            this.joints[name] = this.world.createJoint(
                planck.RevoluteJoint(jointOpts, a, b, anchor)
            );
        };

        // --- Create bodies ---
        createBox("body", dims.body.x, dims.body.y, dims.body.w / 2, dims.body.len / 2, 0, 1);
        createCircle("head", dims.head.x, dims.head.y, dims.head.r, 0.1);

        // Arms
        createBox("leftUpperArm",
            -dims.body.w / 2 - dims.upperArm.len / 2,
            dims.upperArm.y,
            dims.upperArm.len / 2, dims.upperArm.w / 2, Math.PI, 0.7
        );
        createBox("rightUpperArm",
            dims.body.w / 2 + dims.upperArm.len / 2,
            dims.upperArm.y,
            dims.upperArm.len / 2, dims.upperArm.w / 2, Math.PI, 0.7
        );
        createBox("leftForeArm",
            -dims.body.w / 2 - dims.upperArm.len - dims.foreArm.len / 2,
            dims.upperArm.y,
            dims.foreArm.len / 2, dims.foreArm.w / 2, Math.PI, 0.6
        );
        createBox("rightForeArm",
            dims.body.w / 2 + dims.upperArm.len + dims.foreArm.len / 2,
            dims.upperArm.y,
            dims.foreArm.len / 2, dims.foreArm.w / 2, Math.PI, 0.6
        );

        // Legs (slightly spaced apart)
        createBox("leftThigh",
            -dims.legSpacing / 2,
            dims.thigh.y,
            dims.thigh.len / 2, dims.thigh.w / 2, Math.PI / 2, 1
        );
        createBox("rightThigh",
            dims.legSpacing / 2,
            dims.thigh.y,
            dims.thigh.len / 2, dims.thigh.w / 2, Math.PI / 2, 1
        );
        createBox("leftCalf",
            -dims.legSpacing / 2,
            dims.thigh.y - dims.thigh.len / 2 - dims.calf.len / 2,
            dims.calf.len / 2, dims.calf.w / 2, Math.PI / 2, 1, 0.2
        );
        createBox("rightCalf",
            dims.legSpacing / 2,
            dims.thigh.y - dims.thigh.len / 2 - dims.calf.len / 2,
            dims.calf.len / 2, dims.calf.w / 2, Math.PI / 2, 1, 0.2
        );

        // --- Create joints ---
        // Neck
        createRevolute("neck",
            this.bodies.body, this.bodies.head,
            planck.Vec2(dims.body.x, dims.body.y + dims.body.len / 2 + 0.01),
            { lowerAngle: -Math.PI / 4, upperAngle: Math.PI / 4 }
        );

        // Shoulders
        createRevolute("leftShoulder",
            this.bodies.body, this.bodies.leftUpperArm,
            planck.Vec2(dims.body.x - dims.body.w / 2, dims.body.y + dims.body.len / 2 - 0.2)
        );
        createRevolute("rightShoulder",
            this.bodies.body, this.bodies.rightUpperArm,
            planck.Vec2(dims.body.x + dims.body.w / 2, dims.body.y + dims.body.len / 2 - 0.2)
        );

        // Elbows
        createRevolute("leftElbow",
            this.bodies.leftUpperArm, this.bodies.leftForeArm,
            planck.Vec2(dims.body.x - dims.body.w / 2 - dims.upperArm.len, dims.upperArm.y)
        );
        createRevolute("rightElbow",
            this.bodies.rightUpperArm, this.bodies.rightForeArm,
            planck.Vec2(dims.body.x + dims.body.w / 2 + dims.upperArm.len, dims.upperArm.y)
        );

        // Hips (spaced)
        createRevolute("leftHip",
            this.bodies.body, this.bodies.leftThigh,
            planck.Vec2(dims.body.x - dims.legSpacing / 2, dims.body.y - dims.body.len / 2)
        );
        createRevolute("rightHip",
            this.bodies.body, this.bodies.rightThigh,
            planck.Vec2(dims.body.x + dims.legSpacing / 2, dims.body.y - dims.body.len / 2)
        );

        // Knees
        createRevolute("leftKnee",
            this.bodies.leftThigh, this.bodies.leftCalf,
            planck.Vec2(dims.body.x - dims.legSpacing / 2, dims.thigh.y - dims.thigh.len / 2)
        );
        createRevolute("rightKnee",
            this.bodies.rightThigh, this.bodies.rightCalf,
            planck.Vec2(dims.body.x + dims.legSpacing / 2, dims.thigh.y - dims.thigh.len / 2)
        );

        // For camera tracking
        game.stickman = this.bodies.body;
    }

    update() {

        // --- Physics: check ground contact and average normal ---
        let normalSum = planck.Vec2(0, 0);
        let normalCount = 0;
        for (const body of Object.values(this.bodies)) {
            for (let ce = body.getContactList(); ce; ce = ce.next) {
                const c = ce.contact;
                if (c.isTouching()) {
                    const a = c.getFixtureA(), b = c.getFixtureB();
                    this.canJump = true;
                    // Get world normal direction
                    let worldManifold = c.getWorldManifold(null);
                    let normal = worldManifold.normal;
                    let n = planck.Vec2(normal.x, normal.y);
                    // If the stickman is body B, flip the normal
                    if (b.getBody() === body) {
                        n = planck.Vec2(-normal.x, -normal.y);
                    }
                    normalSum.x += n.x;
                    normalSum.y += n.y;
                    normalCount++;
                }
            }
        }
        if (normalCount > 0) {
            // Average the normals
            let len = Math.sqrt(normalSum.x * normalSum.x + normalSum.y * normalSum.y);
            if (len > 0) {
                this.lastGroundNormal = planck.Vec2(normalSum.x / len, normalSum.y / len);
            } else {
                this.lastGroundNormal = planck.Vec2(0, 1);
            }
        }

        // --- Upright PD for torso ---
        const torsoAngle = this.bodies.body.getAngle();
        const torsoAngularVel = this.bodies.body.getAngularVelocity();
        const torsoTarget = 0;
        const torsoKp = this.standingPower, torsoKd = 5; // reduced gains
        const torsoTorque = torsoKp * (torsoTarget - torsoAngle) - torsoKd * torsoAngularVel;
        this.bodies.body.applyTorque(torsoTorque, true);

        // --- Helper: shortest angle difference in [-PI, PI] ---
        function shortestAngleDiff(a, b) {
            let diff = a - b;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            return diff;
        }

        const anim = this.walking ? Math.cos(frameCount / 5) * 0.4 : 0.2;

        // --- Upright PD for hips ---
        for (const side of ["left", "right"]) {
            const hipJoint = this.joints[side + "Hip"];
            const hipAngle = hipJoint.getJointAngle();
            const sign = side === "left" ? -anim : anim;
            this.bodies[side + "Thigh"].applyTorque(shortestAngleDiff(sign, hipAngle) * this.standingPower, true);
            const hipAngularVel = this.bodies[side + "Thigh"].getAngularVelocity();
            this.bodies[side + "Thigh"].applyTorque(-hipAngularVel / 10, true);

        }

        // --- Upright PD for Knees ---
        for (const side of ["left", "right"]) {
            const kneeJoint = this.joints[side + "Knee"];
            const kneeAngle = kneeJoint.getJointAngle();
            const sign = this.walking ? 0 : (side === "left" ? 0.2 : -0.2);
            this.bodies[side + "Calf"].applyTorque(shortestAngleDiff(sign, kneeAngle) * this.standingPower, true);
            const hipAngularVel = this.bodies[side + "Calf"].getAngularVelocity();
            this.bodies[side + "Calf"].applyTorque(-hipAngularVel / 10, true);
        }

        // --- Left/Right movement ---
        if (this.standingPower) {
            this.walkSpeed = this.canJump ? 20 : 20;
            const velocity = this.bodies.body.getLinearVelocity();
            if (this.keyState.left) {
                // Only apply force if moving slower than maxWalkSpeed to the left
                if (velocity.x > -this.walkSpeed) {
                    this.bodies.body.applyForceToCenter(planck.Vec2(-this.walkTorque / 2, 0), true);
                    this.bodies.leftThigh.applyForceToCenter(planck.Vec2(-this.walkTorque, 0), true);
                    this.bodies.rightThigh.applyForceToCenter(planck.Vec2(-this.walkTorque, 0), true);
                }
            }
            if (this.keyState.right) {
                // Only apply force if moving slower than maxWalkSpeed to the right
                if (velocity.x < this.walkSpeed) {
                    this.bodies.body.applyForceToCenter(planck.Vec2(this.walkTorque / 2, 0), true);
                    this.bodies.leftThigh.applyForceToCenter(planck.Vec2(this.walkTorque, 0), true);
                    this.bodies.rightThigh.applyForceToCenter(planck.Vec2(this.walkTorque, 0), true);
                }
            }
            this.walking = (this.keyState.left || this.keyState.right) && this.canJump;
        }

        // --- Jump logic ---
        if (!this.canJump) this.jumpTimer = 0;
        this.jumpTimer--;
        if (this.keyState.jump && this.canJump && this.jumpTimer <= 0) {
            // Use lastGroundNormal for jump direction
            const n = this.lastGroundNormal;
            
            // Here is an example of what not to do:
            const jumpStrength = -25;

            // this.bodies.body.applyLinearImpulse(planck.Vec2(n.x * jumpStrength, n.y * jumpStrength + 10), this.bodies.body.getWorldCenter(), true);
            this.bodies.body.setLinearVelocity(planck.Vec2(n.x * jumpStrength, n.y * jumpStrength + 50));
            
            this.jumpTimer = 5;
            this.canJump = false;
            console.log(n.x * jumpStrength, n.y * jumpStrength);
        }

        // --- Grab logic ---
        if (this.keyState.pick) {
            // If not already grabbing something
            if (!this.grabJoint) {
                // Find closest grabable body within range
                const myPos = this.bodies.body.getPosition();
                let minDist = 4.0; // grab range
                let closest = null;
                for (const body of grabableBodies) {
                    if (body.body === this.bodies.body) continue;
                    const pos = body.body.getPosition();
                    const dist = Math.hypot(pos.x - myPos.x, pos.y - myPos.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = body;
                    }
                }
                if (closest) {
                    const armPos = this.bodies.rightForeArm.getPosition();
                    const dir = planck.Vec2(closest.body.getPosition().x - armPos.x, closest.body.getPosition().y - armPos.y);
                    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
                    // Grab with the end of the right forearm
                    const grabPoint = planck.Vec2(
                        armPos.x + dir.x / len * 0.5,
                        armPos.y + dir.y / len * 0.5
                    );
                    this.grabJoints.push(this.world.createJoint(
                        planck.DistanceJoint(
                            {
                                collideConnected: false,
                                frequencyHz: 10,
                                dampingRatio: 0.9,
                                length: 0.5
                            },
                            this.bodies.rightForeArm,
                            closest.body,
                            grabPoint,
                            closest.body.getPosition()
                        )
                    ));
                    if (!closest.isWeapon) {
                        this.standingPower = 0;
                    }
                }
            }
        } else {
            // Release grab if joints exist
            if (this.grabJoints.length > 0) {
                for (const joint of this.grabJoints) {
                    this.world.destroyJoint(joint);
                }
                this.grabJoints = [];
                this.standingPower = 20;
            }
        }

    }

    setupControls() {
        // Key mapping to actions
        this.keyMap = {
            a: "left",
            d: "right",
            ArrowUp: "pick",
            w: "jump",
            s: "standPowerOff"
        };

        this.keyState = {
            left: false,
            right: false,
            jump: false
        };

        // Handle keydown
        document.addEventListener("keydown", (ev) => {
            const action = this.keyMap[ev.key];
            if (!action) return;
            this.keyState[action] = true;
            if (action === "standPowerOff") {
                this.standingPower = 0;
            }
        });

        // Handle keyup
        document.addEventListener("keyup", (ev) => {
            const action = this.keyMap[ev.key];
            if (!action) return;
            this.keyState[action] = false;
            if (action === "standPowerOff") {
                this.standingPower = 30;
            }
        });

        // Zoom
        document.addEventListener("wheel", (ev) => {
            game.setScale(Math.min(Math.max(scale + ev.wheelDeltaY / 100, 4), 50));
        });
    }

    display(ctx) {
        // Extendable: custom drawing logic here
    }
}

const car = new BaseCar(world);
const stickman = new Stickman(world);

// Ground
world.createBody().createFixture({
    shape: planck.Edge(planck.Vec2(-50, -10), planck.Vec2(50, -10)),
    friction: 0.5,
});

document.addEventListener("keydown", function (ev) {

    ev.preventDefault();
    if (ev.key === "Enter") {
        curveProto.apply();
    }
    if (ev.key === "Shift") {
        bezierProto.apply();
    }

});

// var pendingRemove;
// world.on("post-solve", function (contact, impulse) {
//     const impact = impulse.normalImpulses[0];
//     if (impact > 100) {
//         const fixtureA = contact.getFixtureA();
//         const fixtureB = contact.getFixtureB();
//         if (
//             fixtureA.getBody().isDynamic() &&
//             fixtureA.m_shape.m_type === "circle"
//         ) {
//             pendingRemove = fixtureA.getBody();
//         }
//         if (
//             fixtureB.getBody().isDynamic() &&
//             fixtureB.m_shape.m_type === "circle"
//         ) {
//             pendingRemove = fixtureB.getBody();
//         }
//     }
// });
// world.on("post-step", function () {
//     if (pendingRemove) {
//         let joint = pendingRemove.getJointList();
//         while (joint) {
//             const nextJoint = joint.next;
//             world.destroyJoint(joint.joint);
//             joint = nextJoint;
//         }
//         // World.destroyBody(pendingRemove[0]);
//         pendingRemove = undefined;
//     }
// });

// Update and render loop
var timeStep = 1 / 60,
    velocityIterations = 8,
    positionIterations = 3,
    frameCount = 0;
function update() {

    // Update planck
    world.step(1 / 60, velocityIterations, positionIterations);
    frameCount++;

    game.update();
    curveProto.update();
    bezierProto.update();

    stickman.update();
    car.update();

    // Next frame
    requestAnimationFrame(update);
}