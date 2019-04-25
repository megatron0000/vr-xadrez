// jshint -W097
// jshint undef: true, unused: true
/* globals require,window,document,requestAnimationFrame,dat,location*/

"use strict";

var qs = require("query-string");
var glm = require("gl-matrix");
var Space3D = require("./space-3d.js");
var Skybox = require("./skybox.js");

var resolution = 1024;

window.onload = function () {

    var params = qs.parse(location.hash);

    var ControlsMenu = function () {
        this.seed = params.seed || generateRandomSeed();
        this.randomSeed = function () {
            this.seed = generateRandomSeed();
            renderTextures();
        };
        this.fov = parseInt(params.fov) || 80;
        this.pointStars = params.pointStars === undefined ? true :
            params.pointStars ===
            "true";
        this.stars = params.stars === undefined ? true : params.stars ===
            "true";
        this.sun = params.sun === undefined ? true : params.sun ===
            "true";
        this.nebulae = params.nebulae === undefined ? true : params.nebulae ===
            "true";
        this.resolution = parseInt(params.resolution) || 1024;
        this.animationSpeed = params.animationSpeed === undefined ? 0 :
            parseFloat(params.animationSpeed);
        this.unifiedTexture = params.unifiedTexture === undefined ?
            true :
            params.unifiedTexture === "true";
    };

    var menu = new ControlsMenu();
    var gui = new dat.GUI({
        autoPlace: false,
        width: 320,
    });
    gui.add(menu, "seed")
        .name("Seed")
        .listen()
        .onFinishChange(renderTextures);
    gui.add(menu, "randomSeed")
        .name("Randomize seed");
    gui.add(menu, "fov", 10, 150, 1)
        .name("Field of view °");
    gui.add(menu, "pointStars")
        .name("Point stars")
        .onChange(renderTextures);
    gui.add(menu, "stars")
        .name("Bright stars")
        .onChange(renderTextures);
    gui.add(menu, "sun")
        .name("Sun")
        .onChange(renderTextures);
    gui.add(menu, "nebulae")
        .name("Nebulae")
        .onChange(renderTextures);
    gui.add(menu, "resolution", [256, 512, 1024, 2048, 4096])
        .name("Resolution")
        .onChange(renderTextures);
    gui.add(menu, "unifiedTexture")
        .name("Unified texture");
    gui.add(menu, "animationSpeed", 0, 10)
        .name("Animation speed");

    document.body.appendChild(gui.domElement);
    gui.domElement.style.position = "fixed";
    gui.domElement.style.left = "16px";
    gui.domElement.style.top = "272px";

    function hideGui() {
        gui.domElement.style.display = "none";
    }

    function showGui() {
        gui.domElement.style.display = "block";
    }

    function hideUnified() {
        document.getElementById("texture-canvas")
            .style.display = "none";
    }

    function showUnified() {
        document.getElementById("texture-canvas")
            .style.display = "block";
    }

    function hideSplit() {
        document.getElementById("texture-left")
            .style.display = "none";
        document.getElementById("texture-right")
            .style.display = "none";
        document.getElementById("texture-top")
            .style.display = "none";
        document.getElementById("texture-bottom")
            .style.display = "none";
        document.getElementById("texture-front")
            .style.display = "none";
        document.getElementById("texture-back")
            .style.display = "none";
    }

    function showSplit() {
        document.getElementById("texture-left")
            .style.display = "block";
        document.getElementById("texture-right")
            .style.display = "block";
        document.getElementById("texture-top")
            .style.display = "block";
        document.getElementById("texture-bottom")
            .style.display = "block";
        document.getElementById("texture-front")
            .style.display = "block";
        document.getElementById("texture-back")
            .style.display = "block";
    }

    function setQueryString() {
        location.hash = qs.stringify({
            seed: menu.seed,
            fov: menu.fov,
            pointStars: menu.pointStars,
            stars: menu.stars,
            sun: menu.sun,
            nebulae: menu.nebulae,
            resolution: menu.resolution,
            animationSpeed: menu.animationSpeed,
        });
    }

    var hideControls = true;

    window.onkeypress = function (e) {
        if (e.charCode == 32) {
            hideControls = !hideControls;
        }
    };

    var renderCanvas = document.getElementById("render-canvas");
    renderCanvas.width = renderCanvas.clientWidth;
    renderCanvas.height = renderCanvas.clientHeight;

    var skybox = new Skybox(renderCanvas);
    var space = new Space3D(resolution);

    function renderTextures() {
        var textures = space.render({
            seed: menu.seed,
            pointStars: menu.pointStars,
            stars: menu.stars,
            sun: menu.sun,
            nebulae: menu.nebulae,
            unifiedTexture: menu.unifiedTexture,
            resolution: menu.resolution,
        });
        skybox.setTextures(textures);
        var canvas = document.getElementById("texture-canvas");
        canvas.width = 4 * menu.resolution;
        canvas.height = 3 * menu.resolution;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(textures.left, menu.resolution * 0, menu.resolution *
            1);
        ctx.drawImage(textures.right, menu.resolution * 2, menu.resolution *
            1);
        ctx.drawImage(textures.front, menu.resolution * 1, menu.resolution *
            1);
        ctx.drawImage(textures.back, menu.resolution * 3, menu.resolution *
            1);
        ctx.drawImage(textures.top, menu.resolution * 1, menu.resolution *
            0);
        ctx.drawImage(textures.bottom, menu.resolution * 1, menu.resolution *
            2);

        function drawIndividual(source, targetid) {
            var canvas = document.getElementById(targetid);
            canvas.width = canvas.height = menu.resolution;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(source, 0, 0);
        }

        drawIndividual(textures.left, "texture-left");
        drawIndividual(textures.right, "texture-right");
        drawIndividual(textures.front, "texture-front");
        drawIndividual(textures.back, "texture-back");
        drawIndividual(textures.top, "texture-top");
        drawIndividual(textures.bottom, "texture-bottom");
    }

    renderTextures();

    var tick = 0.0;

    function render(view, projection) {

        hideUnified();
        hideSplit();
        hideGui();

        if (!hideControls) {
            showGui();
            if (menu.unifiedTexture) {
                showUnified();
            } else {
                showSplit();
            }
        }

        tick += 0.0025 * menu.animationSpeed;


        renderCanvas.width = renderCanvas.clientWidth;
        renderCanvas.height = renderCanvas.clientHeight;

        var fov = (menu.fov / 360) * Math.PI * 2;

        skybox.render(view, projection);


        setQueryString();
    }


    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window
        .innerHeight,
        0.1, 1000);

    var renderer = new THREE.WebGLRenderer({
        canvas: renderCanvas
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({
        color: 0x00ff00
    });

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    var keyLight = new THREE.DirectionalLight(new THREE.Color(
        'hsl(30, 100%, 75%)'), 1.0);
    keyLight.position.set(-100, 0, 100);

    var fillLight = new THREE.DirectionalLight(new THREE.Color(
        'hsl(240, 100%, 75%)'), 0.75);
    fillLight.position.set(100, 0, 100);

    var backLight = new THREE.DirectionalLight(0xffffff, 1.0);
    backLight.position.set(100, 0, -100)
        .normalize();

    scene.add(keyLight);
    scene.add(fillLight);
    scene.add(backLight);

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setTexturePath('/static/3d-obj-loader/assets/');
    mtlLoader.setPath('/static/3d-obj-loader/assets/');
    mtlLoader.load('chess.mtl', function (materials) {

        materials.preload();

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('/static/3d-obj-loader/assets/');
        objLoader.load('chess.obj', function (object) {

            // object.children[0].visibility = false

            scene.add(object);
            object.position.y -= 0;

        });

    });

    camera.position.z = 5;

    var animate = function () {
        requestAnimationFrame(animate);


        controls.update();



        renderer.render(scene, camera);
        // render(scene.matrixWorld.elements, camera.projectionMatrix.elements)
    };

    hideUnified();
    hideSplit();
    hideGui();

    animate();

};

function generateRandomSeed() {
    return (Math.random() * 1000000000000000000)
        .toString(36);
}
