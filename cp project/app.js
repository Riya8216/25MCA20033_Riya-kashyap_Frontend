const canvas = document.getElementById('hospital-map');
const ctx = canvas.getContext('2d');
const startSelect = document.getElementById('start-node');
const endSelect = document.getElementById('end-node');
const findRouteBtn = document.getElementById('find-route-btn');
const resetBtn = document.getElementById('reset-btn');
const routeDetails = document.getElementById('route-details');

const graph = new Graph();
let currentPath = [];
let animationProgress = 0;
let animationId = null;

// Handle canvas resizing
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawMap();
}

window.addEventListener('resize', resizeCanvas);

// Define hospital nodes (coordinates relative to a 1000x800 canvas)
const mapData = {
    baseWidth: 1000,
    baseHeight: 800,
    nodes: [
        { id: 'entrance', name: 'Main Entrance', x: 500, y: 750 },
        { id: 'reception', name: 'Reception', x: 500, y: 650 },
        { id: 'pharmacy', name: 'Pharmacy', x: 300, y: 650 },
        { id: 'cafeteria', name: 'Cafeteria', x: 700, y: 650 },
        { id: 'opd', name: 'OPD (Outpatient)', x: 500, y: 500 },
        { id: 'emergency', name: 'Emergency', x: 200, y: 500 },
        { id: 'radiology', name: 'Radiology / X-Ray', x: 800, y: 500 },
        { id: 'lab', name: 'Laboratory', x: 650, y: 350 },
        { id: 'icu', name: 'ICU', x: 350, y: 350 },
        { id: 'surgery', name: 'Surgery / OT', x: 500, y: 200 },
        { id: 'ward-a', name: 'General Ward A', x: 200, y: 200 },
        { id: 'ward-b', name: 'General Ward B', x: 800, y: 200 }
    ],
    edges: [
        ['entrance', 'reception'],
        ['reception', 'pharmacy'],
        ['reception', 'cafeteria'],
        ['reception', 'opd'],
        ['opd', 'emergency'],
        ['opd', 'radiology'],
        ['opd', 'icu'],
        ['opd', 'lab'],
        ['emergency', 'pharmacy'],
        ['emergency', 'ward-a'],
        ['icu', 'surgery'],
        ['icu', 'ward-a'],
        ['lab', 'radiology'],
        ['lab', 'ward-b'],
        ['surgery', 'ward-a'],
        ['surgery', 'ward-b']
    ]
};

// Initialize Graph
function initGraph() {
    mapData.nodes.forEach(n => {
        graph.addNode(n.id, n.name, n.x, n.y);
        
        // Populate dropdowns
        const option1 = document.createElement('option');
        option1.value = n.id;
        option1.textContent = n.name;
        startSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = n.id;
        option2.textContent = n.name;
        endSelect.appendChild(option2);
    });
    
    startSelect.value = 'entrance';
    endSelect.value = 'opd';

    mapData.edges.forEach(e => {
        graph.addEdge(e[0], e[1]);
    });
}

function getScaledCoords(x, y) {
    const padding = 60;
    const effectiveWidth = canvas.width - padding * 2;
    const effectiveHeight = canvas.height - padding * 2;
    
    return {
        x: padding + (x / mapData.baseWidth) * effectiveWidth,
        y: padding + (y / mapData.baseHeight) * effectiveHeight
    };
}

function drawNode(node, isStart, isEnd) {
    const { x, y } = getScaledCoords(node.x, node.y);
    
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    
    if (isStart) {
        ctx.fillStyle = '#10b981'; // Green
        ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
    } else if (isEnd) {
        ctx.fillStyle = '#ef4444'; // Red
        ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
    } else {
        ctx.fillStyle = '#3b82f6'; // Blue
        ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
    }
    
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
    
    // Draw text
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    // Check if the node is somewhat overlapping or needs offset
    ctx.fillText(node.name, x, y - 24);
}

function drawEdge(nodeA, nodeB, isPath = false) {
    const posA = getScaledCoords(nodeA.x, nodeA.y);
    const posB = getScaledCoords(nodeB.x, nodeB.y);
    
    ctx.beginPath();
    ctx.moveTo(posA.x, posA.y);
    ctx.lineTo(posB.x, posB.y);
    
    if (isPath) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
    } else {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

function drawAnimatedPath() {
    if (!currentPath || currentPath.length < 2) return;
    
    // Draw background edges
    mapData.edges.forEach(e => {
        const nA = graph.nodes.get(e[0]);
        const nB = graph.nodes.get(e[1]);
        drawEdge(nA, nB, false);
    });

    const currentSegmentIndex = Math.floor(animationProgress);
    const segmentProgress = animationProgress - currentSegmentIndex;

    for (let i = 0; i < currentPath.length - 1; i++) {
        if (i < currentSegmentIndex) {
            drawEdge(currentPath[i], currentPath[i+1], true);
        } else if (i === currentSegmentIndex) {
            const nA = currentPath[i];
            const nB = currentPath[i+1];
            const posA = getScaledCoords(nA.x, nA.y);
            const posB = getScaledCoords(nB.x, nB.y);
            
            const currX = posA.x + (posB.x - posA.x) * segmentProgress;
            const currY = posA.y + (posB.y - posA.y) * segmentProgress;
            
            ctx.beginPath();
            ctx.moveTo(posA.x, posA.y);
            ctx.lineTo(currX, currY);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Draw a moving dot
            ctx.beginPath();
            ctx.arc(currX, currY, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    graph.nodes.forEach(node => {
        const isStart = currentPath.length > 0 && node.id === currentPath[0].id;
        const isEnd = currentPath.length > 0 && node.id === currentPath[currentPath.length - 1].id;
        drawNode(node, isStart, isEnd);
    });
}

function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    mapData.edges.forEach(e => {
        const nA = graph.nodes.get(e[0]);
        const nB = graph.nodes.get(e[1]);
        drawEdge(nA, nB, false);
    });
    
    if (currentPath.length > 0 && animationProgress >= currentPath.length - 1) {
        for (let i = 0; i < currentPath.length - 1; i++) {
            drawEdge(currentPath[i], currentPath[i+1], true);
        }
    }
    
    if (currentPath.length > 0 && animationProgress < currentPath.length - 1) {
        drawAnimatedPath();
    } else {
        graph.nodes.forEach(node => {
            const isStart = currentPath.length > 0 && node.id === currentPath[0].id;
            const isEnd = currentPath.length > 0 && node.id === currentPath[currentPath.length - 1].id;
            drawNode(node, isStart, isEnd);
        });
    }
}

function animatePath() {
    if (!currentPath || currentPath.length < 2) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    animationProgress += 0.05; 
    
    if (animationProgress >= currentPath.length - 1) {
        animationProgress = currentPath.length - 1;
        drawMap();
        cancelAnimationFrame(animationId);
        return;
    }
    
    drawMap();
    animationId = requestAnimationFrame(animatePath);
}

function updateRouteDetails(path) {
    if (!path || path.length === 0) {
        routeDetails.innerHTML = '<p class="placeholder-text">No path found.</p>';
        return;
    }
    
    let html = '';
    let totalDistance = 0;
    
    for (let i = 0; i < path.length; i++) {
        html += `
            <div class="path-step">
                <div class="step-dot"></div>
                <span>${path[i].name}</span>
            </div>
        `;
        
        if (i < path.length - 1) {
            totalDistance += graph.heuristic(path[i], path[i+1]);
        }
    }
    
    // Scale distance to a reasonable metric unit like meters
    const scaledDistance = Math.round(totalDistance * 0.1);
    const estTime = Math.ceil(scaledDistance / 50); // assuming 50m per min
    
    html = `
        <div style="margin-bottom: 16px;">
            <strong>Est. Time:</strong> ${estTime} mins<br>
            <strong>Distance:</strong> ${scaledDistance} meters
        </div>
    ` + html;
    
    routeDetails.innerHTML = html;
}

findRouteBtn.addEventListener('click', () => {
    const startId = startSelect.value;
    const endId = endSelect.value;
    
    if (startId === endId) {
        alert("You are already at your destination!");
        return;
    }
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    currentPath = graph.aStar(startId, endId);
    animationProgress = 0;
    
    updateRouteDetails(currentPath);
    animatePath();
});

resetBtn.addEventListener('click', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    currentPath = [];
    animationProgress = 0;
    routeDetails.innerHTML = '<p class="placeholder-text">Select a route to view details.</p>';
    drawMap();
});

// Init
initGraph();
setTimeout(resizeCanvas, 100);
