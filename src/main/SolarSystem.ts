import { Tools, Axis, Space, PointLight, GizmoManager, Light, Scene, Engine, FreeCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Texture, ArcRotateCamera, CubeTexture, CSG, UniversalCamera, PBRMaterial, Color3, GlowLayer, Gizmo, LightGizmo, ShadowGenerator, AbstractMesh, Constants, Mesh, CSG2} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

interface PlanetData {
    name: string;
    radius: number;
    distance: number;
    realDistance: number;
    rotationSpeed: number;
    orbitSpeed: number;
    axialTilt: number;
    initialAngle: number;
}

export class SolarSystem {
    planets: PlanetData[] = [
        {
            name: "Mercury",
            radius: 0.03,
            distance: 15,
            realDistance: 580,
            rotationSpeed: 2.60,
            orbitSpeed: 1.745,
            axialTilt: 0.034,
            initialAngle: 0.476
        },
        {
            name: "Venus",
            radius: 0.075,
            distance: 30,
            realDistance: 1080,
            rotationSpeed: -0.628,
            orbitSpeed: 0.681,
            axialTilt: 177.4,
            initialAngle: 0.020
        },
        {
            name: "Earth",
            radius: 0.08,
            distance: 45,
            realDistance: 1500,
            rotationSpeed: 152.7,
            orbitSpeed: 0.419,
            axialTilt: 23.44,
            initialAngle: 3.665
        },
        {
            name: "Mars",
            radius: 0.042,
            distance: 60,
            realDistance: 2280,
            rotationSpeed: 	148.2,
            orbitSpeed: 0.223,
            axialTilt: 25.19,
            initialAngle: 2.356
        },
        {
            name: "Jupiter",
            radius: 0.89,
            distance: 75,
            realDistance: 7780,
            rotationSpeed: 372,
            orbitSpeed: 0.0353,
            axialTilt: 3.13,
            initialAngle: 1.047
        },
        {
            name: "Saturn",
            radius: 0.75,
            distance: 90,
            realDistance: 14290,
            rotationSpeed: 346,
            orbitSpeed: 0.0142,
            axialTilt: 26.73,
            initialAngle: 5.759
        },
        {
            name: "Uranus",
            radius: 0.32,
            distance: 105,
            realDistance: 28750,
            rotationSpeed: -212,
            orbitSpeed: 0.0050,
            axialTilt: 97.77,
            initialAngle: 0.476
        },
        {
            name: "Neptune",
            radius: 0.31,
            distance: 120,
            realDistance: 44970,
            rotationSpeed: 228.3,
            orbitSpeed: 0.00254,
            axialTilt: 28.32,
            initialAngle: 0.542
        },
    ];

    scene: Scene; 
    engine: Engine;
    models: AbstractMesh[] = [];
    orbits: AbstractMesh[] = [];
    sun!: AbstractMesh;
    camera!: ArcRotateCamera;

    public isPaused = false;
    public simulationSpeed = 1000000;

    constructor(private canvas:HTMLCanvasElement) {
        this.engine = new Engine(this.canvas, true);
        this.scene = this.CreateScene();

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    CreateScene():Scene {
        const scene = new Scene(this.engine);

        this.camera = new ArcRotateCamera('Camera', 50, 5, 100, new Vector3(0, 3, 10,), this.scene);

        this.camera.setTarget(Vector3.Zero());
        this.camera.attachControl();
        this.camera.panningSensibility = 100;
        this.camera.minZ = 0.001;
        this.camera.wheelPrecision = 1000;

        this.canvas.addEventListener('wheel', (event) => {
            event.preventDefault();

            const minRadius = this.camera.lowerRadiusLimit || 0.1;
            const maxRadius = this.camera.upperRadiusLimit || 1000;

            let radius = this.camera.radius;

            const zoomSpeedFactor = Math.max(radius / 10, 0.05);

            const zoomDelta = event.deltaY * 0.005 * zoomSpeedFactor;

            radius += zoomDelta;

            radius = Math.min(Math.max(radius, minRadius), maxRadius);

            this.camera.radius = radius;
        }, { passive: false });

        const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), this.scene);
        hemiLight.intensity = 0;

        const envTex = CubeTexture.CreateFromPrefilteredData('/HDRIs/starmap.env', scene);
        scene.environmentTexture = envTex;
        scene.createDefaultSkybox(envTex, true);
        scene.environmentIntensity = 5;

        this.sun = MeshBuilder.CreateSphere('sun', { diameter:8.65 }, this.scene);
        this.sun.position = new Vector3(0, 0, 0);
        this.sun.material = this.CreateSunMaterial();

        this.planets.forEach(planet => {
            const mesh = MeshBuilder.CreateSphere(planet.name, {diameter: planet.radius * 10}, this.scene);
            mesh.material = this.CreatePlanetMaterial(planet.name);
            this.models.push(mesh);

            const orbitCircle = MeshBuilder.CreateTorus('orbit', {
                diameter: planet.distance * 2,
                thickness: .007,
                tessellation: 128
            });
            orbitCircle.material = this.CreateOrbitesMaterial();
            this.orbits.push(orbitCircle);
        })

        scene.registerBeforeRender(() => {
            if (!this.isPaused) {
                const deltaTime = this.scene.getEngine().getDeltaTime() / this.simulationSpeed;

                this.planets.forEach((planet, index) => {
                    const mesh = this.models[index];

                    mesh.rotation.y += planet.rotationSpeed * deltaTime;

                    planet.initialAngle += deltaTime * planet.orbitSpeed;

                    mesh.position.x = Math.cos(planet.initialAngle) * planet.distance;
                    mesh.position.z = Math.sin(planet.initialAngle) * planet.distance;

                    mesh.rotation.x = Tools.ToRadians(planet.axialTilt);
                })
            }
        });
        
        const disc = MeshBuilder.CreateCylinder("disc", {tessellation: 64, arc: 1, diameter: 16, height: 0.01});
        const hole = MeshBuilder.CreateCylinder("hole", {tessellation: 64, arc: 1, diameter: 8, height: 0.01});

        const discCSG = CSG.FromMesh(disc);
        const holeCSG = CSG.FromMesh(hole);

        const finalCSG = discCSG.subtract(holeCSG);

        const finalMesh = finalCSG.toMesh('ring', null, this.scene);
        finalMesh.parent = this.models.find(m => m.name.toLowerCase() === 'saturn') ?? null;

        const ringMaterial = new PBRMaterial("ringMaterial", scene);
        ringMaterial.albedoTexture = new Texture("/textures/saturn/small_ring_tex.png", scene); // текстура с альфой
        ringMaterial.opacityTexture = ringMaterial.albedoTexture;
        ringMaterial.emissiveColor = Color3.White();
        ringMaterial.emissiveIntensity = .01;
        ringMaterial.alphaMode = 2; // Alpha blending
        ringMaterial.backFaceCulling = false;
        ringMaterial.useAlphaFromAlbedoTexture = true;
        ringMaterial.alpha = 0.9;
        ringMaterial.roughness = 0.95;

        finalMesh.material = ringMaterial;

        disc.dispose();
        hole.dispose();

        this.models.push(finalMesh);



        const moon = MeshBuilder.CreateSphere('moon', {diameter: 0.2}, this.scene);
        const moonMaterial = new PBRMaterial('moon', this.scene);
        moonMaterial.albedoTexture = new Texture("/textures/earth/moon.jpg", scene);
        moonMaterial.roughness = 0.95;
        moonMaterial.metallic = 0;
        // moonMaterial.usePhysicalLightFalloff = false;
        // moonMaterial.disableLighting = false;

        moon.material = moonMaterial;
        moon.parent = this.models.find(m => m.name.toLowerCase() === 'earth') ?? null;
        moon.position = new Vector3(2, 2, 2);

        this.CreateSunLight();

        return scene;
    }

    CreateOrbitesMaterial(): StandardMaterial {
        const unlitMaterial = new StandardMaterial("unlitMaterial", this.scene);
        unlitMaterial.diffuseColor = new Color3(1, 1, 1);  // Жёлто-оранжевый
        unlitMaterial.disableLighting = true;               // 🔥 Отключаем влияние света
        unlitMaterial.emissiveColor = unlitMaterial.diffuseColor.scale(0.5); // Подсветка самим цветом

        return unlitMaterial;
    }   

    CreateSunMaterial(): PBRMaterial {
        const pbr = new PBRMaterial('pbr', this.scene);

        pbr.albedoTexture = new Texture('/textures/sun/sun.jpg');

        pbr.emissiveColor = new Color3(1, 1, 1);

        pbr.emissiveTexture = new Texture('/textures/sun/sun.jpg');

        pbr.emissiveIntensity = 1;

        const glowLayer = new GlowLayer('glow', this.scene);

        glowLayer.intensity = 1;

        return pbr;
    }

    CreatePlanetMaterial(planetName: string): PBRMaterial {
        const pbr = new PBRMaterial('pbr', this.scene);

        pbr.albedoTexture = new Texture(`/textures/${planetName}/${planetName}Diffuse.jpg`);
        (pbr.albedoTexture as Texture).vScale = -1;
        pbr.bumpTexture = new Texture(`/textures/${planetName}/${planetName}NH.jpg`);
        pbr.invertNormalMapX = true;
        pbr.invertNormalMapY = true;
        pbr.bumpTexture.hasAlpha = true;
        pbr.useParallax = true;
        pbr.parallaxScaleBias = 0.01;

        pbr.useAmbientOcclusionFromMetallicTextureRed = true;
        pbr.useRoughnessFromMetallicTextureGreen = true;

        pbr.metallicTexture = new Texture(`/textures/${planetName}/${planetName}AR.jpg`);

        pbr.metallic = 0;


        return pbr;
    }

    CreateSunLight(): PointLight {
        const pointLight = new PointLight('pointlight', new Vector3(0, 0, 0), this.scene);
        pointLight.intensity = 2000;

        pointLight.shadowEnabled = true;
        pointLight.shadowMinZ = 1;
        pointLight.shadowMaxZ = 2;

        const shadowGen = new ShadowGenerator(512, pointLight);

        shadowGen.useBlurCloseExponentialShadowMap = true;

        this.models.map(mesh => {
            mesh.receiveShadows = true;
            shadowGen.addShadowCaster(mesh);
        })

        return pointLight;
    }

    public toggleOrbits(status: boolean) {
        this.orbits.forEach(orbit => {
            orbit.isVisible = status;
        });
    }

    public pauseSimulation() {
        this.isPaused = true;
    }

    public resumeSimulation() {
        this.isPaused = false;
    }

    public changeSimulationSpeed(speed: number) {
        this.simulationSpeed = 1010000 - speed;
    }

    public changeCameraTarget(targetName: string) {
        if (targetName === 'sun') {
            this.camera.setTarget(this.sun);
            return;
        }
        if (targetName === 'free') {
            const currentTarget = this.camera.getTarget().clone();
            currentTarget.x += 0.0001;
            this.camera.setTarget(currentTarget);
            return;
        }

        const mesh = this.models.find(m => m.name.toLowerCase() === targetName);
        if (mesh) {
            this.camera.setTarget(mesh.getAbsolutePosition());
        }
    }
}