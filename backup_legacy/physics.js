/**
 * StreamFlow Chaos Engine (Matter.js)
 * Handles "Flow State" Physics
 */

class PhysicsEngine {
    constructor() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.runner = Matter.Runner.create();

        // Zero gravity for space effect
        this.engine.world.gravity.y = 0;
        this.engine.world.gravity.x = 0;

        this.bodies = new Map(); // DOM Element -> Matter Body
        this.isActive = false;

        this.initRenderer();
        this.addWalls();
        this.setupMouse();

        window.addEventListener('resize', () => this.handleResize());
    }

    initRenderer() {
        const canvas = document.getElementById('physics-canvas');
        this.render = Matter.Render.create({
            canvas: canvas,
            engine: this.engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false, // Debug off
                background: 'transparent'
            }
        });
    }

    addWalls() {
        const t = 50; // Thickness
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.walls = [
            Matter.Bodies.rectangle(w / 2, -t / 2, w + 200, t, { isStatic: true }),
            Matter.Bodies.rectangle(w / 2, h + t / 2, w + 200, t, { isStatic: true }),
            Matter.Bodies.rectangle(-t / 2, h / 2, t, h + 200, { isStatic: true }),
            Matter.Bodies.rectangle(w + t / 2, h / 2, t, h + 200, { isStatic: true })
        ];
        Matter.Composite.add(this.world, this.walls);
    }

    toggle() {
        this.isActive ? this.stop() : this.start();
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        document.body.classList.add('flow-active');

        // Convert UI to Bodies
        const elements = document.querySelectorAll('.physics-element');
        elements.forEach(el => this.createBody(el));

        // Start Sim
        Matter.Runner.run(this.runner, this.engine);
        Matter.Render.run(this.render);

        this.loop = requestAnimationFrame(() => this.update());
    }

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        document.body.classList.remove('flow-active');

        // Stop Sim
        Matter.Runner.stop(this.runner);
        Matter.Render.stop(this.render);
        cancelAnimationFrame(this.loop);

        // Reset DOM
        this.bodies.forEach((body, el) => {
            Matter.Composite.remove(this.world, body);
            // Styles for smooth return handled by CSS .reset-anim
            el.style.transform = '';
            el.style.left = '';
            el.style.top = '';
            el.classList.add('reset-anim');
            setTimeout(() => el.classList.remove('reset-anim'), 800);
        });
        this.bodies.clear();
    }

    createBody(el) {
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        const body = Matter.Bodies.rectangle(x, y, rect.width, rect.height, {
            frictionAir: 0.05,
            restitution: 0.8
        });

        // Add random slight velocity
        Matter.Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 5,
            y: (Math.random() - 0.5) * 5
        });

        this.bodies.set(el, body);
        Matter.Composite.add(this.world, body);
    }

    update() {
        if (!this.isActive) return;

        // Sync DOM with Physics
        this.bodies.forEach((body, el) => {
            const x = body.position.x - el.offsetWidth / 2;
            const y = body.position.y - el.offsetHeight / 2;
            const angle = body.angle;

            el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
            // Note: We use visual transform while keeping position: fixed logic in CSS
            el.style.left = '0';
            el.style.top = '0';
        });

        this.loop = requestAnimationFrame(() => this.update());
    }

    setupMouse() {
        const mouse = Matter.Mouse.create(this.render.canvas);
        const mc = Matter.MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Matter.Composite.add(this.world, mc);

        // Allow scrolling normally when not active? 
        // Matter.js captures events on canvas, which overlays everything.
        // CSS pointer-events: none on canvas solves this when inactive used in style.css
    }

    handleResize() {
        this.render.canvas.width = window.innerWidth;
        this.render.canvas.height = window.innerHeight;
        // In real app, update walls too
    }
}

window.physics = new PhysicsEngine();
