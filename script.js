/*
TODO: Keep working on paths: 
    - Different color depending on type of object (ball, team Home, team Guest)
    - paths could shade so it's clear what's the most recent movement
TODO: Keep working on button to start play:
    - With JS, make button to keep pressed and change to Stop play when pressed again
TODO: Add more options for default positions:
TODO: Save last state when changing court (so when going back, the positions are the same as before)
*/

const COURT_RESIZE_RATIO = 0.2

const TEAM = {
    home: 0,
    guest: 1
}

const PLAYER_ROLE = {
    point_guard: 0,
    shooting_guard: 1,
    small_forward: 2,
    power_forward: 3,
    center: 4
}

const COURT = {
    half: 0,
    full: 1
}

/**** CLASS DEFINITIONS ****/

class ObjectDraggable {
    constructor(image, initX, initY, r){
        this.image = image; 
        this.initX = initX;
        this.initY = initY;
        this.posX = initX;
        this.posY = initY;
        this.r = r;
        this.path_color = "black";
        this.hidden = false;
    }
}

class Ball extends ObjectDraggable{
    constructor(initX, initY, r) {
        super(document.getElementById('ball'), initX, initY, r);
        this.path_color = "green";
    }

    draw(context) {
        context.drawImage(
            this.image, 0, 0, this.image.width, this.image.height,
            this.posX, this.posY, this.r * 2, this.r * 2
        );
    }
}

class Player extends ObjectDraggable{
    constructor(team, role, initX, initY) {
        const aspect_ratio = 4  // Resize players on board
        const r = 75           
        super(document.getElementById('players'), initX, initY, r / aspect_ratio);

        this.team = team;
        this.role = role;
        this.d = 2 * this.r * aspect_ratio;

        if (this.team == TEAM.guest) {
            this.path_color = "red";
        } 
    }

    draw(context) {
        context.drawImage(
            this.image, this.role * this.d, this.team * this.d, this.d, this.d,
            this.posX, this.posY, this.r * 2, this.r * 2 
        );
    }

    getId() {
        const team_name = Object.keys(TEAM).find(key => TEAM[key] === this.team);
        const role_name = Object.keys(PLAYER_ROLE).find(key => PLAYER_ROLE[key] === this.role);
        return team_name + ', ' + role_name;
    }
}

class Team {
    constructor(team, teamInitX, teamInitY) {
        this.team = team;
        this.teamInitX = teamInitX;
        this.teamInitY = teamInitY;
        this.playersOffset = 50;

        this.players = [];
        for (let i = 0; i < 5; i++) {
            this.players.push(new Player(this.team, i, this.teamInitX, this.teamInitY + i * this.playersOffset));
        }
    }

    draw(context) {
        this.players.forEach(player => {
            player.draw(context);
        })
    }

    show(is_shown = true) {
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


class Board {
    constructor() {
        // Canvas related properties
        this.canvas_back = document.getElementById('canvas1');
        this.context_back = this.canvas_back.getContext('2d');
        this.canvas_front = document.getElementById('canvas2');
        this.context_front = this.canvas_front.getContext('2d');

        this.width;
        this.height;
        this.startX;
        this.startY;

        // Elements for first canvas
        this.ball;
        this.team_guest;
        this.team_home;
        this.players;

        // Parameters to drag & drop
        this.current_object;
        this.dragging_object = false;

        // Parameters to draw lines
        this.startPlay = false;

        this.setup();

        // Register Event Listeners
        this.canvas_front.addEventListener('mousedown', e=> {
            /* Dragging object. */
            e.preventDefault();
            this.startX = parseInt(e.offsetX);
            this.startY = parseInt(e.offsetY);

            this.objects.forEach(object => {
                if (this.is_mouse_in_object(this.startX, this.startY, object)){
                    this.current_object = object;
                    console.log(this.current_object.path_color);
                    this.dragging_object = true;
                    return;                      
                }
            });
        });

        this.canvas_front.addEventListener('mouseup', e=> {
            /* Dropping object.  */
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

                let mouseX = parseInt(e.offsetX);
                let mouseY = parseInt(e.offsetY);

                let dx = mouseX - this.startX;
                let dy = mouseY - this.startY;

                // Move object
                this.current_object.posX += dx;
                this.current_object.posY += dy;

                this.draw_path(mouseX, mouseY);
                this.draw_objects();
                

                this.startX = mouseX;
                this.startY = mouseY;

            }

        });
    }

    setup(display=COURT.half) {
        /* Initializes the canvas depending on what display is desired: Full or Half court. */

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
        this.ball = new Ball(this.width / 2, this.height / 2, 15);
        this.team_home = new Team(TEAM.home, 10, 10);
        this.team_guest = new Team(TEAM.guest, this.width - 45, 10);
        this.objects = [].concat(this.ball, this.team_home.players, this.team_guest.players);
   
        this.draw_objects();  // Initial draw
    }

    draw_objects() {
        this.context_front.clearRect(0, 0, this.width, this.height);

        this.objects.forEach(object => {
            if (!object.hidden) {
                object.draw(this.context_front);
            }
        });
    }

    draw_path(mouseX, mouseY) {
        if (this.startPlay) {
            this.context_back.beginPath();
            this.context_back.moveTo(mouseX, mouseY);
            this.context_back.lineTo(this.startX, this.startY);
            this.context_back.strokeStyle = this.current_object.path_color;
            this.context_back.lineWidth = 3;
            this.context_back.stroke();
            this.context_back.closePath();
        }
    }

    is_mouse_in_object(mouseX, mouseY, object) {
        let cx = object.posX + object.r;
        let cy = object.posY + object.r;

        let dx = Math.abs(cx - mouseX);
        let dy = Math.abs(cy - mouseY);

        if (dx < object.r && dy < object.r) { return true; }
        else { return false; }
    }

    get_objects_list() {
        let objects = [];
        objects.push(this.ball);
        objects.concat(this.team_home.players);
        objects.concat(this.team_guest.players);

        return objects;
    }

    reset() {
        /* Moves every object to its initial position. */ 
        this.context_back.clearRect(0, 0, this.width, this.height);
        this.context_front.clearRect(0, 0, this.width, this.height);
        this.objects.forEach(object => {
            object.posX = object.initX;
            object.posY = object.initY;
            object.draw(this.context_front);
        });

        this.startPlay = false;
    }
}

/********************************/


/**** FUNCTIONS ****/

function init_board(canvas, display=COURT.half){
    /* Initializes the canvas depending on what display is desired: Full or Half court. */

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

    canvas.style.background = `url('${im_path}')`;
    canvas.style.backgroundSize = "auto 100%";
    canvas.style.backgroundRepeat = "no-repeat";
    canvas.width = image.width * resize_ratio;
    canvas.height = image.height * resize_ratio;

    // Second canvas
    let canvas2 = document.getElementById('canvas2');
    canvas2.width = image.width * resize_ratio;
    canvas2.height = image.height * resize_ratio;

    return new Board(canvas);
}

/*******************/

window.addEventListener('load', function(){
    // Get HTML elements 
    const toggleSwitch = document.getElementById('toggleBg');
    const buttonReset = document.getElementById('buttonReset');
    const checkboxHome = document.getElementById('homeTeam');
    const checkboxGuest = document.getElementById('guestTeam');
    const buttonPlay = document.getElementById('buttonPlay');
    console.log(buttonPlay);

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
    })
})