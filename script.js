/*
TODO: Keep working on paths: 
    - paths could shade so it's clear what's the most recent movement
TODO: Keep working on button to start play:
    - With JS, make button to keep pressed and change to Stop play when pressed again
TODO: Add more options for default positions:
    - Define "plays", create some of the basic ones.
TODO: Add Undo button (and give the same functionality to Ctrl+Z)
TODO: Save last state when changing court (so when going back, the positions are the same as before)
*/

const UNDO_LIMIT = 10;

const TEAM = {home: 0, guest: 1};

const COURT = {half: 0, full: 1};

const PLAYER_ROLE = {
    point_guard: 0,
    shooting_guard: 1,
    small_forward: 2,
    power_forward: 3,
    center: 4
};

/**
 * Class for objects on a canvas that are draggable and moved.
 * @class [abstract] ObjectDraggable
 */
class ObjectDraggable {
    /**
     * Class constructor.
     * @param {HTMLImageElement} image - (Circular) Image or Sprite sheet.
     * @param {Array.<Number>} initPos - Initial position from top-left corner on canvas.
     * @param {Number} r - Expected radius of image on canvas.
     * 
     */
    constructor(image, initPos, r){
        this.image = image; 
        this.initPos = initPos.slice();
        this.pos = initPos.slice();
        this.prevPosArray = []; 
        this.r = r;
        this.path_color = "black";
        this.hidden = false;

        if (this.constructor === ObjectDraggable) {
            throw new Error("Abstract classes can't be instantiated.")
        }
    }

    save_last_position() {
        this.prevPosArray.push(this.pos.slice());

        if (this.prevPosArray.length > UNDO_LIMIT) {
            this.prevPosArray.shift();
        }
    }

    undo_move() {
        if (this.prevPosArray.length > 0) {
            this.pos = this.prevPosArray.pop().slice();
        }
    }
}


/**
 * Ball class
 * @class Ball
 */
class Ball extends ObjectDraggable{
    constructor(initPos, r) {
        super(document.getElementById('ball'), initPos, r);
        this.path_color = "green";
    }

    /**
     * Draws a basketball on canvas.
     * @param {CanvasRenderingContext2D} context - Canvas context in where the player will be drawn.
     */
    draw(context) {
        context.drawImage(
            this.image, 0, 0, this.image.width, this.image.height,
            this.pos[0], this.pos[1], this.r * 2, this.r * 2
        );
    }
}


/**
 * Player class
 * @class Player
 */
class Player extends ObjectDraggable{
    constructor(team, role, initPos) {
        const aspect_ratio = 4  // Resize players on board
        const r = 75           
        super(document.getElementById('players'), initPos, r / aspect_ratio);

        this.team = team;
        this.role = role;
        this.d = 2 * this.r * aspect_ratio;

        switch (this.team) {
            case TEAM.home:
                this.path_color = "black";
                break;
            case TEAM.guest:
                this.path_color = "red";
                break;
        }
    }

    /**
     * Takes a player from the players Sprite sheet, and draws it on the given canvas context.
     * @param {CanvasRenderingContext2D} context - Canvas context in where the player will be drawn.
     */
    draw(context) {
        context.drawImage(
            this.image, this.role * this.d, this.team * this.d, this.d, this.d,
            this.pos[0], this.pos[1], this.r * 2, this.r * 2 
        );
    }
}

/**
 * Team class.
 * @class Team
 */
class Team {
    /**
     * Class constructor.
     * @param {Number} team - from TEAM Enum.
     * @param {Array.<Number>} initPos - Initial position for the whole team.
     */
    constructor(team, initPos) {
        this.team = team;
        this.initPos = initPos;
        this.playersOffset = 50;

        this.players = [];
        for (let i = 0; i < 5; i++) {
            this.players.push(new Player(this.team, i, [this.initPos[0], this.initPos[1] + i * this.playersOffset]));
        }
    }

    /**
     * Draws team on canvas.
     * @param {CanvasRenderingContext2D} context 
     */
    draw(context) {
        this.players.forEach(player => {
            player.draw(context);
        })
    }

    /**
     * Shows/Hides team.
     * @param {Boolean} [Optional] is_shown 
     */
    show(is_shown=true) {
        this.players.forEach(player => {
            if (is_shown) {
                player.hidden = false;
            }
            else {
                player.hidden = true;
            }
        })
    }
}


/**
 * Action performed on a Draggable object on board.
 * @class Action
 */
class Action {
    constructor(object) {
        this.object = object;
        this.path = [];
        this.onPlay = false;

        this.object.save_last_position();
    }
}


/**
 * Board class.
 * @class Board
 */
class Board {
    /**
     * Class constructor.
     */
    constructor() {
        // Canvas related properties
        this.canvas_back = document.getElementById('canvas1');
        this.context_back = this.canvas_back.getContext('2d');
        this.canvas_front = document.getElementById('canvas2');
        this.context_front = this.canvas_front.getContext('2d');

        this.width;
        this.height;
        this.startPos = [];

        // Elements for first canvas
        this.ball;
        this.team_guest;
        this.team_home;
        this.players;

        // Parameters to drag & drop
        this.current_action;
        this.dragging_object = false;

        this.actions = [];

        // Parameters to draw lines
        this.startPlay = false;

        this.setup();

        // Register Event Listeners
        this.canvas_front.addEventListener('mousedown', e=> {
            /* Dragging object. */
            e.preventDefault();
            this.startPos = [parseInt(e.offsetX), parseInt(e.offsetY)];

            this.objects.forEach(object => {
                if (this.is_mouse_in_object(this.startPos, object)){

                    this.add_action(object);
                    this.dragging_object = true;
                    this.current_action.path.push(this.startPos);
                    return;                      
                }
            });
        });

        this.canvas_front.addEventListener('mouseup', e=> {
            /* Dropping object. */
            if (!this.dragging_object) { return; }
            e.preventDefault();
            this.dragging_object = false;
        });

        this.canvas_front.addEventListener('mouseout', e=> {
            /* Mouse out of canvas, drop object. */
            if (!this.dragging_object) { return; }
            e.preventDefault();
        });

        this.canvas_front.addEventListener('mousemove', e=> {
            /* Move object when dragged. */
            if (!this.dragging_object) {
                return;
            }
            else {
                e.preventDefault();

                let mousePos = [parseInt(e.offsetX), parseInt(e.offsetY)];
                let distance = [mousePos[0] - this.startPos[0], mousePos[1] - this.startPos[1]];

                // Move object
                this.current_action.object.pos[0] += distance[0];
                this.current_action.object.pos[1] += distance[1];

                this.current_action.path.push(mousePos);

                if (this.startPlay) {
                    this.draw_path(this.startPos, mousePos);
                }
                this.draw_objects();

                this.startPos = mousePos;
            }

        });
    }

    /**
     * Initializes the canvas depending on what display is desired: Full or Half court.
     * @param {Number} [Optional] display - Choose from COURT Enum.
     */
    setup(display=COURT.half) {
        let im_path;
        let image = new Image();
        let resize_ratio;

        if (display == COURT.half){
            im_path = 'img/half-court.jpg';
            resize_ratio = 0.2;
        } else {
            im_path = 'img/full-court.jpg';
            resize_ratio = 0.1;
        }

        image.src = im_path;

        // First canvas
        this.canvas_back.style.background = `url('${im_path}')`;
        this.canvas_back.style.backgroundSize = "auto 100%";
        this.canvas_back.style.backgroundRepeat = "no-repeat";
        this.canvas_back.width = image.width * resize_ratio;
        this.canvas_back.height = image.height * resize_ratio;

        // Second canvas (same size)
        this.canvas_front.width = image.width * resize_ratio;
        this.canvas_front.height = image.height * resize_ratio;

        this.width = this.canvas_back.width;
        this.height = this.canvas_back.height;

        // Objects
        this.team_guest = new Team(TEAM.guest, [this.width - 45, 10]);
        this.team_home = new Team(TEAM.home, [10, 10]);
        this.ball = new Ball([this.width / 2, this.height / 2], 15);
        this.objects = [].concat(this.team_guest.players, this.team_home.players, this.ball);
   
        this.draw_objects();  // Initial draw
    }

    /**
     * Draws all non-hidden objects on canvas.
     */
    draw_objects() {
        this.context_front.clearRect(0, 0, this.width, this.height);

        this.objects.forEach(object => {
            if (!object.hidden) {
                object.draw(this.context_front);
            }
        });
    }

    /**
     * Draws mouse path when dragging objects on canvas.
     * @param {Array.<Number>} start 
     * @param {Array.<Number>} end 
     */
    draw_path(start, end, color=this.current_action.object.path_color) {
        this.context_back.beginPath();
        this.context_back.moveTo(end[0], end[1]);
        this.context_back.lineTo(start[0], start[1]);
        this.context_back.strokeStyle = color;
        this.context_back.lineWidth = 3;
        this.context_back.stroke();
        this.context_back.closePath();
    }

    undo_action() {
        // todo: Too much things happening here. Refactor a bit.

        if (this.actions.length == 0) {
            return;  // No actions can be reversed.
        }

        this.actions.pop();

        this.context_back.clearRect(0, 0, this.width, this.height);

        // Move current object to new position
        this.current_action.object.undo_move();
        this.draw_objects();

        // Draw paths if Play mode is On.
        if (this.startPlay) {
            this.actions.forEach(action => {
                if ( action.onPlay) {
                    let segment = action.path;
                    let init_point = segment.shift();
                    segment.forEach(point => {
                        // todo: seems to remove some initial/last point from path when redrawing. Solve it.
                        this.draw_path(init_point, point, action.object.path_color);
                        init_point = point;
                    });
                 }
            });
        }

        // Update action to last registered
        this.current_action = this.actions[this.actions.length - 1];
    }

    /**
     * Checks if the mouse is over a specific object.
     * @param {Array} mousePos 
     * @param {ObjectDraggable} object 
     * @returns {Boolean} - True if mouse over object. False elsewhere.
     */
    is_mouse_in_object(mousePos, object) {
        let center = [object.pos[0] + object.r, object.pos[1] + object.r];
        let distance = [Math.abs(center[0] - mousePos[0]), Math.abs(center[1] - mousePos[1])];

        if (distance[0] < object.r && distance[1] < object.r) { 
            return true; 
        } else { 
            return false; 
        }
    }

    add_action(object) {
        this.current_action = new Action(object);
        if (this.startPlay) {
            this.current_action.onPlay = true;
        }

        this.actions.push(this.current_action);
        if (this.actions.length > UNDO_LIMIT) {
            this.actions.shift();
        }
    }

    /**
     * Resets initial state on board.
     */
    reset() {
        this.context_back.clearRect(0, 0, this.width, this.height);
        this.context_front.clearRect(0, 0, this.width, this.height);
        this.objects.forEach(object => {
            object.pos = object.initPos.slice();
            object.draw(this.context_front);
        });

        this.startPlay = false; // Stop drawing paths.
    }
}


/** MAIN **/
window.addEventListener('load', function(){
    // Get HTML elements 
    const toggleSwitch = document.getElementById('toggleBg');
    const buttonReset = document.getElementById('buttonReset');
    const checkboxHome = document.getElementById('homeTeam');
    const checkboxGuest = document.getElementById('guestTeam');
    const buttonPlay = document.getElementById('buttonPlay');
    const buttonUndo = this.document.getElementById('buttonUndo');

    // Initialize board
    let board = new Board();

    // Event listeners for HTML elements.
    
    toggleSwitch.addEventListener('change', function() {
        if (!this.checked) {
            board.setup(COURT.half);
        } else {
            board.setup(COURT.full);
        }

        // By default, both teams will be shown when a board is initialized.
        checkboxHome.checked = true;
        checkboxGuest.checked = true;

        board.startPlay = false;
    });

    buttonReset.addEventListener('click', function(){
        board.reset();
    });

    checkboxHome.addEventListener('change', function() {
        if (!this.checked) {
            board.team_home.show(false);
        } else {
            board.team_home.show(true);
        }
        board.draw_objects();
    });

    
    checkboxGuest.addEventListener('change', function() {
        if (!this.checked) {
            board.team_guest.show(false);
        } else {
            board.team_guest.show(true);
        }
        board.draw_objects();
    });

    buttonPlay.addEventListener('click', function(){
        board.startPlay = true;
    });

    buttonUndo.addEventListener('click', function(){
        // todo: If no actions on board, disable button.
        board.undo_action();
    });
})