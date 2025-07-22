// Advanced Particle System with Cyber Theme
class CyberParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 30 : 60;
        this.connectionDistance = 120;
        this.mouse = { x: 0, y: 0 };
        
        this.init();
        this.animate();
        this.handleEvents();
    }
    
    init() {
        this.resize();
        this.createParticles();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        const colors = ['6, 182, 212', '139, 92, 246', '16, 185, 129'];
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.6 + 0.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                originalSize: 0,
                pulsePhase: Math.random() * Math.PI * 2,
                connectionStrength: 0
            });
            this.particles[i].originalSize = this.particles[i].size;
        }
    }
    
    updateParticles() {
        const time = Date.now() * 0.001;
        
        this.particles.forEach((particle, i) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Pulsing effect
            particle.size = particle.originalSize + Math.sin(time + particle.pulsePhase) * 0.5;
            particle.opacity = 0.3 + Math.sin(time * 2 + particle.pulsePhase) * 0.2;
            
            // Mouse interaction
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                const force = (150 - distance) / 150;
                particle.vx += (dx / distance) * force * 0.01;
                particle.vy += (dy / distance) * force * 0.01;
                particle.size = particle.originalSize * (1 + force);
                particle.connectionStrength = force;
            } else {
                particle.connectionStrength *= 0.95;
            }
            
            // Velocity damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            
            // Keep within bounds
            particle.vx = Math.max(-2, Math.min(2, particle.vx));
            particle.vy = Math.max(-2, Math.min(2, particle.vy));
        });
    }
    
    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections first
        this.drawConnections();
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.save();
            
            // Create gradient
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 3
            );
            gradient.addColorStop(0, `rgba(${particle.color}, ${particle.opacity})`);
            gradient.addColorStop(0.5, `rgba(${particle.color}, ${particle.opacity * 0.5})`);
            gradient.addColorStop(1, `rgba(${particle.color}, 0)`);
            
            // Draw particle with glow
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Enhanced glow for mouse interaction
            if (particle.connectionStrength > 0.1) {
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${particle.color}, ${particle.connectionStrength * 0.1})`;
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    drawConnections() {
        this.particles.forEach((particle, i) => {
            this.particles.slice(i + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (this.connectionDistance - distance) / this.connectionDistance * 0.15;
                    const gradient = this.ctx.createLinearGradient(
                        particle.x, particle.y,
                        otherParticle.x, otherParticle.y
                    );
                    gradient.addColorStop(0, `rgba(${particle.color}, ${opacity})`);
                    gradient.addColorStop(1, `rgba(${otherParticle.color}, ${opacity})`);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            });
        });
    }
    
    animate() {
        this.updateParticles();
        this.drawParticles();
        requestAnimationFrame(() => this.animate());
    }
    
    handleEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.particleCount = window.innerWidth < 768 ? 30 : 60;
            this.createParticles();
        });
        
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
}

// Advanced Cursor Tracer with Cyber Effects
class CyberCursorTracer {
    constructor() {
        this.tracer = document.getElementById('cursor-tracer');
        this.trail = [];
        this.maxTrailLength = 25;
        this.isVisible = false;
        this.mousePos = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseenter', () => this.show());
        document.addEventListener('mouseleave', () => this.hide());
        document.addEventListener('click', (e) => this.createClickRipple(e));
    }
    
    handleMouseMove(e) {
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
        
        // Update tracer position with smooth following
        this.tracer.style.left = `${e.clientX - 8}px`;
        this.tracer.style.top = `${e.clientY - 8}px`;
        
        // Add to trail
        this.trail.push({
            x: e.clientX,
            y: e.clientY,
            time: Date.now(),
            size: 8 + Math.random() * 4
        });
        
        // Remove old trail points
        const now = Date.now();
        this.trail = this.trail.filter(point => now - point.time < 800);
        
        // Update trail
        this.updateTrail();
    }
    
    updateTrail() {
        // Remove existing trail elements
        document.querySelectorAll('.cursor-trail').forEach(el => el.remove());
        
        const now = Date.now();
        this.trail.forEach((point, index) => {
            if (index % 2 === 0) { // Reduce density for performance
                const age = now - point.time;
                const opacity = Math.max(0, 1 - age / 800);
                const size = Math.max(2, point.size * (1 - age / 800));
                
                const trailElement = document.createElement('div');
                trailElement.className = 'cursor-trail fixed pointer-events-none rounded-full';
                trailElement.style.cssText = `
                    left: ${point.x - size/2}px;
                    top: ${point.y - size/2}px;
                    width: ${size}px;
                    height: ${size}px;
                    background: radial-gradient(circle, rgba(6, 182, 212, ${opacity * 0.6}) 0%, rgba(139, 92, 246, ${opacity * 0.3}) 100%);
                    filter: blur(${Math.max(1, 3 - opacity * 2)}px);
                    z-index: 49;
                    mix-blend-mode: screen;
                `;
                
                document.body.appendChild(trailElement);
                
                // Auto-remove
                setTimeout(() => {
                    if (trailElement.parentNode) {
                        trailElement.parentNode.removeChild(trailElement);
                    }
                }, 900);
            }
        });
    }
    
    createClickRipple(e) {
        const ripple = document.createElement('div');
        ripple.className = 'fixed pointer-events-none rounded-full';
        ripple.style.cssText = `
            left: ${e.clientX - 25}px;
            top: ${e.clientY - 25}px;
            width: 50px;
            height: 50px;
            border: 2px solid rgba(6, 182, 212, 0.6);
            background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%);
            z-index: 50;
            animation: clickRipple 0.6s ease-out;
        `;
        
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
    
    show() {
        this.isVisible = true;
        this.tracer.style.opacity = '0.9';
    }
    
    hide() {
        this.isVisible = false;
        this.tracer.style.opacity = '0';
    }
}

// Advanced Scroll Animations with Intersection Observer
class CyberScrollAnimations {
    constructor() {
        this.elements = [];
        this.scrollProgress = 0;
        this.init();
    }
    
    init() {
        // Find all elements with animation classes
        this.elements = document.querySelectorAll('.animate-fade-in-up, .animate-slide-in-left, .animate-slide-in-right');
        
        // Create intersection observers with different thresholds
        this.createObservers();
        
        // Handle scroll for parallax and progress
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        
        // Create scroll progress indicator
        this.createScrollIndicator();
    }
    
    createObservers() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    entry.target.classList.add('visible');
                    
                    // Add staggered delays for child elements
                    const children = entry.target.querySelectorAll('.feature-card, .tech-detail-card');
                    children.forEach((child, index) => {
                        child.style.animationDelay = `${index * 0.1}s`;
                        child.classList.add('animate-fade-in-up');
                    });
                }
            });
        }, options);
        
        this.elements.forEach(el => this.observer.observe(el));
    }
    
    handleScroll() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Calculate scroll progress
        this.scrollProgress = scrollY / (documentHeight - windowHeight);
        this.updateScrollIndicator();
        
        // Parallax effects
        const header = document.getElementById('header');
        if (header) {
            header.style.transform = `translateY(${scrollY * 0.3}px)`;
        }
        
        // Update particle system based on scroll
        if (window.particleSystem) {
            window.particleSystem.particles.forEach(particle => {
                particle.pulsePhase += scrollY * 0.0001;
            });
        }
        
        // Reveal animations for code blocks
        this.handleCodeBlockAnimations(scrollY);
    }
    
    handleCodeBlockAnimations(scrollY) {
        const codeBlocks = document.querySelectorAll('.code-block');
        codeBlocks.forEach(block => {
            const rect = block.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.8) {
                block.classList.add('visible');
                this.animateCodeText(block);
            }
        });
    }
    
    animateCodeText(codeBlock) {
        const codeElement = codeBlock.querySelector('code');
        if (codeElement && !codeElement.classList.contains('animated')) {
            codeElement.classList.add('animated');
            const text = codeElement.textContent;
            codeElement.textContent = '';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    codeElement.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, Math.random() * 20 + 10);
                }
            };
            
            setTimeout(typeWriter, 200);
        }
    }
    
    createScrollIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 4px;
            background: linear-gradient(90deg, #06b6d4, #8b5cf6, #10b981);
            z-index: 100;
            width: 0%;
            transition: width 0.3s ease;
        `;
        document.body.appendChild(indicator);
        this.scrollIndicator = indicator;
    }
    
    updateScrollIndicator() {
        if (this.scrollIndicator) {
            this.scrollIndicator.style.width = `${this.scrollProgress * 100}%`;
        }
    }
}

// Enhanced Syntax Highlighter
class CyberSyntaxHighlighter {
    constructor() {
        this.keywords = [
            'void', 'int', 'char', 'std', 'string', 'true', 'false', 'if', 'while', 
            'for', 'return', 'class', 'struct', 'const', 'sizeof', 'namespace',
            'using', 'include', 'define', 'thread', 'mutex', 'lock_guard',
            'auto', 'static', 'extern', 'inline', 'virtual', 'private', 'public'
        ];
        
        this.types = [
            'std::thread', 'std::mutex', 'std::string', 'std::vector', 
            'std::unordered_map', 'sockaddr_in', 'WINDOW', 'Node'
        ];
        
        this.init();
    }
    
    init() {
        const codeBlocks = document.querySelectorAll('code.cpp, .code-container code');
        codeBlocks.forEach(block => this.highlightCpp(block));
    }
    
    highlightCpp(block) {
        let content = block.innerHTML;
        
        // Preserve existing HTML structure
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // Only process text nodes
        this.processTextNodes(tempDiv);
        
        block.innerHTML = tempDiv.innerHTML;
    }
    
    processTextNodes(element) {
        if (element.nodeType === Node.TEXT_NODE) {
            let content = element.textContent;
            
            // Comments (must be first to avoid keyword highlighting in comments)
            content = content.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
            content = content.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
            
            // Preprocessor directives
            content = content.replace(/(#\w+)/g, '<span class="preprocessor">$1</span>');
            
            // Strings
            content = content.replace(/"([^"]*)"/g, '<span class="string">"$1"</span>');
            content = content.replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>');
            
            // Numbers
            content = content.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
            
            // Types
            this.types.forEach(type => {
                const regex = new RegExp(`\\b${type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
                content = content.replace(regex, `<span class="type">${type}</span>`);
            });
            
            // Keywords
            this.keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                content = content.replace(regex, `<span class="keyword">${keyword}</span>`);
            });
            
            // Function calls
            content = content.replace(/(\w+)(\s*\()/g, '<span class="function">$1</span>$2');
            
            element.parentNode.replaceChild(
                document.createRange().createContextualFragment(content),
                element
            );
        } else {
            Array.from(element.childNodes).forEach(child => {
                if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.ELEMENT_NODE) {
                    this.processTextNodes(child);
                }
            });
        }
    }
}

// Advanced Interactive Effects
class CyberInteractiveEffects {
    constructor() {
        this.ripples = [];
        this.init();
    }
    
    init() {
        this.setupCardEffects();
        this.setupScrollEffects();
        this.setupImageEffects();
        this.setupPerformanceMonitoring();
    }
    
    setupCardEffects() {
        const cards = document.querySelectorAll('.glass-card, .feature-card, .tech-detail-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', (e) => this.handleCardEnter(e, card));
            card.addEventListener('mousemove', (e) => this.handleCardMove(e, card));
            card.addEventListener('mouseleave', (e) => this.handleCardLeave(e, card));
            card.addEventListener('click', (e) => this.createCardRipple(e, card));
        });
    }
    
    handleCardEnter(e, card) {
        card.style.transition = 'all 0.4s cubic-bezier(0.23, 1, 0.320, 1)';
        
        // Add hover glow effect
        const glow = document.createElement('div');
        glow.className = 'card-glow';
        glow.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1));
            border-radius: inherit;
            z-index: -1;
            opacity: 0;
            transition: opacity 0.4s ease;
        `;
        
        card.style.position = 'relative';
        card.appendChild(glow);
        
        setTimeout(() => {
            glow.style.opacity = '1';
        }, 50);
    }
    
    handleCardMove(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const rotateX = (y / rect.height) * 8;
        const rotateY = (x / rect.width) * -8;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
    }
    
    handleCardLeave(e, card) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        
        // Remove glow effect
        const glow = card.querySelector('.card-glow');
        if (glow) {
            glow.style.opacity = '0';
            setTimeout(() => {
                if (glow.parentNode) {
                    glow.parentNode.removeChild(glow);
                }
            }, 400);
        }
    }
    
    createCardRipple(e, card) {
        const rect = card.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.5;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            transform: scale(0);
            animation: cardRipple 0.6s ease-out;
            z-index: 2;
        `;
        
        card.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
    
    setupScrollEffects() {
        // Add smooth scrolling to navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    setupImageEffects() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('load', () => {
                img.style.opacity = '0';
                img.style.transform = 'scale(0.9)';
                img.style.transition = 'all 0.6s ease';
                
                setTimeout(() => {
                    img.style.opacity = '1';
                    img.style.transform = 'scale(1)';
                }, 100);
            });
        });
    }
    
    setupPerformanceMonitoring() {
        // Monitor performance and reduce effects if needed
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitorFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                
                if (fps < 30 && window.particleSystem) {
                    // Reduce particle count for better performance
                    window.particleSystem.particleCount = Math.max(20, window.particleSystem.particleCount * 0.8);
                    window.particleSystem.createParticles();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(monitorFPS);
        };
        
        monitorFPS();
    }
}

// CSS Animation Definitions
const additionalStyles = `
    @keyframes clickRipple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    @keyframes cardRipple {
        to {
            transform: scale(1);
            opacity: 0;
        }
    }
    
    @keyframes fadeInScale {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    .code-block.visible .code-container {
        animation: fadeInScale 0.8s ease-out;
    }
    
    /* Enhanced focus styles */
    .glass-card:focus-within {
        box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.5);
    }
    
    /* Smooth transitions */
    * {
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
`;

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add additional styles
    const style = document.createElement('style');
    style.textContent = additionalStyles;
    document.head.appendChild(style);
    
    // Initialize all systems with error handling
    try {
        window.particleSystem = new CyberParticleSystem();
        console.log('✅ Particle system initialized');
    } catch (error) {
        console.warn('⚠️ Particle system failed to initialize:', error);
    }
    
    try {
        window.cursorTracer = new CyberCursorTracer();
        console.log('✅ Cursor tracer initialized');
    } catch (error) {
        console.warn('⚠️ Cursor tracer failed to initialize:', error);
    }
    
    try {
        window.scrollAnimations = new CyberScrollAnimations();
        console.log('✅ Scroll animations initialized');
    } catch (error) {
        console.warn('⚠️ Scroll animations failed to initialize:', error);
    }
    
    try {
        window.syntaxHighlighter = new CyberSyntaxHighlighter();
        console.log('✅ Syntax highlighter initialized');
    } catch (error) {
        console.warn('⚠️ Syntax highlighter failed to initialize:', error);
    }
    
    try {
        window.interactiveEffects = new CyberInteractiveEffects();
        console.log('✅ Interactive effects initialized');
    } catch (error) {
        console.warn('⚠️ Interactive effects failed to initialize:', error);
    }
    
    // Performance monitoring
    if ('performance' in window && 'memory' in performance) {
        setInterval(() => {
            const memory = performance.memory;
            if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
                console.warn('⚠️ High memory usage detected, optimizing...');
                // Reduce particle count if memory is high
                if (window.particleSystem) {
                    window.particleSystem.particleCount = Math.max(15, window.particleSystem.particleCount * 0.7);
                    window.particleSystem.createParticles();
                }
            }
        }, 10000);
    }
    
    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
    
    // Accessibility: Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log('ℹ️ Reduced motion preference detected, disabling animations');
        if (window.particleSystem) {
            window.particleSystem.particleCount = 5;
            window.particleSystem.createParticles();
        }
    }
    
    console.log('🚀 C++ Terminal Chat Server documentation website fully loaded!');
    console.log('🎯 All systems operational - Ready for technical exploration');
});