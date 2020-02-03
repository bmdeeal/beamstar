/*
    beamstar -- 2015, 2020 Brenden Deeal
    made for Graphical Applications Development
*/
var worldsize=2000;
var fps = 60; //todo: limit somehow

//move -- sets x/y/z position of a mesh
function move(obj,x,y,z) {
    obj.mesh.position.x = x;
    obj.mesh.position.y = y;
    obj.mesh.position.z = z;
}

//ballCollide3D -- check for sphere-sphere collisions
//it's just Pythagorean's theorem in 3D
//a/b: the two objects, x/y/z: pos, r: radius
function ballCollide3D(ax, ay, az, ar, bx, by, bz, br) {
    var rx, ry, rz, rr;
    rx = ax-bx
    rx *= rx;
    ry = ay-by
    ry *= ry;
    rz= az-bz
    rz *= rz;
    rr = ar+br;
    if (Math.sqrt(rx+ry+rz) < rr) { return true; }
    return false;
}

//w3r_BeamObj -- the random laser beams the player has to dodge
//the w3r prefix is from when the game had a different name completely
class w3r_BeamObj {
    constructor() {
		this.max_time = fps*3+Math.random()*30;
		this.start_time = fps; //when to make it damage the player
        this.active=false;
        this.damaging=false;
        this.main_opacity = 0.8;
        this.side_opacity = 0.4;
        this.radius=30
        this.time=0;
        this.direction = "none";
        var geometry = new THREE.CylinderGeometry(this.radius,this.radius,4000);
        var material = new THREE.MeshPhongMaterial({color: 0xFF0000, specular: 0xFFFF00, emissive: 0x885500});
        material.blending = THREE.AdditiveBlending
        material.shading = THREE.FlatShading;
        material.transparent = true;
        material.opacity=0.4;
        this.mesh = new THREE.Mesh(geometry, material);
    }
    //activate -- spawn a beam in the given direction
    activate(direction) {
        this.mesh.position.z=0;
        this.mesh.position.x=0;
        this.mesh.rotation.x=0;
        this.mesh.rotation.z=0;
        this.direction = direction;
        this.mesh.position.y=this.radius+Math.random()*100;
        if (direction == "forward") {
            this.mesh.position.x=Math.random()*4000-2000;
            this.mesh.rotation.x=Math.PI/2;
        }
        if (direction == "horizontal") {
            this.mesh.position.z=Math.random()*4000-2000;
            this.mesh.rotation.z=Math.PI/2;
        }
        this.time=Math.random()*20;
        this.active=true;
        this.damaging=false;
    }
    //update -- happens every frame
    update() {
        if (this.active == true) {
            this.time++;
            //flicker the beam when it can't hurt the plaeyer
            if (this.time < this.start_time) {
                this.damaging=false;
				if (this.mesh.material.opacity == this.main_opacity) {
                    this.mesh.material.opacity = this.side_opacity
                } else {
                    this.mesh.material.opacity = this.main_opacity
                }
            } else {
				this.mesh.material.opacity = 1;
                this.damaging=true;
            }
            //disable the beam after time is up
            if (this.time > this.max_time) {
				this.active = false;
            }
        } else {
            //dunno what I was going to put here, todo -- remove
			//this.mesh.material.visible = false;
        }
    }
}

//w3r_EnemyObj -- sphere that chases player
class w3r_EnemyObj {
    constructor() {
        this.acceleration=0.4;
        this.top_speed=13;
        this.radius = 60;
        var segments = 8;
        var rings = 8;
        var material = new THREE.MeshPhongMaterial({color: 0x00CCFF});
        material.shading = THREE.FlatShading;
        var geometry = new THREE.SphereGeometry(this.radius,segments,rings);
        this.mesh = new THREE.Mesh(geometry, material);
        this.shadow = new THREE.Mesh(
            new THREE.CircleGeometry(this.radius, 32),
            new THREE.MeshBasicMaterial({color: 0x000000})
        )
        this.shadow.material.transparent=true;
        this.shadow.material.opacity=.75;
        this.shadow.position.y=0.3;
        this.shadow.rotation.x=-Math.PI/2;
        move(this, 0,this.radius,0);
        this.dx=0;
        this.dz=0;
        this.mesh.position.x=0;
        this.mesh.position.z=-1500;
        this.mesh.position.y=this.radius;
    }
    
    //update -- happens every frame
    update() {
        this.mesh.rotation.y+=0.2;
        this.mesh.position.x+=this.dx;
        this.mesh.position.z+=this.dz;
        //follow the player, kind of like a magnet
        if  (this.mesh.position.x < player.mesh.position.x) { this.dx+=this.acceleration; }
        if  (this.mesh.position.x > player.mesh.position.x) { this.dx-=this.acceleration; }
        if  (this.mesh.position.z < player.mesh.position.z) { this.dz+=this.acceleration; }
        if  (this.mesh.position.z > player.mesh.position.z) { this.dz-=this.acceleration; }
        //clamp position, bounce off walls
        if (this.mesh.position.x > worldsize-this.radius) {
            this.mesh.position.x=worldsize-this.radius;
            this.dx = -this.dx/2;
        }
        if (this.mesh.position.x < -worldsize+this.radius) {
            this.mesh.position.x=-worldsize+this.radius;
            this.dx = -this.dx/2;
        }
        if (this.mesh.position.z > worldsize-this.radius) {
            this.mesh.position.z=worldsize-this.radius;
            this.dz = -this.dz/2;
        }
        if (this.mesh.position.z < -worldsize+this.radius) {
            this.mesh.position.z=-worldsize+this.radius;
            this.dz = -this.dz/2;
        }
        //move shadow to position, not sure if should have added to base mesh or not due to the ball's spin
        //could add a parent mesh
        this.shadow.position.x = this.mesh.position.x;
        this.shadow.position.z = this.mesh.position.z;
        
    }
}

//w3r_PlayerObj -- the player itself
class w3r_PlayerObj {
    constructor() {
        this.health=4;
        this.score=0;
        this.invuln_time=fps*2; //time you're invulnerable after getting hit
        this.invuln=0;
        this.radius = 30;
        var segments = 24;
        var rings = 24;
        this.friction=0.95; //multiplied against dx/dz
        this.acceleration=0.8;
        this.top_speed=25; //generally not reached due to friction calculation
        //camera positioning and inital offsets
        this.camera_z=220;
        this.camera_y=300;
        this.camera_xoffset = 0;
        this.camera_zoffset = 0;
        this.camera_offset_reset = 0.98;
        this.camera_maxoffset=50;
        this.camera_offset_speed = 1;
        this.camera_offset_shift = 30;
        this.gravity=0.8;
        this.jump=false;
        var material = new THREE.MeshLambertMaterial({color: 0x00FF00});
        var geometry = new THREE.SphereGeometry(this.radius,segments,rings);
        this.mesh = new THREE.Mesh(geometry, material);
        this.shadow = new THREE.Mesh(
            new THREE.CircleGeometry(this.radius, 32),
            new THREE.MeshBasicMaterial({color: 0x000000})
        )
        this.shadow.material.transparent=true;
        this.shadow.material.opacity=.75;
        this.shadow.position.y=0.3;
        this.shadow.rotation.x=-Math.PI/2;
        move(this, 0,this.radius,0); //jump to center, put on ground
        this.dx=0;
        this.dz=0;
        this.dy=0;
        //enemy position indicator
        this.arrow = new THREE.Mesh(
            new THREE.CylinderGeometry(1,20,90,3),
            new THREE.MeshLambertMaterial({color: 0xFF0000})
        )
        this.arrow.material.transparent=true;
        this.mesh.add(this.arrow);
        this.arrow.position.y=this.radius+20;
    }
    //check_beams -- are we being fried by lasers
    check_beams() {
        for (var jj=0; jj<num_beams; jj++) {
            //if the beam is active, we're not invulnerable, and we're in the height range to collide
            if (beams[jj].damaging == true && this.invuln <= 0 && (this.mesh.position.y > beams[jj].mesh.position.y-beams[jj].radius) && (this.mesh.position.y < beams[jj].mesh.position.y+beams[jj].radius)) {
                //handle horizontal beams
                if (beams[jj].direction == "horizontal") {
                    if ((this.mesh.position.z > beams[jj].mesh.position.z-beams[jj].radius) && (this.mesh.position.z < beams[jj].mesh.position.z+beams[jj].radius)) {
                        this.health-=0.5; //todo: split to beam_damage variable
                        this.invuln = this.invuln_time;
                        beams[jj].active=false;
                    }
                }
                //handle vertical beams
                if (beams[jj].direction == "forward") {
                    if ((this.mesh.position.x > beams[jj].mesh.position.x-beams[jj].radius) && (this.mesh.position.x < beams[jj].mesh.position.x+beams[jj].radius)) {
                        this.health-=0.5;
                        this.invuln = this.invuln_time;
                        beams[jj].active=false;
                    }
                }
            }
        }
    }
    //check_enemy -- are we being run over by the enemy?
    check_enemy() {
        if (ballCollide3D(this.mesh.position.x,this.mesh.position.y,this.mesh.position.z,enemy.radius,enemy.mesh.position.x,enemy.mesh.position.y,enemy.mesh.position.z,enemy.radius) && !(this.invuln > 0)) {
            this.health--;
            this.invuln = this.invuln_time;
        }
    }
    //update -- happens every frame
    update() {
        if (this.health > 0) {
            this.score++; //add to score each frame
            this.score+=Math.floor(Math.abs(this.dx)+Math.abs(this.dz)/2)*3; //add to score based on speed, incentivizes movement 
            this.invuln--;
            //if not invulnerable, don't flash the player, do so otherwise
            if (this.invuln <= 0) {
                this.invuln=0;
                this.mesh.visible = true;
            } else {
                this.mesh.visible = !this.mesh.visible;
            }
            //movement
            this.dx*=this.friction;
            this.dy-=this.gravity;
            this.dz*=this.friction;
            //camera bob to keep the game from looking too static
            this.camera_xoffset*=this.camera_offset_reset;
            this.camera_zoffset*=this.camera_offset_reset;
            this.camera.position.z=this.camera_z+this.camera_zoffset;
            this.camera.position.x=this.camera_xoffset;
            this.camera.position.y=this.camera_y;
            if (Math.abs(this.camera_xoffset) > this.camera_maxoffset) {
                this.camera_xoffset = this.camera_maxoffset * Math.sign(this.camera_xoffset);
            }
            if (this.camera_zoffset > this.camera_maxoffset + this.camera_offset_shift) {
                this.camera_zoffset = this.camera_maxoffset + this.camera_offset_shift;
            }
            if (this.camera_zoffset < -this.camera_maxoffset + this.camera_offset_shift) {
                this.camera_zoffset = -this.camera_maxoffset + this.camera_offset_shift;
            }
            //move player based on deltas
            this.mesh.position.x+=this.dx;
            this.mesh.position.z+=this.dz;
            this.mesh.position.y+=this.dy;
            //check key inputs
            if (keyLeft == true) {
                this.dx-=this.acceleration;
                this.camera_xoffset+=this.camera_offset_speed;
            }
            if (keyRight == true) {
                this.dx+=this.acceleration;
                this.camera_xoffset-=this.camera_offset_speed;
            }
            if (keyUp == true) {
                this.dz-=this.acceleration;
                this.camera_zoffset+=this.camera_offset_speed;
            }
            if (keyDown == true) {
                this.dz+=this.acceleration;
                this.camera_zoffset-=this.camera_offset_speed;
            }
            if (keyJump == true && this.jump==false) {
                this.dy=20;
                this.camera_zoffset+=3;
                this.jump=true;
            }
            //clamp speed and position
            if (Math.abs(this.dx) > this.top_speed) {
                this.dx=this.top_speed*Math.sign(this.dx);
            }
            if (Math.abs(this.dz) > this.top_speed) {
                this.dz=this.top_speed*Math.sign(this.dz);
            }
            if (this.mesh.position.x > worldsize-this.radius) {
                this.mesh.position.x=worldsize-this.radius;
            }
            if (this.mesh.position.x < -worldsize+this.radius) {
                this.mesh.position.x=-worldsize+this.radius;
            }
            if (this.mesh.position.z > worldsize-this.radius) {
                this.mesh.position.z=worldsize-this.radius;
            }
            if (this.mesh.position.z < -worldsize+this.radius) {
                this.mesh.position.z=-worldsize+this.radius;
            }
            if (this.mesh.position.y < this.radius) {
                this.mesh.position.y=this.radius;
                this.jump=false;
            }
            //update shadow -- probably should have just added the shadow mesh to the main mesh
            this.shadow.position.x=this.mesh.position.x;
            this.shadow.position.z=this.mesh.position.z;
            //check collisions
            this.check_enemy();
            this.check_beams();
            //enemy arrow indicator
            this.arrow.rotation.x=Math.PI/2; //flip it sideways
            this.arrow.rotation.z=-Math.atan2(enemy.mesh.position.x-this.mesh.position.x,enemy.mesh.position.z-this.mesh.position.z); //spin it toward the enemy
            this.arrow.material.opacity=0.2;
            if (Math.sqrt(Math.pow(this.mesh.position.x - enemy.mesh.position.x, 2)+Math.pow(this.mesh.position.z - enemy.mesh.position.z, 2)) < 1000) {
                this.arrow.material.opacity=0.7;
            }
        } else {
            this.mesh.visible=false;
            this.mesh.rotation.y+=0.0005;
            this.camera.position.z+=0.5;
        }
    }
}


var scene, renderer, camera;
var container, hud;
//key constants
var keyUp = false;
var keyDown = false;
var keyLeft = false;
var keyRight = false;
var keyJump = false;
//game objects
var player = new w3r_PlayerObj();
var enemy = new w3r_EnemyObj();
var beams = [];
var num_beams=10;
for (var ii=0; ii< num_beams; ii++) {
    beams.push(new w3r_BeamObj());
}

//w3r_update -- happens every frame, updates the game, the hud, and spawns beams
function w3r_update() {
    player.update();
    enemy.update();
    hud.innerHTML = "health: " + player.health + "<br >score: " + player.score;
    //update beams, make a new beam if there aren't any active ones
    for (var jj = 0; jj < beams.length; jj++) {
        beams[jj].update();
        if (beams[jj].active == false) {
            if (Math.random() > 0.5) {
                beams[jj].activate("horizontal");
            } else {
                beams[jj].activate("forward");
            }
        }
    }
}

//gameLoop -- todo: consolidate into w3r_update
function gameLoop() {
    //setTimeout(function() {
        w3r_update();
        renderer.render(scene, camera);
        requestAnimationFrame(gameLoop);
    //}, 1000 / fps);
    
}

//w3r_main -- everything starts here
function w3r_main() {
    //alert("[A], [S], or [D] to jump, arrow keys move.");
    var draw_distance = 2500;
    //make the hud out of HTML elements, style it
    container = document.createElement("div");
    hud = document.createElement("div");
    hud.style.position = "absolute";
    hud.style.top = "0px";
    hud.style.left = "0px";
    hud.style.width = "128px"
    hud.style.padding = "8px 8px 8px 8px";
    hud.style.backgroundColor = "rgba(8,8,8,0.5)";
    hud.innerHTML = "testing";
    hud.style.fontFamily = "Sans-Serif";
    hud.style.color = "white";
    document.body.appendChild(container);
    document.body.appendChild(hud);
    //set up the scene, lights, etc
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x282828, 400, draw_distance);
    renderer = new THREE.WebGLRenderer({antialias: false});
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    renderer.setClearColor(scene.fog.color);
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, draw_distance);
    var light = new THREE.PointLight(0x777777);
    light.position.set( 0, 250, 0 );
    scene.add(light);
    var light2 = new THREE.HemisphereLight(0xaaeeff, 0x113311, 0.5);
    scene.add(light2);
    var grid = new THREE.GridHelper(worldsize, 100);
    scene.add(grid);
    player.mesh.add(camera);
    player.camera=camera;
    camera.rotation.x=-0.75;
    scene.add(player.mesh);
    scene.add(player.shadow);
    scene.add(enemy.mesh);
    scene.add(enemy.shadow);
    window.onkeydown=onKeyDown;
    window.onkeyup=onKeyUp;
    window.addEventListener('resize', onWindowResize, false); //when window is resized, make the canvas match
    for (var jj = 0; jj < beams.length; jj++) {
        scene.add(beams[jj].mesh);
    }
    gameLoop(); //game starts here
}

//onKeyDown -- check for key presses
//can't remember why I made it a variable holding an anonymous function
var onKeyDown = function (event) {
    //console.log("keyDown " + event);
    switch (event.keyCode) {
        case 38: // up
            keyUp = true;
            break;

        case 37: // left
            keyLeft = true;
            break;

        case 40: // down
            keyDown = true;
            break;

        case 39: // right
            keyRight = true;
            break;
            
        case 68: // d
        case 65: // a
        case 83: // s
            keyJump = true;
            break;
    }
};

//onWindowResize -- update the canvas and 3D projection when the window is resized
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

//onKeyUp -- check for key releases
var onKeyUp = function (event) {
    //console.log("keyUp " + event.keyCode);
    switch (event.keyCode) {
        case 38: // up
        case 87: // w
            keyUp = false;
            break;

        case 37: // left
            keyLeft = false;
            break;

        case 40: // down
            keyDown = false;
            break;

        case 39: // right
            keyRight = false;
            break;
            
        case 68: // d
        case 65: // a
        case 83: // s
            keyJump = false;
            break;
    }
};