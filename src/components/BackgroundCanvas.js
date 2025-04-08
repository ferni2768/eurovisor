import { useRef, useEffect, useState } from 'react';
import { createNoise3D } from 'simplex-noise';
import { getBackgroundHueConfig } from '../utils/backgroundHueConfig';

export default function BackgroundCanvas({ selectedYear, selectedCountry }) {
    // Configuration object for customization
    const settings = {
        bubbleCount: 25,
        baseMinBubbleSize: 200,
        baseMaxBubbleSizeRange: 400,
        baseSpeedFactor: 0.5,
        referenceWidth: 1920,
        referenceHeight: 1080,
        minLifetime: 1000,
        lifetimeRange: 2000,
        baseHue: 0,
        hueRange: 360,
        cycleBaseHue: false,
        maxOpacity: 1,
        minOpacity: 1,
        backgroundColor: 'rgba(249, 250, 251, 0)',
        blurAmount: 70,
        blurScale: 1,
        fadeInDuration: 1000,
        fadeOutDuration: 350,
    };

    const blur = useRef(100);
    const hiddenCanvasRef = useRef(null);
    const visibleCanvasRef = useRef(null);
    const noiseGenerator = useRef(null);
    const bubblesRef = useRef([]);
    const currentHueRef = useRef({ value: settings.baseHue });
    const animationRef = useRef(null);
    const [hueConfig, setHueConfig] = useState([]);
    const prevHueConfigRef = useRef([]);
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : settings.referenceWidth,
        height: typeof window !== 'undefined' ? window.innerHeight : settings.referenceHeight
    });

    // Calculate scale factor for speed based on window size
    const getSpeedScaleFactor = (w, h) => {
        const widthRatio = w / settings.referenceWidth;
        const heightRatio = h / settings.referenceHeight;
        return (widthRatio + heightRatio) / 4;
    };

    // Calculate scale factor for bubble size based on window width
    const getSizeScaleFactor = (w) => w / settings.referenceWidth;

    // Initialize noise generator and hue config on mount
    useEffect(() => {
        noiseGenerator.current = createNoise3D();
        const initialHueConfig = getBackgroundHueConfig({ selectedYear, selectedCountry });
        setHueConfig(initialHueConfig);
        prevHueConfigRef.current = initialHueConfig;
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []); // run once

    // Update hue configuration when filters change
    useEffect(() => {
        const newHueConfig = getBackgroundHueConfig({ selectedYear, selectedCountry });
        if (JSON.stringify(newHueConfig) !== JSON.stringify(hueConfig)) {
            prevHueConfigRef.current = hueConfig;
            setHueConfig(newHueConfig);
        }
    }, [selectedYear, selectedCountry, hueConfig]);

    // Create new bubbles with current settings, distributing hues proportionally
    const createNewBubbles = (speedScale, sizeScale) => {
        let hueIndexCounter = 0;
        return Array.from({ length: settings.bubbleCount }, () => {
            const hueConfigIndex = hueIndexCounter % hueConfig.length;
            hueIndexCounter++;
            return new Circle(true, hueConfigIndex, speedScale, sizeScale);
        });
    };

    // Circle class to manage individual bubble properties and behavior
    class Circle {
        constructor(isNew = false, hueConfigIndex = 0, speedScale = 1, sizeScale = 1) {
            this.isNew = isNew;
            this.hueConfigIndex = hueConfigIndex;
            this.opacity = isNew ? 0 : settings.maxOpacity;
            this.transitionState = isNew ? 'fade-in' : 'stable';
            this.transitionProgress = 0;
            this.speedScale = speedScale;
            this.sizeScale = sizeScale;
            this.reset();
        }

        reset(preserveOpacity = false) {
            const canvas = hiddenCanvasRef.current;
            if (!canvas) return;

            // Generate random position and assign to the bubble
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            this.x = x;
            this.y = y;

            const currentConfig = hueConfig[this.hueConfigIndex % hueConfig.length] || [0, 360];
            const baseHue = currentConfig[0];
            const hueRange = currentConfig[1];

            // Generate noise for hue
            const noise = noiseGenerator.current(
                x * 0.005,
                y * 0.005,
                currentHueRef.current.value * 0.01
            );

            // Normalize noise from [-1, 1] to [0, 1] and calculate hue
            this.hue = baseHue + ((noise + 1) / 2) * hueRange;
            if (hueRange < 360) this.hue = this.hue % 360;

            // Calculate and assign radius scaled by the size scale factor
            this.radius = (settings.baseMinBubbleSize + Math.random() * settings.baseMaxBubbleSizeRange) * this.sizeScale;

            // Define movement direction and speed
            const direction = Math.random() * Math.PI * 2;
            const speed = (Math.random() + 0.1) * settings.baseSpeedFactor * this.speedScale;
            this.vx = Math.cos(direction) * speed;
            this.vy = Math.sin(direction) * speed;

            // Reset lifetime
            this.life = 0;
            this.totalLife = settings.minLifetime + Math.random() * settings.lifetimeRange;

            // Reset opacity and transition state if not preserving opacity
            if (!preserveOpacity) {
                this.opacity = this.isNew ? 0 : settings.maxOpacity;
                this.transitionState = this.isNew ? 'fade-in' : 'stable';
                this.transitionProgress = 0;
            }
        }

        move(deltaTime) {
            this.x += this.vx;
            this.y += this.vy;
            this.life++;

            // If bubble is off screen or has exceeded its lifetime, start fade-out
            if ((this.isOffScreen() || this.life > this.totalLife) && this.transitionState === 'stable') {
                this.transitionState = 'fade-out';
                this.transitionProgress = 0;
            }

            // Handle opacity transitions
            if (this.transitionState === 'fade-in') {
                this.transitionProgress += deltaTime;
                const progress = Math.min(this.transitionProgress / settings.fadeInDuration, 1);
                this.opacity = progress * settings.maxOpacity;
                if (progress >= 1) {
                    this.transitionState = 'stable';
                    this.opacity = settings.maxOpacity;
                }
            } else if (this.transitionState === 'fade-out') {
                this.transitionProgress += deltaTime;
                const progress = Math.min(this.transitionProgress / settings.fadeOutDuration, 1);
                this.opacity = (1 - progress) * settings.maxOpacity;
                if (progress >= 1) {
                    this.reset(true);
                }
            }

            return false;
        }

        isOffScreen() {
            const canvas = hiddenCanvasRef.current;
            if (!canvas) return true;
            return (
                this.x < -this.radius ||
                this.x > canvas.width + this.radius ||
                this.y < -this.radius ||
                this.y > canvas.height + this.radius
            );
        }

        render(ctx) {
            const fade = Math.sin((this.life / this.totalLife) * Math.PI);
            const baseAlpha = settings.minOpacity + fade * (settings.maxOpacity - settings.minOpacity);
            const alpha = baseAlpha * this.opacity;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 100%, 10%, ${alpha})`;
            ctx.fill();
        }
    }

    // Main canvas setup and animation
    useEffect(() => {
        if (!hiddenCanvasRef.current || !visibleCanvasRef.current) return;

        const hiddenCanvas = hiddenCanvasRef.current;
        const visibleCanvas = visibleCanvasRef.current;
        const hiddenCtx = hiddenCanvas.getContext('2d');
        const visibleCtx = visibleCanvas.getContext('2d');

        // Set canvas sizes
        hiddenCanvas.width = windowSize.width;
        hiddenCanvas.height = windowSize.height;
        visibleCanvas.width = windowSize.width;
        visibleCanvas.height = windowSize.height;

        // Compute scale factors
        const speedScale = getSpeedScaleFactor(windowSize.width, windowSize.height);
        const sizeScale = getSizeScaleFactor(windowSize.width);

        if (bubblesRef.current.length === 0 && hueConfig.length > 0) {
            bubblesRef.current = createNewBubbles(speedScale, sizeScale);
        }

        const adjustCanvas = () => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            const isSignificantResize =
                Math.abs(windowSize.width - windowWidth) > 10 ||
                Math.abs(windowSize.height - windowHeight) > 100;

            if (isSignificantResize) {
                setWindowSize({ width: windowWidth, height: windowHeight });

                hiddenCanvas.width = windowWidth;
                hiddenCanvas.height = windowHeight;
                visibleCanvas.width = windowWidth;
                visibleCanvas.height = windowHeight;

                const newSpeedScale = getSpeedScaleFactor(windowWidth, windowHeight);
                const newSizeScale = getSizeScaleFactor(windowWidth);

                // Reset existing bubbles with updated scale factors
                bubblesRef.current.forEach(bubble => {
                    bubble.speedScale = newSpeedScale;
                    bubble.sizeScale = newSizeScale;
                    bubble.reset();
                });
            }
        };

        adjustCanvas();

        window.addEventListener('resize', adjustCanvas);
        if (window.screen && window.screen.orientation) {
            window.screen.orientation.addEventListener('change', adjustCanvas);
        } else if (window.orientation !== undefined) {
            window.addEventListener('orientationchange', adjustCanvas);
        }
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', adjustCanvas);
        }

        let lastTime = 0;
        const renderFrame = (timestamp) => {
            const deltaTime = lastTime ? timestamp - lastTime : 16;
            lastTime = timestamp;

            if (settings.cycleBaseHue) {
                currentHueRef.current.value += settings.baseSpeedFactor;
            }

            hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
            visibleCtx.fillStyle = settings.backgroundColor;
            visibleCtx.fillRect(0, 0, visibleCanvas.width, visibleCanvas.height);

            // Update and render bubbles
            bubblesRef.current.forEach(bubble => bubble.move(deltaTime));
            bubblesRef.current.forEach(bubble => bubble.render(hiddenCtx));

            // Compute effective blur based on screen size and blur scale factor
            blur.current = Math.max(settings.blurAmount * (1 + ((windowSize.width / settings.referenceWidth) - 1) * settings.blurScale), 80);
            visibleCtx.drawImage(hiddenCanvas, 0, 0);

            animationRef.current = requestAnimationFrame(renderFrame);
        };

        animationRef.current = requestAnimationFrame(renderFrame);

        return () => {
            window.removeEventListener('resize', adjustCanvas);
            if (window.screen && window.screen.orientation) {
                window.screen.orientation.removeEventListener('change', adjustCanvas);
            } else if (window.orientation !== undefined) {
                window.removeEventListener('orientationchange', adjustCanvas);
            }
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', adjustCanvas);
            }
            cancelAnimationFrame(animationRef.current);
        };
    }, [hueConfig, windowSize]);

    // Handle hue configuration changes - fade out old bubbles and add new ones
    useEffect(() => {
        if (hueConfig.length === 0) return;
        bubblesRef.current.forEach(bubble => {
            bubble.transitionState = 'fade-out';
            bubble.transitionProgress = 0;
        });
        const speedScale = getSpeedScaleFactor(windowSize.width, windowSize.height);
        const sizeScale = getSizeScaleFactor(windowSize.width);
        const newBubbles = createNewBubbles(speedScale, sizeScale);
        bubblesRef.current = [...bubblesRef.current, ...newBubbles];
    }, [hueConfig]);


    return (
        <>
            <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
            <canvas
                ref={visibleCanvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 1,
                    filter: `blur(${blur.current}px)`,
                }}
            />
        </>
    );
}