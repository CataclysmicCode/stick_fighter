var mouse = {
    x: 0,
    y: 0,
    gameX: 0,
    gameY: 0,

    px: 0,
    py: 0,
    pgameX: 0,
    pgameY: 0,

    insideCanvas: false,
    buttonPressed: false,
    dragging: false,

    init: function () {
        canvas.addEventListener("mousemove", mouse.mousemovehandler, false);
        canvas.addEventListener("mouseenter", mouse.mouseenterhandler, false);
        canvas.addEventListener("mouseout", mouse.mouseouthandler, false);
        canvas.addEventListener("mousedown", mouse.mousedownhandler, false);
        canvas.addEventListener("mouseup", mouse.mouseuphandler, false);
        canvas.addEventListener(
            "contextmenu",
            mouse.mouserightclickhandler,
            false
        );

        mouse.canvas = canvas;
    },

    setCoordinates: function (clientX, clientY) {
        let offset = mouse.canvas.getBoundingClientRect();

        mouse.px = mouse.x;
        mouse.py = mouse.y;
        mouse.pgameX = mouse.gameX;
        mouse.pgameY = mouse.gameY;

        mouse.x = clientX - offset.left;
        mouse.y = clientY - offset.top;
        game.toGameX(mouse.x);
        game.toGameY(mouse.y);
    },

    mousemovehandler: function (ev) {
        mouse.insideCanvas = true;
        mouse.setCoordinates(ev.clientX, ev.clientY);

        //dragging
        mouse.dragging = mouse.buttonPressed;
    },

    mouseenterhandler: function () {
        mouse.insideCanvas = true;
    },

    mouseouthandler: function () {
        mouse.insideCanvas = false;
        mouse.dragging = false;
    },

    mousedownhandler: function (ev) {
        mouse.insideCanvas = true;
        mouse.setCoordinates(ev.clientX, ev.clientY);

        if (ev.button === 0) {
            mouse.buttonPressed = true;
        }
    },

    mouseuphandler: function (ev) {
        mouse.setCoordinates(ev.clientX, ev.clientY);

        if (ev.button === 0) {
            mouse.buttonPressed = false;
            mouse.dragging = false;
        }
    },

    mouserightclickhandler: function (ev) {
        ev.preventDefault(true);
    },
};
mouse.init();
