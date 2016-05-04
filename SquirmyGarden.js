/* Taken from CS314 P3 */



// SETUP RENDERER
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0x1133aa);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();
// SETUP CAMERA
var aspect = window.innerWidth/window.innerHeight;
var camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 10000);

// ADAPT TO WINDOW RESIZE
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

//for testing:
//var controls = new THREE.OrbitControls(camera);
//controls.damping = 0.2;

/* Original code from here on */

startTime = Date.now();

var maxFlowerHealth = 1000;
var flowerHealth = [maxFlowerHealth,maxFlowerHealth,maxFlowerHealth];

//Setup some variables for use throughout:
var xAxis = new THREE.Vector3(1,0,0);
var yAxis = new THREE.Vector3(0,1,0);
var zAxis = new THREE.Vector3(0,0,1);
// AxisHelper for debugging
var AxisHelper = new THREE.AxisHelper(20);

// TEXTURES
THREE.ImageUtils.crossOrigin = ' ';
var grassTexture = new THREE.Texture(THREE.ImageUtils.loadTexture('textures/grassbumpmap.jpg'), {wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping});
grassTexture.repeat.set(4,8);
//var brickTexture = new THREE.Texture(THREE.ImageUtils.loadTexture('textures/brickwork-bump-map.jpg'), {wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping});
//brickTexture.repeat.set(8, 1);

// MATERIALS
var planetMaterial = new THREE.MeshPhongMaterial({color: 0x225522, bumpMap: THREE.ImageUtils.loadTexture('textures/grassbumpmap.jpg')});
var wizardMaterial = new THREE.MeshPhongMaterial({ map: THREE.ImageUtils.loadTexture('textures/starry_starry_sky.jpg')});
var wizardFaceMaterial = new THREE.MeshPhongMaterial({ map: THREE.ImageUtils.loadTexture('textures/wizard_face.bmp')});
var flowerStemMaterial = new THREE.MeshPhongMaterial({/*color : 0x00ff99,*/ map: THREE.ImageUtils.loadTexture('textures/flower_stem.jpg')});
var hutWallMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, bumpMap: THREE.ImageUtils.loadTexture('textures/brickbumpmap.png')});
var hutRoofMaterial = new THREE.MeshPhongMaterial({color: 0x0, bumpMap: THREE.ImageUtils.loadTexture('textures/shingles.jpg')});
//var fireParticleMaterial = new THREE.SpriteMaterial({map: THREE.ImageUtils.loadTexture('textures/fire_particle.png')});

var fireParticleMaterial = new THREE.SpriteMaterial({map: THREE.ImageUtils.loadTexture('textures/fire_particle.png')});
var fireRoseMaterial = new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture('textures/fire.jpg')});
var starRoseMaterial = new THREE.MeshPhongMaterial({ map: THREE.ImageUtils.loadTexture('textures/starry_starry_sky.jpg')});

//var fireParticleMaterial = new THREE.SpriteMaterial({map: THREE.ImageUtils.loadTexture('textures/fire_particle.png')});
var fireParticleMaterial = new THREE.MeshPhongMaterial({color: 0x4466ff});
var cloudRoseMaterial = new THREE.MeshPhongMaterial({ map: THREE.ImageUtils.loadTexture('textures/puffycloud.jpg')});
var gardenMaterial = new THREE.MeshPhongMaterial({color: 0x443322, map: THREE.ImageUtils.loadTexture('textures/dirtTexture.jpg')});

// HEADS UP DISPLAY
var timeLeft = 25000;
//var timelineMaterial = new THREE.LineBasicMaterial({color: 0x0, linewidth: 1});
var timelineMaterial = new THREE.MeshLambertMaterial({color: 0x0});
var timelineGeometry = new THREE.BoxGeometry(0.25,0.005,0.001);
//timelineGeometry.vertices.push(
//	new THREE.Vector3(0,0,0),
//	new THREE.Vector3(2,0,0));
var timeline = new THREE.Mesh(timelineGeometry, timelineMaterial);
camera.add(timeline);
timeline.translateZ(-camera.near-1);
timeline.translateY(-0.25);
timeline.translateX(0.17);

var spaceShipSpriteMaterial = new THREE.SpriteMaterial({map: THREE.ImageUtils.loadTexture('textures/motherInLawShip.png'), transparent: true});
var spaceShipSprite = new THREE.Sprite(spaceShipSpriteMaterial);

spaceShipSprite.scale.set(0.1,0.05,0.1);
timeline.add(spaceShipSprite);
//spaceShipSprite.translateZ(0.01);
spaceShipSprite.translateX(0.25/2);

// LIGHT SOURCES
var ambientLight = new THREE.AmbientLight(0x505050);
scene.add(ambientLight);
var skyLight = new THREE.PointLight(0xffffff, 1, 0, 0);
scene.add(skyLight);
skyLight.translateY(1000);

var treeLight = new THREE.PointLight(0xfffffa, 1,0,0);



// FIRE PARTICLES

var fireMaterial = new THREE.ShaderMaterial({
	uniforms: {
		startColor : {type: 'c', value: 0x66cc00},
		endColor : {type: 'c', value: 0x444400},
	}
});

var shaders = [
	'glsl/fireShader.vs.glsl',
	'glsl/fireShader.fs.glsl',
	'glsl/bumpMap.fs.glsl',
	'glsl/bumpMap.vs.glsl',
	'glsl/flowerShader.vs.glsl',
	'glsl/flowerShader.vs.glsl',
]
new THREE.SourceLoader().load(shaders, function(shaders) {

fireParticleMaterial.vertexShader = 'glsl/fireShader.vs.glsl';
fireParticleMaterial.fragmentShader = 'glsl/fireShader.fs.glsl';
fireParticleMaterial.needsUpdate = true;
//planetMaterial.vertexShader = 'glsl/bumpMap.vs.glsl';
//planetMaterial.fragmentShader = 'glsl/bumpMap.fs.glsl';
//planetMaterial.needsUpdate = true;

})

fireParticleGeometry = new THREE.SphereGeometry(0.3,8,8);
function Particle(sprite, life, alive) {
	this.sprite = sprite;
	this.life = life;
	this.alive = alive;
}

const NUM_PARTICLES = 1000;
const NUM_NEW_PARTICLES = 10;
const FIRE_LENGTH = 10;
const FIRE_RADIUS = 3;
const FIRE_LENGTH_INC = FIRE_LENGTH / 10;
const FIRE_ANGLE_INC = 2*Math.PI / 30;
const FIRE_RADIUS_INC = FIRE_RADIUS / 12;
//var particle;
//hand.add particles

function endFire() {
	for (i = 0; i < NUM_PARTICLES; i++) {
		wizardHead.remove(particles[i].sprite);
		particles[i].sprite.visible = false;
	}
}

function updatePosition() {
	//...
}

function newParticle(j) {
	particles[j] = new Particle(new THREE.Mesh(fireParticleGeometry, fireParticleMaterial), 50, true);
//	particles[j].life = 100;
//	particles[j].alive = true;
	rightArm.add(particles[j].sprite);

	//particles[j].sprite.position = new Vector3(0,0,0);
	particles[j].sprite.translateY(0.5 * ARM_LENGTH);
	particles[j].sprite.rotateOnAxis(yAxis, 2*Math.PI / FIRE_ANGLE_INC * j);
	//reset particle position;
}


/*
var fireballGeometry = new THREE.CylinderGeometry(0.5,0.5,5,5);

var fireball = new THREE.Mesh(fireballGeometry,fireMaterial);

scene.add(fireball);
camera.parent = fireball;
fireball.translateZ(-5);
fireball.rotateX(Math.PI/2);
*/

// GEOMETRY
const PLANET_RADIUS = 250;
var planetGeometry = new THREE.SphereGeometry(PLANET_RADIUS, 100, 100 );
planet = new THREE.Mesh( planetGeometry, planetMaterial );
scene.add( planet );

const TREE_HEIGHT = 30;
const TREE_OFFSET = PLANET_RADIUS+0.5*TREE_HEIGHT
var treeGeometry = new THREE.CylinderGeometry(5, 30, TREE_HEIGHT );
var treeMaterial = new THREE.MeshNormalMaterial();
tree = new THREE.Mesh( treeGeometry, treeMaterial );
//planet.add( tree );
tree.rotateOnAxis(xAxis,Math.PI/4);
tree.translateY(TREE_OFFSET);
//tree.add(treeLight);
treeLight.translateY(0.5*TREE_HEIGHT);

var collisionObjs = [];

// HUT
const HUT_WALL_HEIGHT = 14;
const HUT_RADIUS = 10;
const HUT_WALL_OFFSET = PLANET_RADIUS+0.5*HUT_WALL_HEIGHT
//const HUT_LOCATION_Z = Math.PI/20;
var hutWallGeometry = new THREE.CylinderGeometry(10, 10, HUT_WALL_HEIGHT );

hutWall = new THREE.Mesh( hutWallGeometry, hutWallMaterial );
planet.add( hutWall );
//hutWall.rotateOnAxis(zAxis, HUT_LOCATION_Z);
hutWall.translateY(HUT_WALL_OFFSET);

const HUT_ROOF_HEIGHT = 8;
const HUT_ROOF_BOT_RADIUS = 14
const HUT_ROOF_OFFSET = 0.5 * (HUT_ROOF_HEIGHT + HUT_WALL_HEIGHT);
var hutRoofGeometry = new THREE.CylinderGeometry(2, HUT_ROOF_BOT_RADIUS, HUT_ROOF_HEIGHT );

hutRoof = new THREE.Mesh( hutRoofGeometry, hutRoofMaterial );
hutWall.add( hutRoof );
hutRoof.translateY(HUT_ROOF_OFFSET);
collisionObjs.push(hutRoof);
collisionObjs.push(hutWall);



// ___________
// GARDEN
const GARDEN_ANGLE = new THREE.Vector3(Math.PI/24,0,-Math.PI/10);
const GARDEN_RADIUS = PLANET_RADIUS* 0.75;
var gardenGeometry = new THREE.SphereGeometry(GARDEN_RADIUS,16,16);
var garden = new THREE.Mesh(gardenGeometry, gardenMaterial);
planet.add(garden);
garden.rotateOnAxis(zAxis,GARDEN_ANGLE.z);
garden.rotateOnAxis(xAxis,GARDEN_ANGLE.x);
garden.translateY(PLANET_RADIUS - GARDEN_RADIUS + 2);

const FLOWER_HEIGHT = 3;
const FLOWER_OFFSET = PLANET_RADIUS+0.5*FLOWER_HEIGHT
const FLOWER_ROTATION = Math.PI/2;
var flowerGeometry = new THREE.SphereGeometry(FLOWER_HEIGHT, 5, 5 );
var flowerMaterial = new THREE.MeshNormalMaterial();
flower = new THREE.Mesh( flowerGeometry, flowerMaterial );
planet.add( flower );
flower.rotateOnAxis(xAxis,FLOWER_ROTATION);
flower.translateY(FLOWER_OFFSET);

var flowerGarden = {flower};
var FLOWER_DISTANCE = Math.PI/100;
var currAngle = FLOWER_ROTATION;

for(i=1;i<100;i++){
	_flower = flower.clone();
	//We want 10 rows of 10 flowers, so when we get to 10
	//we start a new row!!
	if(i%10){
		currAngle = FLOWER_ROTATION;
		rotateObject(Math.PI/2, _flower);
		moveObjectForward((FLOWER_DISTANCE*(i%10)), _flower, FLOWER_OFFSET);
	}
	else{
		currAngle += FLOWER_DISTANCE;
		moveObjectForward(currAngle, _flower, FLOWER_OFFSET);
	}
	planet.add(_flower)
	flowerGarden[i] = _flower;
}

var flowers = [];
// SPACE ROSE
//const SPACE_ROSE_ANGLE = GARDEN_ANGLE + new THREE.Vector3()
const FLOWER_STEM_HEIGHT = 14;
const FLOWER_STEM_RADIUS = 5;
const FLOWER_STEM_TUBE = 2;
const FLOWER_STEM_ARC = Math.PI/2;
const FLOWER_STEM_ARC_DECAY = Math.PI/6;
const STAR_ROSE_ROTATION = Math.PI;
const ROSE_SEPARATION = Math.PI/20;

var flowerStemBotGeometry = new THREE.CylinderGeometry(FLOWER_STEM_TUBE, FLOWER_STEM_TUBE, FLOWER_STEM_HEIGHT, 100);
var flowerStemTopHealthyGeometry = new THREE.TorusGeometry(FLOWER_STEM_RADIUS, FLOWER_STEM_TUBE, 16, 100, FLOWER_STEM_ARC);
var flowerStemTopDyingGeometry = new THREE.TorusGeometry(FLOWER_STEM_RADIUS, FLOWER_STEM_TUBE, 16, 100, FLOWER_STEM_ARC + Math.PI/6);
var flowerStemTopDeadGeometry = new THREE.TorusGeometry(FLOWER_STEM_RADIUS, FLOWER_STEM_TUBE, 16, 100, FLOWER_STEM_ARC + 2*Math.PI/6);


// var flowerStem = new THREE.Mesh(flowerStemBotGeometry, flowerStemMaterial);
// var flowerStemTop = new THREE.Mesh(flowerStemTopHealthyGeometry, flowerStemMaterial);

var stems = [];
for (i = 0; i < 3; i++) {
	var flowerStem = new THREE.Mesh(flowerStemBotGeometry, flowerStemMaterial);
	var flowerStemTop = new THREE.Mesh(flowerStemTopHealthyGeometry, flowerStemMaterial);

garden.add(flowerStem);
flowerStem.rotateOnAxis(yAxis, STAR_ROSE_ROTATION);
flowerStem.rotateOnAxis(xAxis, (i- 1) * ROSE_SEPARATION);
flowerStem.translateY(GARDEN_RADIUS + 0.5*FLOWER_STEM_HEIGHT - 0.5);
flowerStem.add(flowerStemTop);
flowerStemTop.translateY(0.5 * FLOWER_STEM_HEIGHT - 0.1);
//flowerStemTop.add(AxisHelper);
flowerStemTop.translateX(FLOWER_STEM_RADIUS);
flowerStemTop.rotateZ(Math.PI/2);

var spaceRoseGeometry = new THREE.TorusKnotGeometry(5, 3, 64, 8, 7, 4, 1);

// var spaceRoseHealthyMaterial = new THREE.MeshPhongMaterial({color: 0xff0033});
// var spaceRoseDyingMaterial = new THREE.MeshPhongMaterial({color: 0x992211});
// var spaceRoseDeadMaterial = new THREE.MeshPhongMaterial({color: 0x666600});


// var spaceRose = new THREE.Mesh(spaceRoseGeometry, spaceRoseHealthyMaterial);
// flowerStemTop.add(spaceRose);
// spaceRose.rotateOnAxis(xAxis, Math.PI/2);
// spaceRose.translateZ(FLOWER_STEM_RADIUS);
// spaceRose.translateX(FLOWER_STEM_RADIUS);
// flowers.push(spaceRose);
// collisionObjs.push(spaceRose);

var stem = {
	stem: flowerStem,
	stemTop: flowerStemTop
};
stems.push(stem);
}


var roseMaterials = []
roseMaterials[0] = fireRoseMaterial;
roseMaterials[1] = starRoseMaterial;
roseMaterials[2] = cloudRoseMaterial;

var roses = [];
for (i = 0; i < 3; i++) {
var roseGeometry = new THREE.TorusKnotGeometry(5, 3, 64, 8, 7, 4, 1);
var rose = new THREE.Mesh(roseGeometry, roseMaterials[i]);
stems[i].stemTop.add(rose);
rose.rotateOnAxis(xAxis, Math.PI/2);
rose.translateZ(FLOWER_STEM_RADIUS);
rose.translateX(FLOWER_STEM_RADIUS);
roses[i] = rose;

collisionObjs.push(rose);
}

for (i = 0; i < 3; i++) {
	flowers.push(stems[i].stem);
	flowers.push(stems[i].stemTop);
	flowers.push(roses[i]);
}

// VINES
var vineMaterial = new THREE.MeshPhongMaterial({color: 0x886622});
var vineGeometry = new THREE.TorusKnotGeometry(PLANET_RADIUS,5,64,8,6,11,1);
var vines = new THREE.Mesh(vineGeometry,vineMaterial);
planet.add(vines);
var vines2 = new THREE.Mesh(vineGeometry, vineMaterial);
planet.add(vines2);
vines2.rotateOnAxis(xAxis, Math.PI/2);

// WORMS
const WORM_SEG_RADIUS = 1;
const WORM_NUM_SEGS = 10;
const WORM_OFFSET = PLANET_RADIUS + 0.5;
const NUM_WORMS = 3;

var worms = [];
var wormMaterial = new THREE.MeshLambertMaterial({color: 0x90b020, transparency: 0.5, transparent: true});
var wormGeometry = new THREE.SphereGeometry(WORM_SEG_RADIUS);

for(var j = 0; j<NUM_WORMS; j++){
	var wormHead = new THREE.Mesh(wormGeometry, wormMaterial);
	wormHead.translateY(WORM_OFFSET);

	moveObjectForward(Math.random() * 3* Math.PI, wormHead, WORM_OFFSET);
	moveObjectSide(Math.random() * 3* Math.PI, wormHead, WORM_OFFSET);

	var worm = [];
	worm[0] = wormHead;

	 var wormSegParent = wormHead;
	for(i=0;i<WORM_NUM_SEGS/2;i++){
		var wormSegChild = new THREE.Mesh(wormGeometry, wormMaterial);
		 wormSegChild.rotateOnAxis(yAxis, Math.cos(i/2*Math.PI));
		 wormSegChild.translateZ(0.75);
		wormSegParent.add(wormSegChild);
		worm[i+1] = wormSegChild;
		wormSegParent=wormSegChild;
		collisionObjs.push(worm[i]);
	}

	var wormSegParent = wormHead;
	for(i=WORM_NUM_SEGS/2;i<WORM_NUM_SEGS;i++){
		var wormSegChild = new THREE.Mesh(wormGeometry, wormMaterial);
		wormSegChild.rotateOnAxis(yAxis, Math.cos(i/2*Math.PI-Math.PI/4));
		wormSegChild.translateZ(-0.75);
		wormSegParent.add(wormSegChild);
		worm[i+1] = wormSegChild;
		wormSegParent=wormSegChild;
		collisionObjs.push(worm[i]);
	}
	worms[j]=wormHead;
	planet.add(worms[j]);
}

// SPACE SHIP
const SHIP_START_Z = PLANET_RADIUS*10;
var scoutShipWidth = 40;
var scoutShipLength = 80;
var scoutShipGeometry = new THREE.BoxGeometry(scoutShipWidth, scoutShipWidth,100);
var scoutShipMaterial = new THREE.MeshLambertMaterial( {color: 0xFFFFFF});
var scoutShip = new THREE.Mesh(scoutShipGeometry, scoutShipMaterial);
scene.add(scoutShip);
scoutShip.translateZ(SHIP_START_Z);
// create scoutship fuel tanks
var tankRadius = 10;
var tankGeometry = new THREE.CylinderGeometry(tankRadius,tankRadius,60);
tankMaterial = new THREE.MeshLambertMaterial( {color: 0xcc33ff});
var tanks = [];
for (i = 0; i < 4; i++) {
	tanks[i] = new THREE.Mesh(tankGeometry,tankMaterial);
	tank = tanks[i];
	tank.rotateOnAxis(zAxis,i * Math.PI/2);
	scoutShip.add(tank);
	tank.rotateOnAxis(zAxis,Math.PI);
	tank.rotateOnAxis(xAxis, Math.PI/2);
	tank.translateX((scoutShipWidth + tankRadius)/2);
}

// create scoutship rear thrusters
var thrusterLargeRadius = 8;
var thrusterSmallRadius = 2;
var thrusterLength = 20;
var thrusterGeometry = new THREE.CylinderGeometry(thrusterLargeRadius,thrusterSmallRadius, thrusterLength);
var thrusterMaterial = new THREE.MeshLambertMaterial( {color: 0x888888});
var thrusters = [];
for (i = 0; i < 3; i++) {
	thrusters[i] = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
	thruster = thrusters[i];
	thruster.translateZ((scoutShipLength + thrusterLength) /2);
	thruster.rotateOnAxis(xAxis, Math.PI/2);
	thruster.rotateOnAxis(yAxis, 2 * i * Math.PI/3);
	thruster.translateX(scoutShipWidth/3);
	scoutShip.add(thruster);
}

// create scoutship pointed nose
var noseRadius = Math.sqrt(2* (Math.pow(scoutShipWidth, 2))) / 2 ;
var noseGeometry = new THREE.OctahedronGeometry(noseRadius,0);
var noseMaterial = tankMaterial;
var nose = new THREE.Mesh(noseGeometry,noseMaterial);
nose.translateZ(-(scoutShipLength/2));
nose.rotateOnAxis(zAxis, Math.PI/4);
scoutShip.add(nose);

// WIZARD 
const WIZARD_START_ANGLE = new THREE.Vector3(-Math.PI/30, 0, -Math.PI/30);

const WIZARD_RADIUS = 2.5;
const WIZARD_CHEST_RATIO = 1.11111;
const WIZARD_CHEST_HEIGHT = 3;

const WIZARD_MID_HEIGHT = 3
const WIZARD_MID_RADIUS = 2/1.8 * WIZARD_RADIUS;;
const WIZARD_MID_RATIO = 1.25;

const WIZARD_ROBE_RADIUS = 2.5/2 * WIZARD_MID_RADIUS;
//looks like EVE
//const WIZARD_ROBE_RATIO = 5/8;
const WIZARD_ROBE_RATIO = 8/5;
const WIZARD_ROBE_HEIGHT = 4;

const WIZARD_HEAD_RADIUS = 2;

const HAT_RADIUS = 3;
const HAT_HEIGHT = 5;

const WIZARD_HEIGHT = WIZARD_CHEST_HEIGHT + WIZARD_ROBE_HEIGHT + WIZARD_MID_HEIGHT;

const WIZARD_OFFSET = PLANET_RADIUS+0.5*WIZARD_CHEST_HEIGHT + WIZARD_MID_HEIGHT+ WIZARD_ROBE_HEIGHT;


//var wizardGeometry = new THREE.BoxGeometry(5,WIZARD_HEIGHT, 5);
var wizardChestGeometry = new THREE.CylinderGeometry(WIZARD_RADIUS,WIZARD_RADIUS*WIZARD_CHEST_RATIO,WIZARD_CHEST_HEIGHT,15);
var wizardMidGeometry = new THREE.CylinderGeometry(
	WIZARD_MID_RADIUS, WIZARD_MID_RATIO*WIZARD_MID_RADIUS, WIZARD_MID_HEIGHT,15);
var wizardRobeGeometry = new THREE.CylinderGeometry(WIZARD_ROBE_RADIUS,WIZARD_ROBE_RATIO*WIZARD_ROBE_RADIUS,WIZARD_ROBE_HEIGHT,15);
var wizardHeadGeomtery = new THREE.SphereGeometry(WIZARD_HEAD_RADIUS,32,32);
var hatGeometry = new THREE.CylinderGeometry(0,HAT_RADIUS,HAT_HEIGHT,15);

// Make arm
// From three.js example in documentation for Bone, Skeleton
var shoulder = new THREE.Bone();
var elbow = new THREE.Bone();
var hand = new THREE.Bone();
shoulder.add(elbow);
elbow.add(hand);
var bones = [];
bones.push(shoulder);
bones.push(elbow);
bones.push(hand);
elbow.position.y = 2;
hand.position.y = 2;

var armSkeleton = new THREE.Skeleton(bones);
const ARM_LENGTH = 5;
var armGeometry = new THREE.CylinderGeometry(1, 1, ARM_LENGTH, 8, 2);

for (i = 0; i < armGeometry.vertices.length; i++) {
	var vertex = armGeometry.vertices[i];
	var bone = vertex.y/2.5 + 1;
	armGeometry.skinIndices.push (new THREE.Vector4(bone, 0, 0, 0));
	armGeometry.skinWeights.push (new THREE.Vector4(1,0,0,0));
}

var wizard = new THREE.Mesh( wizardChestGeometry, wizardMaterial );
//wizard.matrixAutoUpdate = false;
var wizardMid = new THREE.Mesh (wizardMidGeometry, wizardMaterial);
//wizardMid.matrixAutoUpdate = false;
var wizardRobe = new THREE.Mesh( wizardRobeGeometry, wizardMaterial );
//wizardRobe.matrixAutoUpdate = false;
var wizardHead = new THREE.Mesh(wizardHeadGeomtery, wizardFaceMaterial);
//wizardHead.matrixAutoUpdate = false;
var hat = new THREE.Mesh(hatGeometry, wizardMaterial); 
//hat.matrixAutoUpdate = false;

/*
const WIZARD_HEIGHT = 10;
const WIZARD_OFFSET = PLANET_RADIUS+0.5*WIZARD_HEIGHT;
var wizardGeometry = new THREE.BoxGeometry(5,WIZARD_HEIGHT, 5);
var wizardMaterial = new THREE.MeshNormalMaterial();
wizard = new THREE.Mesh( wizardGeometry, wizardMaterial );
*/
planet.add(wizard);
wizard.rotateOnAxis(xAxis, WIZARD_START_ANGLE.x);
wizard.rotateOnAxis(yAxis, WIZARD_START_ANGLE.y);
wizard.rotateOnAxis(zAxis, WIZARD_START_ANGLE.z);
wizard.add(wizardMid);
wizardMid.translateY(-(WIZARD_CHEST_HEIGHT + WIZARD_MID_HEIGHT)/2);
wizardMid.add(wizardRobe);
//wizardMid.add(AxisHelper);
wizardRobe.translateY(-(WIZARD_ROBE_HEIGHT+WIZARD_MID_HEIGHT) / 2);
wizard.translateY(WIZARD_OFFSET);
wizard.add(wizardHead);
wizardHead.translateY(0.5*(WIZARD_RADIUS + WIZARD_CHEST_HEIGHT));
wizardHead.add(hat);
hat.translateY(0.5 * WIZARD_HEAD_RADIUS + 0.5 * HAT_HEIGHT);


// Create single mesh from wizard pieces (to make hat)
var wizardBodyGeometry = new THREE.Geometry();
//wizard.updateMatrix();
wizardBodyGeometry.merge(wizard.geometry, wizard.matrix);
//wizardMid.updateMatrix();
//wizardRobe.updateMatrix();
wizardBodyGeometry.merge(wizardMid.geometry, wizardMid.matrix);
wizardBodyGeometry.merge(wizardRobe.geometry, wizardRobe.matrix);

//var bodyHat = new THREE.Mesh(wizardBodyGeometry, wizardMaterial);
//hat.add(bodyHat);
//bodyHat.translateY(3);

const LEFT = -1;
const RIGHT = 1;
var arms = [LEFT, RIGHT];
var leftArm;
var rightArm;
for (i = 0; i < 2; i++) {
	var arm = new THREE.SkinnedMesh(armGeometry,wizardMaterial);
	arm.add(shoulder);
	arm.bind(armSkeleton);
	wizard.add(arm);
	//arm.translateX(WIZARD_RADIUS); // use a proper constant
	//arm.rotateOnAxis(xAxis, Math.PI);
	arm.translateX(-arms[i]*WIZARD_RADIUS/2);
	arm.rotateOnAxis(zAxis, arms[i]*(3/4)*Math.PI);
	arm.translateY(ARM_LENGTH/2);
	//leftArm = arm;
	if (i==0) leftArm = arm;
	else 	rightArm = arm; 
}
armSkeleton.bones[2].scale = 2;
armSkeleton.bones[0].scale = 2;

wizard.add(camera);
camera.translateZ(-75);
camera.translateY(25);
camera.lookAt(wizard.position);

//leftArm.add(AxisHelper);

var particles = [];
for (i = 0; i < NUM_PARTICLES; i++) {
//	particles[i] = new THREE.Sprite(fireParticleMaterial);
	particles.push(new Particle(new THREE.Sprite(fireParticleMaterial), 0, false));
	//particles[i].sprite.translateY(ARM_LENGTH/2);
//	particles[i].sprite.translateY(FIRE_LENGTH_INC);
//	particles[i].sprite.rotateOnAxis(yAxis, FIRE_ANGLE_INC * i);
	//particles[i].sprite.translateX(i * FIRE_RADIUS_INC);
}
var nextParticle = 0;
function findDeadParticle() {
	nextParticle = (nextParticle + 1) % NUM_PARTICLES;
	return nextParticle;
	/*
	for (i = lastUsedParticle; i < NUM_PARTICLES; i++){
        if (particles[i].alive == false){
            return i;
        }
    }
	for (i = 0; i < NUM_PARTICLES; i++) {
		if (!particles[i].sprite.alive)
			return i;
	}*/


}

function updateParticles() {
	// make new particles
	for (i = 0; i < NUM_NEW_PARTICLES; i++) {
		var j = findDeadParticle();
		newParticle(j);
	}

	// update live particles
	for (i = 0; i < NUM_PARTICLES; i++) {
		if (particles[i].alive) {
			particles[i].life -= 1;
			if (particles[i].life <= 0) {
				particles[i].alive = false;
				rightArm.remove(particles[i].sprite);
				lastUsedParticle = i;
			}
			if (particles[i].alive) {
				particles[i].sprite.translateY(FIRE_LENGTH_INC);
				particles[i].sprite.translateX(FIRE_RADIUS_INC);
			}
		}
	}
}



//interactivity
function moveObjectForward(angle,obj, offset){
	obj.translateY(-offset);
	obj.rotateX(angle);
	obj.translateY(offset);
}

function moveObjectSide(angle,obj,offset){
	obj.translateY(-offset);
	obj.rotateZ(angle);
	obj.translateY(offset);
}

function rotateObject(angle,obj){
	obj.rotateOnAxis(yAxis, angle);
}

var keyboard = new THREEx.KeyboardState();
keyboard.domElement.addEventListener('keydown', onKeyDown );
keyboard.domElement.addEventListener('keyup', onKeyUp );

var mouse = new THREE.Vector2();
renderer.domElement.addEventListener('mousedown', onMouseDown );
//renderer.domElement.addEventListener('mouseup', onMouseUp);

var isBackwards = 0;
var isForwards = 0;
var isLeft = 0;
var isRight = 0;
var movementAngle = Math.PI/350;
var turnAngle = Math.PI/100;

var moveSpeed = Math.PI/100;


function updateWizard(){
	for (var i = collisionObjs.length - 1; i >= 0; i--) {
		wizard.updateMatrixWorld();
		var wizPos = new THREE.Vector3();
		wizPos.setFromMatrixPosition( hat.matrixWorld );
		var objPos = new THREE.Vector3();
		objPos.setFromMatrixPosition( collisionObjs[i].matrixWorld );
		var rayDir = new THREE.Vector3();
		rayDir.subVectors(objPos,  wizPos);

		if(rayDir.length() < 6 * WIZARD_ROBE_RADIUS){
				wizard.translateY(- WIZARD_OFFSET );
				wizard.rotateZ(Math.PI/2000);
				wizard.translateY( WIZARD_OFFSET);
		}
		// raycaster2 = new THREE.Raycaster(wizPos, rayDir);


		// var pickedObjects = raycaster2.intersectObject(collisionObjs[i], true);
		// if(pickedObjects.length>0){
		// 	if(pickedObjects[0].distance<WIZARD_RADIUS+0.5){
		// 		return;
		// 	}
		// }
		
	}
	

	if(isForwards){
		moveObjectForward(movementAngle, wizard, WIZARD_OFFSET);
	}
	if(isBackwards){
		moveObjectForward(-movementAngle, wizard, WIZARD_OFFSET);
	}
	if(isRight){
		rotateObject(-turnAngle,wizard);
	}
	if(isLeft){
		rotateObject(turnAngle,wizard);
	}
}

var flowerHasWorm = [false,false,false];
var castFire = false;

function updateWorms(){
	for(i=0;i<10;i+=2){
		if(i==0 && wizardHasWorm == false){
			//move worm forward
			worm[i].translateY(-WORM_OFFSET);
			worm[i].rotateOnAxis(xAxis, Math.PI/100000);
			worm[i].translateY(WORM_OFFSET);
			//is worm near rose?
			var wormPos = new THREE.Vector3();
			wormPos.setFromMatrixPosition( worm[0].matrixWorld );
			var rosePos = new THREE.Vector3();
			rosePos.setFromMatrixPosition( flowerStem.matrixWorld );
			var dist = new THREE.Vector3();
			dist.subVectors(rosePos,  wormPos);
			roseHasWorm = (dist.length() < 50) ? true : false;
		}
		else{
			worm[i].rotateOnAxis(yAxis, (Math.random()-0.5) * (i % 5) * Math.PI/100);
		}
	}
}


function updateFlower(){
	if(frameCount%10000){
		for (i = 0; i < 3; i++) {
			if(flowerHasWorm[i]){
				if(flowerHealth[i] != maxFlowerHealth){
					flowerHealth[i]++;
					roses[i].geometry = new THREE.TorusKnotGeometry(5, 3 * (flowerHealth[i]/maxFlowerHealth), 64, 8, 7, 4, 1);
				}
			}
			else{
				if(flowerHealth[i] >= 0.1){
					flowerHealth[i] = 0.999 * flowerHealth[i];
					roses[i].geometry = new THREE.TorusKnotGeometry(5, 3 * (flowerHealth[i]/maxFlowerHealth), 64, 8, 7, 4, 1);
				}
			}
		}
	}


}


var flashlight = new THREE.PointLight(0xffff77, 0, 10000, Math.PI/2);
flashlight.translateY(ARM_LENGTH / 2);
leftArm.add(flashlight);
var lightOn = false;
function lightSpell() {
	flashlight.intensity = 1;
	lightOn = true;
}

function killLight() {
	flashlight.intensity = 0;
	lightOn = false;
}

var armRaised = false;
function onKeyDown(event){
	if (!gameOver){
	if(keyboard.eventMatches(event,"w")) { 

		isBackwards = 0;
		isForwards = 1;
	}
	if(keyboard.eventMatches(event,"s")) { 
		
		isBackwards = 1;
		isForwards = 0;
	}
	if(keyboard.eventMatches(event,"a")) { 
		isLeft = 1;
		isRight = 0;
	}
	if(keyboard.eventMatches(event,"d")) { 
		isLeft = 0;
		isRight = 1;
	}
	if(keyboard.eventMatches(event," ") && !armRaised) {
		castFire = true;
		liftArm(rightArm);
	}
	if(keyboard.eventMatches(event,"f") && !lightOn) {
		castLight = true;
		liftArm(leftArm);
		lightSpell();
	}
}

}

function onKeyUp(event){
	if (!gameOver) {
	if(keyboard.eventMatches(event,"w")) { 
		isForwards = 0;
	}
	if(keyboard.eventMatches(event,"s")) { 
		isBackwards = 0;
	}
	if(keyboard.eventMatches(event,"a")) { 
		isLeft = 0;
	}
	if(keyboard.eventMatches(event,"d")) {
		isRight = 0;
	}
	if(keyboard.eventMatches(event," ")) {
		castFire = false;
		endFire();
		lowerArm(rightArm);
	}
	if(keyboard.eventMatches(event,"f")) {
		lowerArm(leftArm);
		castLight = false;
		killLight();
	}
}
}

function liftArm(arm) {
		armRaised = true;
		arm.translateY(-ARM_LENGTH/2);
		arm.rotateOnAxis(xAxis, Math.PI/3);
		arm.translateY(ARM_LENGTH/2);
}

function lowerArm(arm) {
		armRaised = false;
		arm.translateY(-ARM_LENGTH/2);
		arm.rotateOnAxis(xAxis, -Math.PI/3);
		arm.translateY(ARM_LENGTH/2);
}

//Picking
var raycaster = new THREE.Raycaster();
var normalizedMouse = new THREE.Vector2();
//var objects = [tree,flower];

var wizardHasWorm = false;
const WORM_LEV_HEIGHT = 5;
function interactWithWorm(object){

	object.translateY(WORM_LEV_HEIGHT);

	//raise wizard arm
		liftArm(leftArm);
	//parent worm to wizard
		planet.updateMatrixWorld();
		THREE.SceneUtils.detach( object, planet, scene );
		planet.updateMatrixWorld();
		leftArm.updateMatrixWorld();
		THREE.SceneUtils.attach( object, scene, leftArm );
		leftArm.updateMatrixWorld();

		wizardHasWorm = object;	
}


function interactWithFlower(object){
		wizardHasWorm.translateY(-WORM_LEV_HEIGHT);

	//parent worm to wizard		
		planet.updateMatrixWorld();
		THREE.SceneUtils.detach( wizardHasWorm, leftArm, scene );
		planet.updateMatrixWorld();
		leftArm.updateMatrixWorld();
		THREE.SceneUtils.attach( wizardHasWorm, scene, planet);
		leftArm.updateMatrixWorld();	

	//lower wizard arm
		lowerArm(leftArm);

	//worm digs into ground
		

		wizardHasWorm = false;
}


function pickObject(objects){
	normalizedMouse.x = (mouse.x/window.innerWidth)*2 - 1;
	normalizedMouse.y = 1-(mouse.y/window.innerHeight)*2;

	raycaster.setFromCamera(normalizedMouse, camera);
	var pickedObjects = raycaster.intersectObjects(objects, true);
	if(pickedObjects.length>0){
		if(objects == worms){
			interactWithWorm(pickedObjects[0].object);
		}
		if(objects == flowers){
			interactWithFlower(pickedObjects[0].object);
		}
	}
}



function onMouseDown(event){
	mouse.x = event.clientX;
	mouse.y = event.clientY;
	if (wizardHasWorm == false){
		pickObject(worms);
	}	
	else{
		pickObject(flowers);
	}
}

var frameCount = 0;
//var framerateTextGeometry = new THREE.TextGeometry("0", {font: 'http://mrdoob.github.com/three.js/examples/fonts/helvetiker_regular.typeface.js', size: 2});
//var framerateText = new THREE.Mesh(framerateTextGeometry, timelineMaterial);
//camera.add(framerateText);
//framerateText.translateZ(-camera.near - 0.1);
function updateFramerate(){
	frameCount++;
	var time = Date.now() - startTime;
	var seconds = time / 1000;
	if (frameCount % 100 == 0) console.log(frameCount/seconds);
}

function updateHUD(){
	updateFramerate();
	if (timeLeft >= 0)
		spaceShipSprite.translateX(-0.25/timeLeft);
}

function updateFire() {
	if (castFire) {
		// add particles to arm
	//	update
	}
	if (!castFire) {
//		spaceRose.remove(particle);
	}
}
/*
function onMouseUp(event) {
	camera.parent = scene;
	camera.parent = wizard;
	camera.position.Z = (-50);
	camera.position.Y = (25);
	//camera.lookAt(wizard.position);		
}
*/

function updateShip(){
	scoutShip.translateZ(-1);
}


var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;


gameOver = false;

function update() {
	timeLeft -= 1;
	if (timeLeft <= 0) {
		gameOver = true;
	}
	requestAnimationFrame(update);
	renderer.render(scene, camera);

	if(!gameOver) {
	updateWizard();
	updateWorms();
	updateFlower();
	updateShip();
		updateHUD();
		updateWizard();
		if (castFire) {
		updateParticles();
		}
		updateWorms();
	}

}

update();