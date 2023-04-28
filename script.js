/*
TODO: Players collision
TODO: Buttons for different actions:
    - reset initial distribution
    - start drawing lines (will draw lines following players/ball movements).
    - hide options (for teams or players)
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
        this.posX = initX;
        this.posY = initY;
        this.r = r;
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
    }

    draw(context) {
        this.players.forEach(player => {
            player.draw(context);
        })
    }
}


class Board {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.objects = [new Ball(this.width / 2, this.height / 2, 15)]; // Always ball on board.
        this.current_object;
        this.dragging_object = false;

        this.startX;
        this.startY;

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
            object.draw(this.context);
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

    add_team(team) {
        team.players.forEach(player => {
            this.objects.push(player);
        })
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
    board.add_team(new Team(TEAM.home, 10, 10));
    board.add_team(new Team(TEAM.guest, board.canvas.width - 45, 10));
    board.draw();
})