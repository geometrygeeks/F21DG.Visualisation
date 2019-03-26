
var colours = {
    gridline: '#f9f1e0',
    guideline: '#be639c',
    component: '#00BE5B'
};

var multiple = {
    gridline: '#f9f1e0',
    guideline: '#646464',
    hovered: '#0093be',
    component: ['aqua', 'red','lime', 'fuschia', 'yellow', 'maroon', 'teal','blue', 'green']
};

var loaded = false;
var state = "";
var test_bicycle = {};

var bicycle = {
    wheelbase: 995,
    bb_drop: 70,
    chainstay: 410,
    stack: 543,
    reach: 390,
    fork_rake: 45,
    head_angle: 70,
    head_tube: 140,
    seat_tube_length: 520,
    seat_angle: 74,
    wheel_size: 340
};

var allBikes = new Group();

function drawGridLines() {
    for (var i = 0.1; i < 1; i += 0.1) {
        // Draw vertical line
        var pathVerticalGridLine = new Path.Line(
            new Point(view.bounds.width * i, 0), new Point(view.bounds.width * i, view.bounds.height)
        );
        pathVerticalGridLine.strokeColor = colours.gridline;

        // Draw horizontal line
        var pathHorizontalGridLine = new Path.Line(
            new Point(0, view.bounds.height * i), new Point(view.bounds.width, view.bounds.height * i)
        );
        pathHorizontalGridLine.strokeColor = colours.gridline;
    }
}

function makeBike(b) {
    // Check we have the parameters available to draw the bike
    if (isDrawable(b)) {

        // console.log("Can draw ",b);
    
        // Create group for each component of the bike drawing
        b.bike_group = new Group();

        findBikeCoords(b);
        drawGuidelines(b);
        drawBike(b);

        // Set bike pivot (centre point) to bottom bracket
        b.bike_group.pivot = b.bottom_bracket;
        b.bike_group.position = view.center;

        // Add bike group to the collection of bikes
        allBikes.addChild(b.bike_group);
    } else {
        console.log("Could not draw bike ", b);
    }
}

function findBikeCoords(b) {
    b.rear_wheel = findRearWheel(b);

    b.front_wheel = findFrontWheel(b);

    b.bottom_bracket = findBottomBracket(b);

    b.steering_axis_bottom = findSteeringAxisBottom(b);

    b.steering_axis_top = findSteeringAxisTop(b);

    b.head_tube_bottom = findHeadTubeBottom(b);

    b.seat_tube_top = findSeatTubeTop(b);
}

function drawGuidelines(b) {
    var bike_guidelines = new Group();

    // Draw wheelbase guideline
    var pathWheelbase = new Path.Line(b.rear_wheel, b.front_wheel);
    bike_guidelines.addChild(pathWheelbase);

    // Draw bbdrop guideline
    var pathBBDrop = new Path();
    pathBBDrop.add(b.bottom_bracket.x, view.center.y);
    pathBBDrop.add(pathBBDrop.position + new Point(0, b.bb_drop));
    bike_guidelines.addChild(pathBBDrop);

    // Draw stack guideline
    var pathStack = new Path.Line(b.bottom_bracket, b.bottom_bracket - new Point(0, b.stack));
    bike_guidelines.addChild(pathStack);

    // Draw steering axis
    var pathSteeringAxis = new Path.Line(b.steering_axis_bottom, b.steering_axis_top);
    bike_guidelines.addChild(pathSteeringAxis);

    bike_guidelines.children.forEach(function (part) {
        part.set({
            strokeCap: 'round',
            strokeWidth: 1,
            strokeColor: colours.guideline
        });
    });

    b.bike_group.addChild(bike_guidelines);
}

// Drawing the bike parts once points have been calculated
function drawBike(b) {
    // For bike parts that we know the properties of
    var bike_parts = new Group();

    // For bike parts that are estimated due to lack of data
    var bike_parts_estimated = new Group();

    // Draw bottom bracket
    var shapeBottomBracket = new Shape.Circle(b.bottom_bracket, 5);
    bike_parts.addChild(shapeBottomBracket);

    // Draw chainstay
    var pathChainstay = new Path.Line(b.bottom_bracket, b.rear_wheel);
    bike_parts.addChild(pathChainstay);

    // Draw Head Tube
    var pathHeadTube = new Path.Line(b.steering_axis_top, b.head_tube_bottom);
    bike_parts.addChild(pathHeadTube);

    // Draw Seat Tube
    var pathSeatTube = new Path.Line(b.bottom_bracket, b.seat_tube_top);
    bike_parts.addChild(pathSeatTube);

    // Draw Fork
    var pathFork = new Path.Line(b.head_tube_bottom, b.front_wheel);
    bike_parts.addChild(pathFork);

    //Draw Top Tube
    var pathTopTube = new Path.Line(b.seat_tube_top, b.steering_axis_top);
    bike_parts.addChild(pathTopTube);

    // Draw Down Tube. As this is estimated we move 80% up the head tube.
    var pathDownTube = new Path.Line(b.bottom_bracket, (pathHeadTube.getPointAt(pathHeadTube.length * 0.8)));
    bike_parts_estimated.addChild(pathDownTube);

    // Draw Seat Stay
    var pathSeatStay = new Path.Line(b.rear_wheel, b.seat_tube_top);
    bike_parts_estimated.addChild(pathSeatStay);

    // Draw rear wheel
    var shapeRearWheel = new Shape.Circle(b.rear_wheel, b.wheel_size);
    bike_parts.addChild(shapeRearWheel);

    // Draw front wheel
    var shapeFrontWheel = new Shape.Circle(b.front_wheel, b.wheel_size);
    bike_parts.addChild(shapeFrontWheel);

    // Apply styling and interactivity to each bike part that we know the value of
    bike_parts.children.forEach(function (part) {
        part.set({
            strokeCap: 'round',
            opacity: 0.3,
            strokeWidth: 7,
            strokeColor: colours.component,
            onMouseEnter: function () {
                this.strokeColor = colours.hovered;
            },
            onMouseLeave: function () {
                this.strokeColor = colours.component;
            }
        });
    });

    // Apply styling and interactivity to each bike part that we know the value of
    bike_parts_estimated.children.forEach(function (part) {
        part.set({
            strokeCap: 'round',
            strokeWidth: 2,
            dashArray: [7, 7],
            strokeColor: colours.component
        });
    });

    b.bike_group.addChild(bike_parts);
    b.bike_group.addChild(bike_parts_estimated);
}

function main() {
    drawGridLines();

    // Resize the bikes to fit within the view
    allBikes.fitBounds(view.bounds);
    allBikes.scale(0.8);
    allBikes.bringToFront();
    readBikeData();
    
}

main();

function readBikeData(file) {
    var xmlhttp = new XMLHttpRequest();
    var url = "dataTest.json";

    xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var myArr = JSON.parse(this.responseText);
        var notSort = [];
        for (k in myArr){
            notSort.push(myArr[k])
        }        
        
        test_bicycle = notSort.sort(function(a, b) {
            return a.stack - b.stack;
        });


        loaded = true;
        }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function onFrame(event) {
    project.activeLayer.removeChildren()
    drawGridLines();

    allBikes = new Group();
    if(loaded){
        for (bike in test_bicycle){
            makeBike(test_bicycle[bike]);
        }
        if(state == "testing"){
            for (bikeKey in allBikes.children){
                bike = allBikes.children[bikeKey];
                var new_pos = view.center
                if (bikeKey == 0){
                    new_pos = new_pos + new Point(-1000,-1000)
                }
                if (bikeKey == 1){
                    new_pos = new_pos + new Point(1000,-1000)
                }
                if (bikeKey == 2){
                    new_pos = new_pos + new Point(-1000,1000)
                }
                if (bikeKey == 3){
                    new_pos = new_pos + new Point(1000,1000)
                }
                bike.position = new_pos
                // console.log("bike children", bike.children);
                
                bike.children.forEach(function (part) {
                    strokeColor: multiple.component[bikeKey]
                    console.log(multiple.component[bikeKey]);
                    
                });
            }
        } else {
            for (bikeKey in allBikes.children){
                bike = allBikes.children[bikeKey];
                
                bike.children.forEach(function (part) {
                    part.set({
                    strokeColor: multiple.component[bikeKey]
                    })
                });

            }
        }
        
            // Resize the bikes to fit within the view
        allBikes.fitBounds(view.bounds);
        allBikes.scale(0.8);
        allBikes.bringToFront();
    }    

}

// Find rear wheel centre using wheelbase and the view centre point
function findRearWheel(b) {
    return new Point(view.center + new Point(0 - b.wheelbase / 2, 0));
}

// Find front wheel centre using wheelbase and the view centre point
function findFrontWheel(b) {
    return new Point(view.center + new Point(b.wheelbase / 2, 0));
}

// Use Pythagoras' Theorem to find the bottom bracket
function findBottomBracket(b) {
    var point = new Point(b.rear_wheel);
    point += new Point(Math.sqrt(Math.pow(b.chainstay, 2) + Math.pow(b.bb_drop, 2)), 0);
    point += new Point(0, b.bb_drop);
    return point;
}

//Find bottom of steering axis by using fork rake to find distance from front wheel along wheelbase
function findSteeringAxisBottom(b) {
    return new Point(b.front_wheel - new Point(b.fork_rake / Math.sin(b.head_angle), 0));
}

function findSteeringAxisTop(b) {
    // Calculate length of steering axis
    var steering_axis_length = (b.stack - b.bb_drop) / Math.sin(b.head_angle * Math.PI / 180);

    // Use Pythagoras' Theorem to find X offset of top of steering axis from front wheel
    // var steering_axis_top_offset = new Point(b.front_wheel - new Point(b.fork_rake + Math.sqrt(Math.pow(steering_axis_length, 2) - Math.pow((b.stack - b.bb_drop), 2)), 0));
    var steering_axis_top_offset = b.steering_axis_bottom - new Point(Math.sqrt(Math.pow(steering_axis_length, 2) - Math.pow((b.stack - b.bb_drop), 2)), 0);

    // Find coordinate for top of steering axis / head tube
    return steering_axis_top_offset - new Point(0, (b.stack - b.bb_drop));
}

function findHeadTubeBottom(b) {
    // Find coordinate for bottom of head tube y offset from top of head tube sin * hyp
    var y_offset = Math.sin(b.head_angle * Math.PI / 180) * b.head_tube;

    var x_offset = Math.sqrt(Math.pow(b.head_tube, 2) - Math.pow(y_offset, 2));

    return b.steering_axis_top + new Point(x_offset, y_offset);
}

function findSeatTubeTop(b) {
    // Find coordinates for top of seat tube offset from bottom bracket sin * hyp
    var y_offset = Math.sin(b.seat_angle * Math.PI / 180) * b.seat_tube_length;

    var x_offset = Math.sqrt(Math.pow(b.seat_tube_length, 2) - Math.pow(y_offset, 2));

    return b.bottom_bracket - new Point(x_offset, y_offset);
}
