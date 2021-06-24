const _this = {};

const canvas = document.getElementsByTagName("canvas")[0];

function initCesium() {
    const viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain(),
        useDefaultRenderLoop: false
    });

    viewer.camera.flyTo({
        destination : Cesium.Cartesian3.fromDegrees(-122.4175, 37.655, 400),
        orientation : {
            heading : Cesium.Math.toRadians(0.0),
            pitch : Cesium.Math.toRadians(-15.0),
        }
    });

    _this.viewer = viewer;
    _this.base_point = cart2vec(Cesium.Cartesian3.fromDegrees(-122.4175, 37.655, 200));
}

function initBabylon() {
    const engine = new BABYLON.Engine(canvas);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = BABYLON.Color4(0, 0, 0, 0);

    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -10), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("hemispheric", new BABYLON.Vector3(1, 1, 0), scene);

    const box = BABYLON.MeshBuilder.CreateBox("box", {}, scene);

    _this.engine = engine;
    _this.scene = scene;
    _this.camera = camera;
}

function moveBabylonCamera() {
    let fov = Cesium.Math.toDegrees(_this.viewer.camera.frustum.fovy)
    _this.camera.fov = fov / 180 * Math.PI;

    let civm = _this.viewer.camera.inverseViewMatrix;
    let camera_matrix = BABYLON.Matrix.FromValues(
        civm[0 ], civm[1 ], civm[2 ], civm[3 ],
        civm[4 ], civm[5 ], civm[6 ], civm[7 ],
        civm[8 ], civm[9 ], civm[10], civm[11],
        civm[12], civm[13], civm[14], civm[15]
    );

    let scaling = BABYLON.Vector3.Zero(), rotation = BABYLON.Vector3.Zero(), transform = BABYLON.Vector3.Zero();
    camera_matrix.decompose(scaling, rotation, transform);
    let camera_pos = cart2vec(transform),
        camera_direction = cart2vec(_this.viewer.camera.direction),
        camera_up = cart2vec(_this.viewer.camera.up);

    let rotation_y = Math.atan(camera_direction.z / camera_direction.x);
    if (camera_direction.x < 0) rotation_y += Math.PI;
    rotation_y = Math.PI / 2 - rotation_y;
    let rotation_x = Math.asin(-camera_direction.y);
    let camera_up_before_rotatez = new BABYLON.Vector3(-Math.cos(rotation_y), 0, Math.sin(rotation_y));
    let rotation_z = Math.acos(camera_up.x * camera_up_before_rotatez.x + camera_up.y * camera_up_before_rotatez.y + camera_up.z * camera_up_before_rotatez.z);
    rotation_z = Math.PI / 2 - rotation_z;
    if (camera_up.y < 0) rotation_z = Math.PI - rotation_z;

    _this.camera.position.x = camera_pos.x - _this.base_point.x;
    _this.camera.position.y = camera_pos.y - _this.base_point.y;
    _this.camera.position.z = camera_pos.z - _this.base_point.z;
    _this.camera.rotation.x = rotation_x;
    _this.camera.rotation.y = rotation_y;
    _this.camera.rotation.z = rotation_z;
}

function cart2vec(cart) {
    return new BABYLON.Vector3(cart.x, cart.z, cart.y);
}

initCesium();
initBabylon();

_this.engine.runRenderLoop(() => {
    _this.scene.render();
    moveBabylonCamera();
    _this.viewer.render();
});