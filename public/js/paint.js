let socket, canvas, ctx,
    brush = {
        x: 0,
        y: 0,
        color: '#000000',
        size: 10,
        down: false,
    },
    strokes = [],
    currentStroke = null;

function paint () {
    ctx.clearRect(0, 0, canvas.width(), canvas.height());
    ctx.lineCap = 'round';
    for (var i = 0; i < strokes.length; i++) {
        var s = strokes[i];
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size;
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (var j = 0; j < s.points.length; j++) {
            var p = s.points[j];
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }
}


function init () {

    canvas = $('#paint');
    canvas.attr({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    ctx = canvas[0].getContext('2d');

    socket = io.connect(window.location.hostname + ":3000");

    socket.on('painter', (data) => {
        brush.x = data.x;
        brush.y = data.y;
        newPaints(brush)
    });

    socket.on("newBrush", (newBrush) => {
        takeNewBrush(newBrush)
    });

    socket.on("takeOffBrush", (endBrush) => {
        takeOffBrush(endBrush)
    });

    function takeNewBrush(newBrush) {
        brush.down = true;

        currentStroke = {
            color: newBrush.color,
            size: newBrush.size,
            points: [],
        };
        strokes.push(currentStroke);
    }

    function takeOffBrush(e, updateToSocket) {
        brush.down = false;
        mouseEvent(e);
        currentStroke = null;
        if (updateToSocket){
            socket.emit('mouseUp', {x: e.pageX, y :e.pageY});
        }


    }
    function newPaints(newBrush, updateToSocket) {
        if (currentStroke)
            currentStroke.points.push({
                x: newBrush.x,
                y: newBrush.y,
            });

        let data = {
            x: newBrush.x,
            y: newBrush.y
        };
        if (updateToSocket){
            socket.emit('mouse', data);
        }

        paint();
    }


    function mouseEvent (e) {
        brush.x = e.pageX;
        brush.y = e.pageY;
        newPaints(brush, true)

    }
    canvas.bind("touchstart" , function (e) {

        takeNewBrush(brush);
        var newBrush = {color: brush.color, size: brush.size, ee:"touched"};

        socket.emit('mouseDown', newBrush);
        strokes.push(currentStroke);

        mouseEvent(e.originalEvent.touches[0]);


        // strokes.push(currentStroke);

    });

    canvas.bind('touchmove', function(e) {
        // alert(e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY);
        // if(!brush.down) {
        //     takeNewBrush(brush);
        //     var newBrush = {color: brush.color, size: brush.size};
        //     strokes.push(currentStroke);
        //     mouseEvent(e.originalEvent.touches[0]);
        // }
        mouseEvent(e.originalEvent.touches[0]);
        e.preventDefault();
        // socket.emit('mouseDown', newBrush);

    });


    canvas.mousedown(function (e) {
        takeNewBrush(brush);
        var newBrush = {color: brush.color, size: brush.size};

        socket.emit('mouseDown', newBrush);

        strokes.push(currentStroke);

        mouseEvent(e);
    }).mouseup(function (e) {
        takeOffBrush(e, true)

    }).mousemove(function (e) {
        if (brush.down && !e.originalEvent.touches)
            mouseEvent(e);
    });

    $('#save-btn').click(function () {
        window.open(canvas[0].toDataURL());
    });

    $('#undo-btn').click(function () {
        strokes.pop();
        paint();
    });

    $('#clear-btn').click(function () {
        strokes = [];
        paint();
    });

    $('#color-picker').on('input', function () {
        brush.color = this.value;
    });

    $('#brush-size').on('input', function () {
        brush.size = this.value;
    });

    document.bind('touchmove mousemove' , function(e) {

        e.preventDefault();

    });

    // $(window).bind('touchmove mousemove', function(jQueryEvent) {
    //     jQueryEvent.preventDefault();
    //
    // });

}

$(init);