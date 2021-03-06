/**************** FINDING FUNCTIONS ****************/

// Find rear wheel centre using wheelbase and the view centre point
function findRearWheel(b) {
    return new Point(view.center + new Point(0 - b.wheelbase / 2, 0));
}

// Find front wheel centre using wheelbase and the view centre point
function findFrontWheel(b) {
    return new Point(view.center + new Point(b.wheelbase / 2, 0));
}

// Use Pythagoras' Theorem to find the bottom bracket 
// the square root of (chainstay^2 + bb_drop^2) gives the x offset from the rear wheel
// bb_drop gives us the y offset from the rear wheel
function findBottomBracket(b) {
    return b.rear_wheel + new Point(Math.sqrt(Math.pow(b.chainstay, 2) + Math.pow(b.bb_drop, 2)), b.bb_drop);
}

// Find bottom of steering axis by using fork rake to find distance from front wheel along wheelbase
// fork_rake / sin head_angle gives us the x offset from the front wheel
// there is no y offset from the front wheel
// the angle in degrees is converted to radians
function findSteeringAxisBottom(b) {
    return new Point(b.front_wheel - new Point(b.fork_rake / Math.sin(b.head_angle * Math.PI / 180), 0));
}

// Find top of steering axis by using the reach and stack with existing coordinates
function findSteeringAxisTop(b) {
    return new Point(b.bottom_bracket.x + b.reach, b.steering_axis_bottom.y - (b.stack - b.bb_drop));
}

// Find coordinate for bottom of head tube 
function findHeadTubeBottom(b) {
    // y offset from top of head tube 
    // sin head_angle * head_tube
    // head_angle is converted from degrees into radians
    var y_offset = Math.sin(b.head_angle * Math.PI / 180) * b.head_tube;

    // x offset from top of head tube
    // square root of (head_tube^2 - y_offset^2)
    var x_offset = Math.sqrt(Math.pow(b.head_tube, 2) - Math.pow(y_offset, 2));

    return b.steering_axis_top + new Point(x_offset, y_offset);
}

// Find coordinates for top of seat tube
function findSeatTubeTop(b) {
    // y offset from bottom bracket sin seat_angle * seat_tube_length
    // seat_angle is converted from degrees into radians
    var y_offset = Math.sin(b.seat_angle * Math.PI / 180) * b.seat_tube_length;

    // x offset from bottom bracket
    // square root of (seat_tube_length^2 - y_offset^2)
    var x_offset = Math.sqrt(Math.pow(b.seat_tube_length, 2) - Math.pow(y_offset, 2));

    return b.bottom_bracket - new Point(x_offset, y_offset);
}

// Find coordinates for top of seat post
function findSeatPostTop(b) {
    // y offset from top of seat tube
    // sin seat_angle * 140 (this is currently a fixed length seat post)
    // seat_angle is converted from degrees into radians
    var y_offset = Math.sin(b.seat_angle * Math.PI / 180) * 140;

    // x offset from top of seat tube 
    // square root of (140^2 - y_offset^2)
    var x_offset = Math.sqrt(Math.pow(140, 2) - Math.pow(y_offset, 2));

    return b.seat_tube_top - new Point(x_offset, y_offset);
}

// Find coordinates for top of handlebar post
function findHandlebarPostTop(b) {
    // y offset from top of steering axis
    // sin head_angle * 100 (this is currently a fixed length handlebar post)
    // seat_angle is converted from degrees into radians
    var y_offset = Math.sin(b.head_angle * Math.PI / 180) * 100;

    // x offset from top of steering axis 
    // square root of (100^2 - y_offset^2)
    var x_offset = Math.sqrt(Math.pow(100, 2) - Math.pow(y_offset, 2));

    return b.steering_axis_top - new Point(x_offset, y_offset);
}

/**************** DRAWING FUNCTIONS ****************/

function drawGridLines() {
    var gridLines = new Group();

    for (var i = 0.025; i < 1; i += 0.025) {
        // Draw vertical line
        gridLines.addChild(new Path.Line(
            new Point(view.bounds.width * i, 0), new Point(view.bounds.width * i, view.bounds.height)
        ));

        // Draw horizontal line
        gridLines.addChild(new Path.Line(
            new Point(0, view.bounds.height * i), new Point(view.bounds.width, view.bounds.height * i)
        ));
    }

    gridLines.strokeColor = window.globals.colours.gridline;

    gridLines.sendToBack();
}

function drawGuidelines(b) {
    var bike_guidelines = new Group();
    var bike_guidelines_labels = new Group();

    // Draw wheelbase guideline
    var pathWheelbase = new Path.Line(b.rear_wheel, b.front_wheel);
    bike_guidelines.addChild(pathWheelbase);

    // Draw bbdrop guideline
    var pathBBDrop = new Path();
    pathBBDrop.add(b.bottom_bracket.x + 100, view.center.y);
    pathBBDrop.add(pathBBDrop.position + new Point(0, b.bb_drop));
    var textBBDrop = new PointText({
        point: pathBBDrop.bounds.center + new Point(25, 10),
        content: b.bb_drop,
        justification: 'left'
    });
    bike_guidelines_labels.addChild(textBBDrop);
    bike_guidelines.addChild(pathBBDrop);

    // Draw stack guideline
    var pathStack = new Path.Line(b.bottom_bracket, b.bottom_bracket - new Point(0, b.stack));
    var textStack = new PointText({
        point: pathStack.bounds.center + new Point(25, 0),
        content: b.stack,
        justification: 'left'
    });
    bike_guidelines_labels.addChild(textStack);
    bike_guidelines.addChild(pathStack);

    // Draw reach guideline
    var pathReach = new Path.Line(pathStack.position, new Point(b.steering_axis_top.x, pathStack.position.y));
    pathReach.translate(new Point(0, -100));
    var textReach = new PointText({
        point: pathReach.bounds.center + new Point(0, -25),
        content: Math.ceil(pathReach.length),
        justification: 'center'
    });
    bike_guidelines_labels.addChild(textReach);
    bike_guidelines.addChild(pathReach);

    // Draw steering axis
    var pathSteeringAxis = new Path.Line(b.steering_axis_bottom, b.steering_axis_top);
    bike_guidelines.addChild(pathSteeringAxis);

    // Draw wheel radius
    var pathWheelRadius = new Path.Line(b.rear_wheel, b.rear_wheel + new Point(0, b.wheel_size));
    var textWheelRadius = new PointText({
        point: pathWheelRadius.bounds.center + new Point(-25, 0),
        content: b.wheel_size,
        justification: 'right'
    });
    bike_guidelines_labels.addChild(textWheelRadius);
    bike_guidelines.addChild(pathWheelRadius);

    // Draw head tube guideline to the right of the head tube
    var pathHeadTubeGuideline = new Path.Line(b.steering_axis_top, b.head_tube_bottom);
    pathHeadTubeGuideline.translate(new Point(50, 0));
    var textHeadTubeLabel = new PointText({
        point: pathHeadTubeGuideline.bounds.center + new Point(25, 0),
        content: b.head_tube,
    });
    bike_guidelines_labels.addChild(textHeadTubeLabel);
    bike_guidelines.addChild(pathHeadTubeGuideline);

    bike_guidelines.children.forEach(function (part) {
        part.set(window.globals.bike_guideline_settings);
    });

    bike_guidelines_labels.children.forEach(function (part) {
        part.set(window.globals.bike_guideline_label_settings);
    });

    b.bike_group.addChild(bike_guidelines);
    b.bike_group.addChild(bike_guidelines_labels);
}

// Draw the bike parts once points have been calculated
function drawBike(b) {
    // For bike parts that are estimated due to lack of data
    var bike_parts_estimated = new Group();

    // For the bike wheels
    var bike_wheels = new Group();

    // For bike parts that we know the properties of
    var bike_parts = new Group();

    // Draw rear wheel
    var shapeRearWheel = new Shape.Circle(b.rear_wheel, b.wheel_size);
    bike_wheels.addChild(shapeRearWheel);

    // Draw front wheel
    var shapeFrontWheel = new Shape.Circle(b.front_wheel, b.wheel_size);
    bike_wheels.addChild(shapeFrontWheel);

    // Draw Head Tube
    var pathHeadTube = new Path.Line(b.steering_axis_top, b.head_tube_bottom);
    pathHeadTube.label = "Head tube";
    bike_parts.addChild(pathHeadTube);

    // Draw Down Tube. As this is estimated we move 80% up the head tube.
    var pathDownTube = new Path.Line(b.bottom_bracket, (pathHeadTube.getPointAt(pathHeadTube.length * 0.8)));
    bike_parts_estimated.addChild(pathDownTube);

    // Draw Seat Stay
    var pathSeatStay = new Path.Line(b.rear_wheel, b.seat_tube_top);
    bike_parts_estimated.addChild(pathSeatStay);

    // Draw Seat Post continuing from seat tube
    var pathSeatPost = new Path.Line(b.seat_tube_top, b.seat_post_top);
    bike_parts_estimated.addChild(pathSeatPost);

    // Draw handlebars from head tube
    var pathHandlebars = new Path.Line(b.steering_axis_top, b.handlebar_post_top);
    pathHandlebars.add(pathHandlebars.position + new Point(100, -25));
    pathHandlebars.smooth();
    bike_parts_estimated.addChild(pathHandlebars);

    // Draw chainstay
    var pathChainstay = new Path.Line(b.bottom_bracket, b.rear_wheel);
    pathChainstay.label = "Chainstay";
    bike_parts.addChild(pathChainstay);

    // Draw Seat Tube
    var pathSeatTube = new Path.Line(b.bottom_bracket, b.seat_tube_top);
    pathSeatTube.label = "Seat tube";
    bike_parts.addChild(pathSeatTube);

    // Draw Fork
    var pathFork = new Path.Line(b.head_tube_bottom, b.front_wheel);
    pathFork.label = "Fork";
    bike_parts.addChild(pathFork);

    //Draw Top Tube
    var pathTopTube = new Path.Line(b.seat_tube_top, b.steering_axis_top);
    pathTopTube.label = "Top tube";
    bike_parts.addChild(pathTopTube);

    // Draw bottom bracket
    var shapeBottomBracket = new Shape.Circle(b.bottom_bracket, 25);
    shapeBottomBracket.fillColor = window.globals.colours.component;
    shapeBottomBracket.label = "Bottom bracket";
    bike_parts.addChild(shapeBottomBracket);

    // Apply styling and interactivity to each bike part that we know the value of
    bike_parts.children.forEach(function (part) {
        part.set(window.globals.bike_part_settings);

        part.onMouseEnter = function () {
            window.globals.hover_label.content = part.label;
            part.strokeColor = window.globals.colours.hovered;
            part.bringToFront();
        };
        part.onMouseLeave = function () {
            window.globals.hover_label.content = "";
            part.strokeColor = window.globals.colours.component;
            part.bringToFront();
        }
    });

    bike_wheels.children.forEach(function (part) {
        part.set(window.globals.bike_wheel_settings);
    });

    bike_parts_estimated.children.forEach(function (part) {
        part.set(window.globals.bike_part_estimated_settings);
    });

    b.bike_group.addChild(bike_wheels);
    b.bike_group.addChild(bike_parts_estimated);
    b.bike_group.addChild(bike_parts);
}

/**************** CORE FUNCTIONS ****************/

function findBikeCoords(b) {
    b.rear_wheel = findRearWheel(b);

    b.front_wheel = findFrontWheel(b);

    b.bottom_bracket = findBottomBracket(b);

    b.steering_axis_bottom = findSteeringAxisBottom(b);

    b.steering_axis_top = findSteeringAxisTop(b);

    b.head_tube_bottom = findHeadTubeBottom(b);

    b.seat_tube_top = findSeatTubeTop(b);

    b.seat_post_top = findSeatPostTop(b);

    b.handlebar_post_top = findHandlebarPostTop(b);
}

function makeBike(b, index) {
    // Check we have the parameters available to draw the bike
    if (isDrawable(b)) {
        // Create group for each component of the bike drawing
        b.bike_group = new Group();

        findBikeCoords(b);

        // If this is the first bike in the array, we will draw its guidelines
        if (index === 0) {
            drawGuidelines(b);
        }

        drawBike(b);

        // Set bike pivot (centre point) to bottom bracket
        b.bike_group.pivot = b.bottom_bracket;
        b.bike_group.position = view.center;

        // Add the drawn bike's group of parts to collection of bikes
        return b.bike_group;
    }
}

function arrangeBikesForTesting(bikes) {
    var perRow = Math.round(bikes.children.length / 2);
    var separator = 2000;
    var loc = new Point(0, 0);

    for (var key in bikes.children) {
        var b = bikes.children[key];

        b.position = loc;
        loc.x = (loc.x + separator) % (perRow * separator);
        if (loc.x === 0) {
            loc.y = loc.y + separator;
        }
    }
}

window.globals.main = function (bikes_array) {
    project.clear();

    // All groups of bike parts are collected in here
    var allBikes = new Group();

    // Set up label for hovering on bike components
    window.globals.hover_label = new PointText(window.globals.hover_label_settings);
    window.globals.hover_label.point = view.bounds.bottomCenter - new Point(0, 10);

    drawGridLines();

    // Create, draw, and add bike parts to all bikes group
    bikes_array.forEach(function (b, i) {
        allBikes.addChild(makeBike(b, i));
    });

    // If testing, arrange bikes side by side
    if (window.globals.testing === true) {
        arrangeBikesForTesting(allBikes);
    } else {
        // Loop through every bike except the first hence why i is set to 1 and set them to gray
        for (var i = 1; i < allBikes.children.length; i++) {
            allBikes.children[i].strokeColor = window.globals.colours.component_inactive;
            allBikes.children[i].selected = false;
            allBikes.children[i].locked = true;
        }
    }

    // Resize the bikes to fit within the view
    allBikes.fitBounds(view.bounds);
    allBikes.scale(0.8);
    allBikes.bringToFront();
};

window.globals.main([
    window.globals.example_bikes.bicycle_1,
    window.globals.example_bikes.bicycle_2
]);

createInterface([
    window.globals.example_bikes.bicycle_1,
    window.globals.example_bikes.bicycle_2,
    window.globals.example_bikes.bicycle_2,
    window.globals.example_bikes.bicycle_2,
    window.globals.example_bikes.bicycle_2,
    window.globals.example_bikes.bicycle_2,
    window.globals.example_bikes.bicycle_2,
    window.globals.example_bikes.bicycle_2
]);
