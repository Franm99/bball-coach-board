/*
TODO: Players collision
TODO: Buttons for different actions:
    - start drawing lines (will draw lines following players/ball movements).
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

/**** CLASS DEFINITIONS ****/

class ObjectDraggable {
    constructor(image, initX, initY, r){
        this.image = image; 
        this.initX = initX;
        this.initY = initY;
        this.posX = initX;
        this.posY = initY;
        this.r = r;

        this.hidden = false;
    }
}

class Ball extends ObjectDraggable{
    constructor(initX, initY, r) {
        super(document.getElementById('ball'), initX, initY, r);
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

        this.hidden = false;
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
    constructor(canvas) {
        // Canvas related properties
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.startX;
        this.startY;

        // Objects
        this.ball = new Ball(this.width / 2, this.height / 2, 15);
        this.team_home = new Team(TEAM.home, 10, 10);
        this.team_guest = new Team(TEAM.guest, this.canvas.width - 45, 10);
        this.objects = [].concat(this.ball, this.team_home.players, this.team_guest.players);

        // Parameters to drag & drop
        this.current_object;
        this.dragging_object = false;

        this.draw();  // Initial draw

        // Event Listeners
        this.canvas.addEventListener('mousedown', e=> {
            /* Dragging object. */
            e.preventDefault();
            this.startX = parseInt(e.offsetX);
            this.startY = parseInt(e.offsetY);

            this.objects.forEach(object => {
                if (this.is_mouse_in_object(this.startX, this.startY, object)){
                    this.current_object = object;
                    this.dragging_object = true;
                    return;                      
                }
            });
        });

        this.canvas.addEventListener('mouseup', e=> {
            /* Dropping object.  */
            if (!this.dragging_object) { return; }
            e.preventDefault();
            this.dragging_object = false;

        });

        this.canvas.addEventListener('mouseout', e=> {
            /* Mouse out of canvas, drop object. */
            if (!this.dragging_object) { return; }
            e.preventDefault();
        });

        this.canvas.addEventListener('mousemove', e=> {
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

                this.current_object.posX += dx;
                this.current_object.posY += dy;

                this.draw();

                this.startX = mouseX;
                this.startY = mouseY;
            }

        });
    }

    draw() {
        this.context.clearRect(0, 0, this.width, this.height);

        this.objects.forEach(object => {
            if (!object.hidden) {
                object.draw(this.context);
            }
        });
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
        this.context.clearRect(0, 0, this.width, this.height);
        this.objects.forEach(object => {
            object.posX = object.initX;
            object.posY = object.initY;
            object.draw(this.context);
        });
    }
}

/********************************/

window.addEventListener('load', function(){
    // Setting background image.
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');

    const background = new Image();
    background.src = "img/half-court.jpg";

    canvas.width=background.width * COURT_RESIZE_RATIO;
    canvas.height=background.height * COURT_RESIZE_RATIO;

    let board = new Board(canvas);

    const buttonReset = document.getElementById('buttonReset');
    buttonReset.addEventListener('click', function(){
        board.reset();
    });

    const checkboxHome = document.getElementById('homeTeam');
    checkboxHome.addEventListener('change', function() {
        if (!this.checked) {
            board.team_home.show(false);
        } else {
            board.team_home.show(true);
        }
        board.draw();
      });

    const checkboxGuest = document.getElementById('guestTeam');
    checkboxGuest.addEventListener('change', function() {
        if (!this.checked) {
            board.team_guest.show(false);
        } else {
            board.team_guest.show(true);
        }
        board.draw();
      });

})