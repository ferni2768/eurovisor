import { useRef, useEffect } from 'react';
import { createNoise3D } from 'simplex-noise';

export default function BackgroundCanvas() {
    // Configuration object for customization
    const settings = {
        bubbleCount: 70,
        minBubbleSize: 50,
        maxBubbleSizeRange: 50,
        speedFactor: 0.5,
        minLifetime: 1000,
        lifetimeRange: 2000,
        baseHue: 0,
        hueRange: 360,
        cycleBaseHue: false,
        maxOpacity: 0.3,
        minOpacity: 0.2,
        backgroundColor: 'rgba(249, 250, 251, 0)',
        blurAmount: 150,
    };

    const hiddenCanvasRef = useRef(null);
    const visibleCanvasRef = useRef(null);

    useEffect(() => {
        const hiddenCanvas = hiddenCanvasRef.current;
        const visibleCanvas = visibleCanvasRef.current;
        const hiddenCtx = hiddenCanvas.getContext('2d');
        const visibleCtx = visibleCanvas.getContext('2d');
        const noiseGenerator = createNoise3D();
        const currentHue = { value: settings.baseHue };

        // Circle class to manage individual bubble properties and behavior
        class Circle {
            constructor() {
                this.reset();
            }

            reset() {
                const x = Math.random() * hiddenCanvas.width;
                const y = Math.random() * hiddenCanvas.height;
                const noise = noiseGenerator(x * 0.005, y * 0.005, currentHue.value * 0.01);
                this.x = x;
                this.y = y;
                this.hue = currentHue.value + noise * settings.hueRange;
                this.radius = settings.minBubbleSize + Math.random() * settings.maxBubbleSizeRange;
                const direction = Math.random() * Math.PI * 2;
                const speed = (Math.random() + 0.1) * settings.speedFactor;
                this.vx = Math.cos(direction) * speed;
                this.vy = Math.sin(direction) * speed;
                this.life = 0;
                this.totalLife = settings.minLifetime + Math.random() * settings.lifetimeRange;
            }

            move() {
                this.x += this.vx;
                this.y += this.vy;
                this.life++;
                if (this.isOffScreen() || this.life > this.totalLife) {
                    this.reset();
                }
            }

            isOffScreen() {
                return (
                    this.x < -this.radius ||
                    this.x > hiddenCanvas.width + this.radius ||
                    this.y < -this.radius ||
                    this.y > hiddenCanvas.height + this.radius
                );
            }

            render() {
                const fade = Math.sin((this.life / this.totalLife) * Math.PI);
                const alpha = settings.minOpacity + fade * (settings.maxOpacity - settings.minOpacity);
                hiddenCtx.beginPath();
                hiddenCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                hiddenCtx.fillStyle = `hsla(${this.hue}, 100%, 10%, 1)`;
                hiddenCtx.fill();
            }
        }

        // Initialize bubbles
        let bubbles = Array.from({ length: settings.bubbleCount }, () => new Circle());

        // Resize handler to adjust canvas dimensions and reinitialize bubbles
        const adjustCanvas = () => {
            hiddenCanvas.width = window.innerWidth;
            hiddenCanvas.height = window.innerHeight;
            visibleCanvas.width = window.innerWidth;
            visibleCanvas.height = window.innerHeight;
            bubbles = Array.from({ length: settings.bubbleCount }, () => new Circle());
        };

        adjustCanvas();
        window.addEventListener('resize', adjustCanvas);

        // Animation loop
        const renderFrame = () => {
            if (settings.cycleBaseHue) {
                currentHue.value += settings.speedFactor;
            }

            bubbles.forEach(bubble => bubble.move());

            hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
            visibleCtx.fillStyle = settings.backgroundColor;
            visibleCtx.fillRect(0, 0, visibleCanvas.width, visibleCanvas.height);

            bubbles.forEach(bubble => bubble.render());

            visibleCtx.filter = `blur(${settings.blurAmount}px)`;
            visibleCtx.drawImage(hiddenCanvas, 0, 0);
            visibleCtx.filter = 'none';

            requestAnimationFrame(renderFrame);
        };

        renderFrame();

        // Cleanup resize listener
        return () => window.removeEventListener('resize', adjustCanvas);
    }, []);


    return (
        <>
            <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
            <canvas
                ref={visibleCanvasRef}
                style={{ position: 'fixed', top: 0, left: 0, height: '120vh', opacity: 1, filter: 'blur(250px)' }}
            />
        </>
    );
}