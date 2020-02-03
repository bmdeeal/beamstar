/*
    beamstar -- 2015 Brenden Deeal
    made for Graphical Applications Development
*/
var worldsize=2000;
var fps = 60;

function move(obj,x,y,z) {
    obj.mesh.position.x = x;
    obj.mesh.position.y = y;
    obj.mesh.position.z = z;
}

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

class w3r_BeamObj {
    constructor() {
		this.max_time = fps*3+Math.random()*30;
		this.start_time = fps;
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
        /*this.shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(this.radius, 4000),
            new THREE.MeshBasicMaterial({color: 0x220000, side: THREE.DoubleSide})
        );
        
        this.shadow.rotation.x=Math.PI;
        this.shadow.y=this.radius+0.1;
        this.mesh.add(this.shadow);
        */
        //this.mesh.position.y=
    }
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
    update() {
        if (this.active == true) {
			//s.visible = true;
            this.time++;
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
            if (this.time > this.max_time) {
				this.active = false;
            }
        } else {
			//this.mesh.material.visible = false;
        }
    }
}

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
    update() {
        this.mesh.rotation.y+=0.2;
        this.mesh.position.x+=this.dx;
        this.mesh.position.z+=this.dz;
        if  (this.mesh.position.x < player.mesh.position.x) { this.dx+=this.acceleration; }
        if  (this.mesh.position.x > player.mesh.position.x) { this.dx-=this.acceleration; }
        if  (this.mesh.position.z < player.mesh.position.z) { this.dz+=this.acceleration; }
        if  (this.mesh.position.z > player.mesh.position.z) { this.dz-=this.acceleration; }
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
        this.shadow.position.x = this.mesh.position.x;
        this.shadow.position.z = this.mesh.position.z;
        
    }
}

/*
todo: add enemy direction indicator
*/
class w3r_PlayerObj {
    constructor() {
        this.health=4;
        this.score=0;
        this.invuln_time=fps*2;
        this.invuln=0;
        this.radius = 30;
        var segments = 24;
        var rings = 24;
        this.friction=0.95;
        this.acceleration=0.8;
        this.top_speed=25;
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
        move(this, 0,this.radius,0);
        this.dx=0;
        this.dz=0;
        this.dy=0;
    }
    check_beams() {
        for (var jj=0; jj<num_beams; jj++) {
            if (beams[jj].damaging == true && this.invuln <= 0 && (this.mesh.position.y > beams[jj].mesh.position.y-beams[jj].radius) && (this.mesh.position.y < beams[jj].mesh.position.y+beams[jj].radius)) {
                //
                if (beams[jj].direction == "horizontal") {

                    if ((this.mesh.position.z > beams[jj].mesh.position.z-beams[jj].radius) && (this.mesh.position.z < beams[jj].mesh.position.z+beams[jj].radius)) {
                        this.health-=0.5;
                        this.invuln = this.invuln_time;
                        beams[jj].active=false;
                    }
                    
                }
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
    check_enemy() {
        if (ballCollide3D(this.mesh.position.x,this.mesh.position.y,this.mesh.position.z,enemy.radius,enemy.mesh.position.x,enemy.mesh.position.y,enemy.mesh.position.z,enemy.radius) && !(this.invuln > 0)) {
            this.health--;
            this.invuln = this.invuln_time;
        }
    }
    update() {
        if (this.health > 0) {
            this.score++;
            this.score+=Math.floor(Math.abs(this.dx+this.dz)/2)*3;
            this.invuln--;
            if (this.invuln <= 0) {
                this.invuln=0;
                this.mesh.visible = true;
            } else {
                this.mesh.visible = !this.mesh.visible;
            }
            this.dx*=this.friction;
            this.dy-=this.gravity;
            this.dz*=this.friction;
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
            this.mesh.position.x+=this.dx;
            this.mesh.position.z+=this.dz;
            this.mesh.position.y+=this.dy;
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
            this.shadow.position.x=this.mesh.position.x;
            this.shadow.position.z=this.mesh.position.z;
            this.check_enemy();
            this.check_beams();
        }
    }
}


var scene, renderer, camera;
var container, hud;
var keyUp = false;
var keyDown = false;
var keyLeft = false;
var keyRight = false;
var keyJump = false;
var player = new w3r_PlayerObj();
var enemy = new w3r_EnemyObj();
var beams = [];
var num_beams=10;
for (var ii=0; ii< num_beams; ii++) {
    beams.push(new w3r_BeamObj());
}

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

function gameLoop() {
    setTimeout(function() {
        w3r_update();
        renderer.render(scene, camera);
        requestAnimationFrame(gameLoop);
    }, 1000 / fps);
    
}

function w3r_main() {
    //alert("[A], [S], or [D] to jump, arrow keys move.");
    var draw_distance = 2500;
    container = document.createElement("div");
    hud = document.createElement("div");
    hud.style.position = "absolute";
    hud.style.top = "8px";
    hud.style.left = "8px";
    hud.innerHTML = "testing";
    hud.style.fontFamily = "sans";
    hud.style.color = "white";
    document.body.appendChild(container);
    document.body.appendChild(hud);
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x282828, 400, draw_distance);
    renderer = new THREE.WebGLRenderer({antialias: false});
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    renderer.setClearColor(scene.fog.color);
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, draw_distance);
    //camera.position.z = 100;
    //camera.position.y = 90;
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
    window.addEventListener('resize', onWindowResize, false);
    for (var jj = 0; jj < beams.length; jj++) {
        scene.add(beams[jj].mesh);
    }
    gameLoop();
}

//todo bind key event handlers to these
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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

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