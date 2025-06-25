import { useRef, useEffect, useState, useCallback } from 'react';
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
        minOpacity: 0.6,
        maxOpacity: 0.9,
        backgroundColor: 'rgba(249, 250, 251, 0)',
        blurAmount: 65,
        blurScale: 2,
        fadeInDuration: 1000,
        fadeOutDuration: 350,
    };

    // Render resolution
    const FIXED_WIDTH = 40;
    const FIXED_HEIGHT = 22;

    // Refs and state
    const blur = useRef(100);
    const hiddenCanvasRef = useRef(null);
    const visibleCanvasRef = useRef(null);
    const noiseGenerator = useRef(null);
    const bubblesRef = useRef([]);
    const currentHueRef = useRef({ value: settings.baseHue });
    const animationRef = useRef(null);
    const [hueConfig, setHueConfig] = useState([]);
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const prevHueConfigRef = useRef([]);
    const prevWindowSizeRef = useRef({ width: 0, height: 0 });

    // Scale factor functions based on the fixed resolution
    const getSpeedScaleFactor = useCallback(() => {
        const widthRatio = FIXED_WIDTH / settings.referenceWidth;
        const heightRatio = FIXED_HEIGHT / settings.referenceHeight;
        return (widthRatio + heightRatio) / 4;
    }, [settings.referenceWidth, settings.referenceHeight]);

    // Calculate size scale factor based on the fixed resolution
    const getSizeScaleFactor = useCallback(() =>
        FIXED_WIDTH / settings.referenceWidth,
        [settings.referenceWidth]
    );

    // Initialize noise generator and hue configuration on mount
    useEffect(() => {
        noiseGenerator.current = createNoise3D();
        const initialHueConfig = getBackgroundHueConfig({ selectedYear, selectedCountry });
        setHueConfig(initialHueConfig);
        prevHueConfigRef.current = initialHueConfig;
        prevWindowSizeRef.current = { width: window.innerWidth, height: window.innerHeight };
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [selectedYear, selectedCountry]);

    // Update hue configuration when filters change
    useEffect(() => {
        const newHueConfig = getBackgroundHueConfig({ selectedYear, selectedCountry });
        if (JSON.stringify(newHueConfig) !== JSON.stringify(hueConfig)) {
            prevHueConfigRef.current = hueConfig;
            setHueConfig(newHueConfig);
        }
    }, [selectedYear, selectedCountry, hueConfig]);

    // Create new bubbles with current settings, distributing hues proportionally
    const createNewBubbles = useCallback((speedScale, sizeScale) => {
        let hueIndexCounter = 0;
        return Array.from({ length: settings.bubbleCount }, () => {
            const hueConfigIndex = hueIndexCounter % hueConfig.length;
            hueIndexCounter++;
            return new Circle(true, hueConfigIndex, speedScale, sizeScale);
        });
        // esnlint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.bubbleCount, hueConfig]);

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

            // Generate random position on the fixed resolution canvas
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

            // Calculate radius scaled by the size scale factor
            this.radius = (settings.baseMinBubbleSize + Math.random() * settings.baseMaxBubbleSizeRange) * this.sizeScale;

            // Set movement direction and speed
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
            // Only update movement if the bubble is still within its lifetime
            // Once its lifetime is exceeded, freeze the position
            if (this.life < this.totalLife) {
                this.x += this.vx;
                this.y += this.vy;
                this.life++;
                // When lifetime is exceeded, freeze movement by setting velocity to zero
                if (this.life >= this.totalLife) {
                    this.vx = 0;
                    this.vy = 0;
                }
            }

            // Only trigger fade-out on off-screen condition if the bubble is still active
            if (this.isOffScreen() && this.life < this.totalLife && this.transitionState === 'stable') {
                this.transitionState = 'fade-out';
                this.transitionProgress = 0;
            }

            // Handle transitions; fade-in is allowed until complete.
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
                    // For bubbles that are fading out due to going off screen,
                    // we reset them. (This condition applies only to bubbles still active)
                    this.reset(true);
                }
            }
            // Otherwise, if the bubble's lifetime is over, it remains static with the same opacity
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
            ctx.fillStyle = `hsla(${this.hue}, 100%, 23%, ${alpha})`;
            ctx.fill();
        }
    }

    // Main canvas setup and animation effect
    useEffect(() => {
        if (!hiddenCanvasRef.current || !visibleCanvasRef.current) return;

        const hiddenCanvas = hiddenCanvasRef.current;
        const visibleCanvas = visibleCanvasRef.current;
        const hiddenCtx = hiddenCanvas.getContext('2d');
        const visibleCtx = visibleCanvas.getContext('2d');

        // Set the hidden canvas to a fixed resolution
        hiddenCanvas.width = FIXED_WIDTH;
        hiddenCanvas.height = FIXED_HEIGHT;

        // Set the visible canvas to fill the window (responsive sizing)
        const setVisibleCanvasSize = () => {
            // Check if we're on a small screen and update state
            const smallScreen = window.innerWidth <= 600 || window.innerHeight <= 600;
            setIsSmallScreen(smallScreen);

            if (smallScreen) {
                // Add padding for small screens to eliminate vignette
                const blurPadding = Math.max(blur.current * 0.8, 60);
                visibleCanvas.width = window.innerWidth + (blurPadding * 2);
                visibleCanvas.height = window.innerHeight + (blurPadding * 2);
            } else {
                // Exact window size for large screens to maintain full vignette
                visibleCanvas.width = window.innerWidth;
                visibleCanvas.height = window.innerHeight;
            }
        };
        setVisibleCanvasSize();

        // Compute scale factors based on the fixed resolution
        const speedScale = getSpeedScaleFactor();
        const sizeScale = getSizeScaleFactor();

        if (bubblesRef.current.length === 0 && hueConfig.length > 0) {
            bubblesRef.current = createNewBubbles(speedScale, sizeScale);
        }

        // Function to check for significant resize and update blur
        const checkSignificantResize = () => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            const isSignificantResize =
                Math.abs(prevWindowSizeRef.current.width - windowWidth) > 10 ||
                Math.abs(prevWindowSizeRef.current.height - windowHeight) > 100;

            if (isSignificantResize) {
                prevWindowSizeRef.current = { width: windowWidth, height: windowHeight };

                // Recalculate blur based on the greater of width or height
                const widthRatio = windowWidth / settings.referenceWidth;
                const heightRatio = (windowHeight * 1.5) / (settings.referenceHeight * 1.5);
                const maxRatio = Math.max(widthRatio, heightRatio);

                blur.current = Math.max(settings.blurAmount * (1 + (maxRatio - 1) * settings.blurScale), settings.blurAmount);

                // Update the canvas style to reflect the new blur value
                if (visibleCanvas) {
                    visibleCanvas.style.filter = `blur(${blur.current}px)`;
                }
            }
        };

        // Resize visible canvas on window resize and orientation change
        const adjustVisibleCanvas = () => {
            setVisibleCanvasSize();
            checkSignificantResize();
        };

        window.addEventListener('resize', adjustVisibleCanvas);
        if (window.screen && window.screen.orientation) {
            window.screen.orientation.addEventListener('change', adjustVisibleCanvas);
        } else if (window.orientation !== undefined) {
            window.addEventListener('orientationchange', adjustVisibleCanvas);
        }
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', adjustVisibleCanvas);
        }

        let lastTime = 0;
        const renderFrame = (timestamp) => {
            const deltaTime = lastTime ? timestamp - lastTime : 16;
            lastTime = timestamp;

            // Optionally update the base hue if cycling is enabled
            if (settings.cycleBaseHue) {
                currentHueRef.current.value += settings.baseSpeedFactor;
            }

            // Clear and render on the fixed hidden canvas
            hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
            bubblesRef.current.forEach(bubble => {
                bubble.move(deltaTime);
                bubble.render(hiddenCtx);
            });

            // Draw the fixed resolution hidden canvas onto the visible canvas, scaling to fill
            visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
            visibleCtx.drawImage(
                hiddenCanvas,
                0, 0, hiddenCanvas.width, hiddenCanvas.height,
                0, 0, visibleCanvas.width, visibleCanvas.height
            );

            animationRef.current = requestAnimationFrame(renderFrame);
        };

        // Initial blur calculation
        const widthRatio = visibleCanvas.width / settings.referenceWidth;
        const heightRatio = visibleCanvas.height / settings.referenceWidth;
        const maxRatio = Math.max(widthRatio, heightRatio);

        blur.current = Math.max(
            settings.blurAmount * (1 + (maxRatio - 1) * settings.blurScale),
            80
        );

        // Set initial blur
        visibleCanvas.style.filter = `blur(${blur.current}px)`;

        animationRef.current = requestAnimationFrame(renderFrame);

        return () => {
            window.removeEventListener('resize', adjustVisibleCanvas);
            if (window.screen && window.screen.orientation) {
                window.screen.orientation.removeEventListener('change', adjustVisibleCanvas);
            } else if (window.orientation !== undefined) {
                window.removeEventListener('orientationchange', adjustVisibleCanvas);
            }
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', adjustVisibleCanvas);
            }
            cancelAnimationFrame(animationRef.current);
        };
    }, [hueConfig, createNewBubbles, getSizeScaleFactor, getSpeedScaleFactor, settings.baseSpeedFactor, settings.blurAmount,
        settings.blurScale, settings.cycleBaseHue, settings.referenceHeight, settings.referenceWidth]);

    // When hue configuration changes, fade out old bubbles and add new ones (for those still active)
    useEffect(() => {
        if (hueConfig.length === 0) return;
        bubblesRef.current.forEach(bubble => {
            if (bubble.life < bubble.totalLife) {
                bubble.transitionState = 'fade-out';
                bubble.transitionProgress = 0;
            }
        });
        const speedScale = getSpeedScaleFactor();
        const sizeScale = getSizeScaleFactor();
        const newBubbles = createNewBubbles(speedScale, sizeScale);
        bubblesRef.current = [...bubblesRef.current, ...newBubbles];
    }, [hueConfig, createNewBubbles, getSizeScaleFactor, getSpeedScaleFactor]);


    return (
        <>
            <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
            <canvas
                ref={visibleCanvasRef}
                style={{
                    position: 'fixed',
                    top: isSmallScreen
                        ? `-${Math.max(blur.current * 0.8, 60)}px`
                        : '0',
                    left: isSmallScreen
                        ? `-${Math.max(blur.current * 0.8, 60)}px`
                        : '0',
                    width: isSmallScreen
                        ? `calc(100% + ${Math.max(blur.current * 1.6, 120)}px)`
                        : '100%',
                    height: isSmallScreen
                        ? `calc(100% + ${Math.max(blur.current * 1.6, 120)}px)`
                        : '100%',
                    opacity: 1,
                    filter: `blur(${blur.current}px)`,
                    pointerEvents: 'none',
                    zIndex: -1,
                }}
            />
        </>
    );
}