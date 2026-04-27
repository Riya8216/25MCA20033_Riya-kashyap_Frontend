class PriorityQueue {
    constructor() {
        this.elements = [];
    }
    
    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    
    dequeue() {
        return this.elements.shift().element;
    }
    
    isEmpty() {
        return this.elements.length === 0;
    }
}

class Node {
    constructor(id, name, x, y) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.neighbors = []; // { node: Node, weight: number }
    }
}

class Graph {
    constructor() {
        this.nodes = new Map();
    }
    
    addNode(id, name, x, y) {
        const node = new Node(id, name, x, y);
        this.nodes.set(id, node);
        return node;
    }
    
    addEdge(id1, id2) {
        const node1 = this.nodes.get(id1);
        const node2 = this.nodes.get(id2);
        
        if (node1 && node2) {
            // Calculate distance as weight
            const weight = this.heuristic(node1, node2);
            node1.neighbors.push({ node: node2, weight });
            node2.neighbors.push({ node: node1, weight });
        }
    }
    
    heuristic(nodeA, nodeB) {
        // Euclidean distance
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    aStar(startId, goalId) {
        const start = this.nodes.get(startId);
        const goal = this.nodes.get(goalId);
        
        if (!start || !goal) return null;
        
        const frontier = new PriorityQueue();
        frontier.enqueue(start, 0);
        
        const cameFrom = new Map();
        const costSoFar = new Map();
        
        cameFrom.set(start.id, null);
        costSoFar.set(start.id, 0);
        
        while (!frontier.isEmpty()) {
            const current = frontier.dequeue();
            
            if (current.id === goal.id) {
                break;
            }
            
            for (const neighborInfo of current.neighbors) {
                const next = neighborInfo.node;
                const newCost = costSoFar.get(current.id) + neighborInfo.weight;
                
                if (!costSoFar.has(next.id) || newCost < costSoFar.get(next.id)) {
                    costSoFar.set(next.id, newCost);
                    const priority = newCost + this.heuristic(next, goal);
                    frontier.enqueue(next, priority);
                    cameFrom.set(next.id, current.id);
                }
            }
        }
        
        // Reconstruct path
        if (!cameFrom.has(goal.id)) {
            return null; // No path found
        }
        
        let currentId = goal.id;
        const path = [];
        
        while (currentId !== null) {
            path.push(this.nodes.get(currentId));
            currentId = cameFrom.get(currentId);
        }
        
        return path.reverse();
    }
}
