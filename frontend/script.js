// Configuration
const API_BASE_URL = 'https://damonai.onrender.com';
const VAMPIRE_VOICE_PITCH = 0.6;
const VAMPIRE_VOICE_RATE = 0.9;

// DOM Elements
const landingPage = document.getElementById('landing-page');
const startBtn = document.getElementById('btn-start');

// Chat Page Elements
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('btn-send');
const micBtn = document.getElementById('btn-mic');
const uploadBtn = document.getElementById('btn-upload-trigger');
const fileInput = document.getElementById('file-input');
const pdfSelect = document.getElementById('pdf-select');

// Sidebar Elements
const newChatBtn = document.getElementById('btn-new-chat');
const historyList = document.getElementById('history-list');

// State
let isRecording = false;
let isTTSActive = true;
let recognition;

// Initialize
function init() {
    initThreeJS();

    if (landingPage) {
        initLandingPage();
    }

    if (chatWindow) {
        initChatPage();
    }
}

// ---------------------------------------------------------
// Three.js & Animations
// ---------------------------------------------------------
function initThreeJS() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 700;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const material = new THREE.PointsMaterial({
        size: 0.02,
        color: 0xff003c, // Neon Red
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    camera.position.z = 3;

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        const elapsedTime = clock.getElapsedTime();
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;

        if (landingPage && typeof landingObject !== 'undefined') {
            landingObject.rotation.y += 0.005;
            landingObject.rotation.x += 0.002;
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 3D Object for Landing Page
    let landingObject;
    if (landingPage) {
        const geometry = new THREE.IcosahedronGeometry(1.2, 0);
        const wireframe = new THREE.WireframeGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff003c });
        landingObject = new THREE.LineSegments(wireframe, lineMaterial);

        const coreGeo = new THREE.SphereGeometry(0.6, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x880000 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        landingObject.add(core);

        landingObject.position.x = 1.5;
        scene.add(landingObject);
    }

    animate();
}

function initLandingPage() {
    gsap.from('.hero-title', { duration: 1.5, y: 50, opacity: 0, ease: "power4.out", delay: 0.2 });
    gsap.from('.hero-subtitle', { duration: 1.5, y: 30, opacity: 0, ease: "power3.out", delay: 0.5 });
    gsap.from('.btn-start', { duration: 1, y: 20, opacity: 0, ease: "back.out(1.7)", delay: 1.0 });

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.location.href = 'chat.html';
        });
    }
}

function initChatPage() {
    setupVoiceInput();
    setupFileUpload();
    setupChatLogic();
    loadHistoryFromStorage();

    // New Chat
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            chatWindow.innerHTML = '';
            addMessage("The scroll is fresh. What do you seek, mortal?", 'damon');
        });
    }

    // TTS Toggle
    const infoBtn = document.getElementById('btn-info');
    if (infoBtn) {
        infoBtn.addEventListener('click', () => {
            isTTSActive = !isTTSActive;
            infoBtn.classList.toggle('active', isTTSActive);
            infoBtn.style.color = isTTSActive ? '#ff003c' : '#666';
            if (isTTSActive) speak("Voice output enabled.");
        });
        if (isTTSActive) infoBtn.style.color = '#ff003c';
    }
}

// ---------------------------------------------------------
// Logic: Chat & API
// ---------------------------------------------------------
function setupChatLogic() {
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';

    const loadingId = addMessage("Absorbing knowledge...", 'damon', true);

    try {
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text })
        });

        if (!response.ok) throw new Error("The spirits are silent.");

        const data = await response.json();
        removeMessage(loadingId);
        addMessage(data.response, 'damon');

        if (isTTSActive) speak(data.response);

    } catch (error) {
        removeMessage(loadingId);
        addMessage("My connection to the ether is disrupted. (" + error.message + ")", 'damon');
    }
}

function addMessage(text, sender, isLoading = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    if (isLoading) msgDiv.id = 'msg-loading-' + Date.now();

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.textContent = text;

    if (sender === 'damon') {
        const avatar = document.createElement('img');
        avatar.src = 'assets/avatar.png';
        avatar.alt = 'Damon';
        avatar.classList.add('avatar');
        msgDiv.appendChild(avatar);
    }

    msgDiv.appendChild(contentDiv);
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    return msgDiv.id;
}

function removeMessage(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ---------------------------------------------------------
// Logic: File Upload & History (FIXED)
// ---------------------------------------------------------
function setupFileUpload() {
    if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            addMessage(`Uploading ${file.name}...`, 'damon');

            try {
                const response = await fetch(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error("Upload failed");

                const data = await response.json();
                addMessage(data.message, 'damon');

                addToHistory(file.name);
                saveToLocalStorage(file.name);

                if (pdfSelect) {
                    const option = document.createElement('option');
                    option.text = file.name;
                    option.value = file.name;
                    pdfSelect.add(option);
                    pdfSelect.value = file.name;
                }

            } catch (error) {
                addMessage("I rejected this scroll. " + error.message, 'damon');
            }
        });
    }
}

function addToHistory(filename) {
    if (historyList) {
        const existingItems = Array.from(historyList.children);
        if (existingItems.some(item => item.innerText.includes(filename))) return;

        const item = document.createElement('div');
        item.className = 'history-item'; // Matches new CSS
        item.innerText = "📜 " + filename;

        // NO ALERT - Highlighting Logic
        item.onclick = () => {
            const allItems = document.querySelectorAll('.history-item');
            allItems.forEach(el => {
                el.style.background = 'transparent';
                el.style.color = '#aaa';
            });
            item.style.background = 'rgba(255, 0, 60, 0.2)';
            item.style.color = '#fff';

            addMessage(`I am focusing my attention on ${filename}...`, 'damon');
        };

        historyList.prepend(item);
    }
}

// --- LOCAL STORAGE ---
function saveToLocalStorage(filename) {
    let files = JSON.parse(localStorage.getItem('damon_files')) || [];
    if (!files.includes(filename)) {
        files.push(filename);
        localStorage.setItem('damon_files', JSON.stringify(files));
    }
}

function loadHistoryFromStorage() {
    let files = JSON.parse(localStorage.getItem('damon_files')) || [];
    files.forEach(file => addToHistory(file));
}

// ---------------------------------------------------------
// Logic: Voice
// ---------------------------------------------------------
function setupVoiceInput() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isRecording = true;
            if (micBtn) micBtn.classList.add('active');
        };

        recognition.onend = () => {
            isRecording = false;
            if (micBtn) micBtn.classList.remove('active');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (userInput) userInput.value = transcript;
        };

        if (micBtn) {
            micBtn.addEventListener('click', () => {
                if (isRecording) recognition.stop();
                else recognition.start();
            });
        }
    } else {
        if (micBtn) micBtn.style.display = 'none';
    }
}

function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = VAMPIRE_VOICE_PITCH;
    utterance.rate = VAMPIRE_VOICE_RATE;
    window.speechSynthesis.speak(utterance);
}

window.addEventListener('DOMContentLoaded', init);
