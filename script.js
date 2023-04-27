/*
TODO: Players collision
TODO: 

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

window.addEventListener('load', function(){

    // Setting background image.
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');

    const background = new Image();
    background.src = "img/half-court.jpg";

    canvas.width=background.width * COURT_RESIZE_RATIO;
    canvas.height=background.height * COURT_RESIZE_RATIO;


    class Player {
        constructor(board, team, role, posX, posY) {
            this.board = board;
            this.team = team;         // To select a row from the players template
            this.role = role; // To select a column from the players template

            this.image = document.getElementById("players");
            
            this.d = 150;  // diameter

            this.aspect_radius = 4;

            this.ad = this.d / this.aspect_radius;  // actual diameter after resize

            this.posX = posX;
            this.posY = posY;

            this.cX = this.posX + this.ad/2;
            this.cY = this.posY + this.ad/2; 
        }

        draw(context) {
            context.drawImage(this.image, this.role * this.d, this.team * this.d,
                this.d, this.d, this.posX, this.posY, 
                this.d / this.aspect_radius, this.d / this.aspect_radius);
        }

        update(deltaTime) {
            const dX = this.cX - this.board.mouse.x;
            const dY = this.cY - this.board.mouse.y;
            const distance = Math.sqrt(dX*dX + dY*dY);

            // todo: Add collisions. Players dissapear when passing over another one.
            if (distance < this.ad/2 && this.board.mouse.pressed) {
                if (!this.board.mouse.pressed){this.selected = false}
                this.posX = this.board.mouse.x - this.ad/2 ;
                this.posY = this.board.mouse.y - this.ad/2;

                this.cX = this.posX + this.ad/2;
                this.cY = this.posY + this.ad/2;  
            }

        }
    }


    class Team {
        constructor(board, team){
            this.board = board;
            this.team = team;

            this.posX;
            this.posY = 50;

            this.players = [];


            // choose position based on team
            if (this.team == TEAM.home){
                this.posX = 10;
            }
            else {
                this.posX = this.board.width - 45;
            }

            for (let i = 0; i < 5; i++){
                this.players.push(new Player(this.board, this.team, i, this.posX, this.posY + i*50));
            }
        }

        draw(context) {
            this.players.forEach(player => {
                player.draw(context);
            });
        }

        update(deltaTime) {
            this.players.forEach(player => {
                player.update(deltaTime);
            })
        }
    }


    // Board class
    class Board {
        constructor(canvas) {
            this.canvas = canvas;
            this.width = this.canvas.width;
            this.height = this.canvas.height;

            this.mouse = {
                x: this.width * 0.5,
                y: this.height * 0.5,
                pressed: false,
            };

            this.fps = 120;
            this.timer = 0;
            this.interval = 1000/this.fps;

            this.team1 = new Team(this, TEAM.home);
            this.team2 = new Team(this, TEAM.guest);


            // event listeners
            canvas.addEventListener('mousemove', e => {
                this.mouse.x = e.offsetX;
                this.mouse.y = e.offsetY;

                if (e.which == 1){
                    this.mouse.pressed = true;
                }
                else {
                    this.mouse.pressed = false;
                }
                
            })


        }

        render(context, deltaTime) {
            if (this.timer > this.interval){
                context.clearRect(0, 0, canvas.width, canvas.height);

                this.team1.draw(context);
                this.team1.update(deltaTime);

                this.team2.draw(context);
                this.team2.update(deltaTime);

                this.timer = 0;
            }

            this.timer += deltaTime;
        }
    }
    
    const board = new Board(canvas);

    let lastTime = 0;
    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;

        lastTime = timeStamp;

        board.render(ctx, deltaTime);
        window.requestAnimationFrame(animate); // Create endless animation loop
    }

    animate(0);
})