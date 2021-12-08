import './style.scss'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { gsap } from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as Tone from 'tone'


import cannonDebugger from 'cannon-es-debugger'

const canvas = document.querySelector('canvas.webgl')

const textureLoader = new THREE.TextureLoader()

const wallTexture = textureLoader.load('./assets/wall.png')

const floorTexture = textureLoader.load('./assets/floor.png')

const ceilingTexture = textureLoader.load('./assets/ceiling.png')

const ratTexture = textureLoader.load('./assets/rat.png')


let sOrR = document.getElementById('sOrR')

const scene = new THREE.Scene()
const world = new CANNON.World()



// Loading Bar Stuff

const loadingBarElement = document.querySelector('.loading-bar')
const loadingBarText = document.querySelector('.loading-bar-text')
const loadingManager = new THREE.LoadingManager(
  // Loaded
  () =>{
    window.setTimeout(() =>{
      gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0, delay: 1 })

      loadingBarElement.classList.add('ended')
      loadingBarElement.style.transform = ''

      loadingBarText.classList.add('fade-out')

    }, 500)
  },

  // Progress
  (itemUrl, itemsLoaded, itemsTotal) =>{
    const progressRatio = itemsLoaded / itemsTotal
    loadingBarElement.style.transform = `scaleX(${progressRatio})`

  }
)

const gtlfLoader = new GLTFLoader(loadingManager)

const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
  depthWrite: false,
  uniforms:
    {
      uAlpha: { value: 1 }
    },
  transparent: true,
  vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
  fragmentShader: `
  uniform float uAlpha;
        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `
})

const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)



const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const bakedTexture = textureLoader.load('bakeB.jpg')

bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture,
  side: THREE.DoubleSide})

//Resizing handler

window.addEventListener('resize', () =>{



  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2 ))


})



/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, .1, 2000)
camera.position.x = -15
camera.position.y = 20
camera.position.z = 55
scene.add(camera)




// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true
})
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor( 0x000000, 0 )

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

const boxGeometry = new THREE.BoxGeometry(1, 1, 1)

const playerGeometry = new THREE.BoxGeometry(.8, .8, .8)



//Physics

//World

world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set(0, -1.82, 0)

//Materials
const defaultMaterial = new CANNON.Material('default')

const snakeMaterial = new CANNON.Material('snake')


const ratCannonMaterial = new CANNON.Material('rat')

const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.0000,
    restitution: 0.0
  }
)

const snakeContactMaterial = new CANNON.ContactMaterial(
  snakeMaterial,
  defaultMaterial,
  {
    friction: 1.0000,
    restitution: 0.0
  }
)

const ratContactMaterial = new CANNON.ContactMaterial(
ratCannonMaterial,
  defaultMaterial,
  {
    friction: 1.0000,
    restitution: 0.0
  }
)
world.addContactMaterial(snakeContactMaterial)
world.addContactMaterial(ratContactMaterial)

world.addContactMaterial(defaultContactMaterial)
world.defaultContactMaterial = defaultContactMaterial

const wallMaterial =  new THREE.MeshBasicMaterial( { map: wallTexture })

const floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture })

const ceilingMaterial = new THREE.MeshBasicMaterial( { map: ceilingTexture })

const ratMaterial = new THREE.MeshBasicMaterial( { map: ratTexture })


let objectsToUpdate = []

const createBox = (width, height, depth, position) =>{

  const mesh = new THREE.Mesh(boxGeometry, [wallMaterial,  wallMaterial,  floorMaterial, ceilingMaterial, wallMaterial, wallMaterial])


  mesh.position.copy(position)
  mesh.scale.set(width, height, depth)
  scene.add(mesh)

  //Cannon.js Body
  const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))
  const body = new CANNON.Body({
    mass: 0,
    positon: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: defaultMaterial
  })
  body.position.copy(position)

  world.addBody(body)

  objectsToUpdate.push({
    mesh: mesh,
    body: body
  })

}

let ratBody, ratMesh
const createRat = (width, height, depth, position) =>{

  ratMesh = new THREE.Mesh(boxGeometry, ratMaterial)


  ratMesh.position.copy(position)
  ratMesh.scale.set(width, height, depth)
  scene.add(ratMesh)

  //Cannon.js Body
  const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))
  ratBody = new CANNON.Body({
    mass: 1,
    positon: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: ratCannonMaterial
  })
  ratBody.position.copy(position)

  world.addBody(ratBody)

  objectsToUpdate.push({
    mesh: ratMesh,
    body: ratBody
  })

}


let snake = true
let body , player
const createPlayer = (width, height, depth, position) =>{

  player = new THREE.Mesh(playerGeometry, new THREE.MeshBasicMaterial({color: 'pink'}))


  player.position.copy(position)

  scene.add(player)

  //Cannon.js Body
  const playerShape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))

  body = new CANNON.Body({
    mass: 1,
    positon: new CANNON.Vec3(0, 3, 0),
    shape: playerShape,
    material: defaultMaterial,
    name: 'player'
  })
  body.position.copy(player.position)

  world.addBody(body)

  objectsToUpdate.push({
    mesh: player,
    body: body
  })
  body.addEventListener("collide",function(e){

    if(e.contact.bi.material.name === 'snake' && snake === true || e.contact.bj.material.name === 'snake' && snake === true){
      snake = false
      music()
      music()
      console.log('bump')
      sOrR.innerHTML = 'Rat?'
      // console.log(body.quaternion)

      var localVelocity = new CANNON.Vec3(0, 0, 1);
      body.quaternion.vmult(localVelocity, body.velocity );
      body.quaternion.setFromAxisAngle(
        new CANNON.Vec3(-1, 0, 0),
        Math.PI *3
      )

    }

    if(e.contact.bi.material.name === 'rat' && snake === false || e.contact.bj.material.name === 'rat' && snake === false){
      snake = true
      music()
      music()
      // console.log('rat')
      sOrR.innerHTML = 'Snake Noodle?'

      localVelocity = new CANNON.Vec3(0, 0, 1);
      body.quaternion.vmult(localVelocity, body.velocity );
      body.quaternion.setFromAxisAngle(
        new CANNON.Vec3(-1, 0, 0),
        Math.PI *6
      )

      scene.remove(ratMesh);
      ratMesh.geometry.dispose();
      ratMesh.material.dispose();

      let x = startPos.x
      let z = startPos.z

      while(maze[x][z] !== 0 && maze[x][z] !== 0){
        console.log(x)
        console.log(z)
        x = Math.floor(Math.random() * maze.length)
       z=  Math.floor(Math.random() * maze[0].length)
       // console.log(x)

      if(  maze[x][z] ===0 && maze[x][z] === 0){
          createRat(.6, .6,.6, {x: x , y: 0, z: z })
          console.log('created')
    }
    }

} } )}


// createPlayer(.6, .6, .6, {x: 0, y: 0, z: 15})







for(let i= 0; i <= 10; i++){

  for(let j= 0; j <= 20; j++){

    createBox(1,1,1, {x: i, y: -1, z: j})
    createBox(1,1,1, {x: i, y: +1, z: j})

  }

}

// Math.floor(Math.random() *
let sceneGroup, snakesMesh, snakeBody
var maze=  [
[0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0],
[0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,1],
[0,0,1,1,1,0,0,1,1,0,0,1,0,0,0,0,1,0,0,1],
[0,0,1,0,1,0,0,1,1,0,0,1,0,0,0,0,0,0,0,1],
[0,0,1,0,1,1,0,1,0,0,0,1,1,1,0,0,1,0,0,0],
[0,0,1,1,0,1,1,0,0,0,0,0,0,1,0,0,1,1,1,1],
[0,0,0,1,1,0,1,1,1,1,1,1,0,0,0,0,0,1,0,1],
[0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
[3,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,4,0,1],


];
let startPos
for(let i= 0; i <= maze.length -1; i++){
  for(let j= 0; j <= maze[i].length-1; j++){
    if(maze[i][j] === 1){
      createBox(1,1,1, {x: i, y: 0, z: j})
    }
    if(maze[i][j] === 2){
      createPlayer(.6,.6,.6, {x: i, y: 0, z: j})
      startPos = {x: i, y: 0, z: j}
    }
    if(maze[i][j] === 4){
      createRat(.6,.6,.6, {x: i, y: 0, z: j})
    }

    if(maze[i][j] === 3){
      gtlfLoader.load(
  'snakesS2.glb',
  (gltf) => {
    // console.log(gltf.scene.position)
    //   console.log(gltf.scene.children[0].position)
    // gltf.scene.scale.set(.5,.5,.5)
    sceneGroup = gltf.scene
    sceneGroup.needsUpdate = true
    sceneGroup.position.set(i, -1, j)

    scene.add(sceneGroup)

    snakesMesh = gltf.scene.children.find((child) => {
      return child.name === 'snake'
    })
    // intersectsArr.push(room)
    snakesMesh.material = bakedMaterial

    const shape = new CANNON.Box(new CANNON.Vec3(1. * .5 , .02 * 0.5, 1. * .5))
    snakeBody = new CANNON.Body({
      mass: 1.,
      positon: new CANNON.Vec3(0, 3, 0),
      shape: shape,
      material: snakeMaterial,
      name: 'snake'
    })
    snakeBody.position.copy(sceneGroup.position)


    world.addBody(snakeBody)
    // cannonDebugger(scene, world.bodies )
    objectsToUpdate.push({
      mesh: sceneGroup,
      body: snakeBody,
      name: 'snake'
    })

    body.addEventListener("collide",function(e){
      // console.log('snake')
});

  })
}


  }




    // createBox(1,1,1, {x: Math.floor(Math.random() * i), y: +1, z: Math.floor(Math.random() * j)})



}


body.allowSleep = false

function getShootDirection() {
          const vector = new THREE.Vector3(0, 0, 1)
          vector.unproject(camera)
          const ray = new THREE.Ray(player.position, vector.sub(player.position).normalize())
          return ray.direction
        }




document.onkeydown = function(e) {
  e.preventDefault()
           switch (e.keyCode) {
               case 37:
                console.log(body)
                //Left
                // console.log(getShootDirection())
                   body.angularVelocity.y+=1
                   break;
               case 38:
               console.log(getShootDirection().z)
                    // body.angularVelocity.z+=getShootDirection().z
                    //   body.angularVelocity.y+=getShootDirection().y
                    //     body.angularVelocity.x+=getShootDirection().x
                    var localVelocity = new CANNON.Vec3(0, 0, -1);
                    body.quaternion.vmult(localVelocity, body.velocity );

                   break;
               case 39:
               //Right
                    body.angularVelocity.y-=1
                   break;
               case 40:
                 // body.velocity.z+=1
                 // body.angularVelocity.z-=getShootDirection().z
                 //   body.angularVelocity.y-=getShootDirection().y
                 //     body.angularVelocity.x-=getShootDirection().x

                  localVelocity = new CANNON.Vec3(0, 0, 1);
                 body.quaternion.vmult(localVelocity, body.velocity);

                   break;
                case 82:
                if(player){
                scene.remove(player);
                player.geometry.dispose();
                player.material.dispose();
                player = undefined
              }
                // world.remove(body)
                createPlayer(.6,.6, .6, startPos )
                  body.position.copy(startPos)
                    reset.style.visibility = 'hidden'
                 break;
           }
        }


let reset = document.getElementById('reset')



const clock = new THREE.Clock()
let oldElapsedTime = 0
const tick = () =>{
  // if ( mixer ) mixer.update( clock.getDelta() )
  const elapsedTime = clock.getElapsedTime()

  const deltaTime = elapsedTime - oldElapsedTime
  oldElapsedTime = elapsedTime
  //Update Physics World

  world.step(1/60, deltaTime, 3)

  for(const object of objectsToUpdate){
    object.mesh.position.copy(object.body.position)
    object.mesh.quaternion.copy(object.body.quaternion)
  }
  // console.log(body.position.y)

  if(body.position.y < -3 && player){
    console.log(  body.position.y)
    reset.style.visibility = 'visible'

    player.geometry.dispose();
    player.material.dispose();
    scene.remove(player);
    player = undefined
    // world.remove(body)
  }

  // Update controls
  // controls.update()
  if(body){
  camera.position.copy(body.position)
  camera.quaternion.copy(body.quaternion)
}

  // gsap.to( camera.position, {
  //
  //                   duration: .1,
  //
  //                   x: body.position.x,
  //
  //                   y: body.position.y,
  //
  //                   z: body.position.z,
  //
  //                   onUpdate: function() {
  //
  //
  //
  //                   }
  //
  //               } );
  // if(sceneGroup){
  //   sceneGroup.needsUpdate = true
  // }



  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()


let settings;

const newSettings = () => {
  settings = new Array(4).fill().map(_ => new Array(3).fill().map(_ => Math.random()));
};

newSettings();

const pal = (
  t = 0,
  a = [0.5, 0.5, 0.5],
  b = [0.5, 0.5, 0.5],
  c = [1.0, 1.0, 1.0],
  d = [0.00, 0.33, 0.67]
) => c.map(
  (cc, i) =>
    Math.cos(
      cc * t + d[i] * 6.28318
    ) * b[i] + a[i]
);

let t = 0;

function draw() {
  t += .5;
  const c = new Array(100).fill().map((_,i) => `rgb(${pal(
    ((i + t) / 100) * (Math.PI * 2),
    settings[0], settings[1], settings[2], settings[3]
  ).map(e => e * 255).join(',')})`).map((rgb,i) => `${rgb} ${i/100 * 100}% ${(i+1)/100 * 100}%`).join(',');
  document.getElementById('body').style.background = `linear-gradient(${c})`;



  requestAnimationFrame(draw)
}

draw()


/// Hacky horrible sounds bit

let seq, seq2, seq3

const notes = ['A1', 'A2', 'A3', 'A4', 'A5', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7', 'A8']

const notesLow = ['E2','F2','G2','A2','D2','E3','F3','G3','A3','D3']


const synth = new Tone.PolySynth(Tone.MembraneSynth, {
  envelope: {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.3,
    release: 1
  }
}).toDestination()

const bass = new Tone.PolySynth(Tone.DuoSynth, {
  envelope: {
    attack: 0.02,
    decay: .01,
    sustain: .1,
    release: 1
  }




}).toDestination()



const metal = new Tone.PolySynth(Tone.MetalSynth, {
  envelope: {
    attack: 0.02,
    decay: .01,
    sustain: .1,
    release: 1
  }




}).toDestination()

const am = new Tone.PolySynth(Tone.AMSynth, {
  envelope: {
    attack: 0.04,
    decay: .01,
    sustain: .1,
    release: 1
  }




}).toDestination()


const synthArr = [ synth, metal]

const synthArr2 = [ bass, am]

function music(){
  let index = 0
  // sampler.triggerAttackRelease(["A2", "E1", "G1", "B1"], 0.5);
if (Tone.Transport.state !== 'started') {
  Tone.start()
   seq = new Tone.Sequence((time, note) => {
  sampler.triggerAttackRelease(note, 1.9, time);
  // subdivisions are given as subarrays
}, [notes[Math.floor(Math.random() * notes.length)]
    , [notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)]]
    , notes[Math.floor(Math.random() * notes.length)], [notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)]]
    , notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)], [notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)]]]).start(0);



    seq2 = new Tone.Pattern((time, note) => {


      synthArr[Math.floor(Math.random() * synthArr.length)].triggerAttackRelease(note, .5, time)
    },
    [notesLow[Math.floor(Math.random() * notesLow.length)], [notesLow[Math.floor(Math.random() * notesLow.length)], notesLow[Math.floor(Math.random() * notesLow.length)], notesLow[Math.floor(Math.random() * notesLow.length)]], notesLow[Math.floor(Math.random() * notesLow.length)], [notesLow[Math.floor(Math.random() * notesLow.length)], notesLow[Math.floor(Math.random() * notesLow.length)]], notesLow[Math.floor(Math.random() * notesLow.length)], notesLow[Math.floor(Math.random() * notesLow.length)], notesLow[Math.floor(Math.random() * notesLow.length)], notesLow[Math.floor(Math.random() * notesLow.length)], notesLow[Math.floor(Math.random() * notesLow.length)], [notesLow[Math.floor(Math.random() * notesLow.length)], notesLow[Math.floor(Math.random() * notesLow.length)]]]).start(0)



    seq3 = new Tone.Pattern((time, note) => {
      synthArr2[Math.floor(Math.random() * synthArr2.length)].triggerAttackRelease(note, .05, time)
    },
    [notes[Math.floor(Math.random() * notes.length)], [notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)]], notes[Math.floor(Math.random() * notes.length)], [notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)]], notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)], [notes[Math.floor(Math.random() * notes.length)], notes[Math.floor(Math.random() * notes.length)]]]).start(0)

    seq.probability = Math.random() * 10
    seq2.probability = Math.random() * 10
    seq3.probability = Math.random() * 10


    Tone.Transport.start()
  } else {
    Tone.Transport.stop()
    seq.dispose()
    seq2.dispose()
    seq3.dispose()

  }
}

document.querySelector('#titular').addEventListener('click', (e) => {


music()

})

const sampler = new Tone.Sampler({
	urls: {
		A1: "clap.wav",
    A2: "shs_rs_piano_shot_1_2_Em.wav",
    A3: "shs_rs_piano_shot_12_2_Dm.wav",
    A4: "stabah.wav",
    A5: "old-rave-piano-stab.wav",
		B2: "kick.wav",
    C3: "003_bass4.wav",
    D4: "jvbass007_08.wav",
    E5: "rave_bass01.wav",
    F6: "rave_bass02.wav",
    G7: "rave_bass03.wav",
    A8: "rave_bass04.wav"
	},
	onload: () => {

	}
}).toDestination()
