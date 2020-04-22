window.addEventListener('load', (event) => {
    window.Teacher = {
        defaultOptions: {
            canvasId: 'canvas',
            graphTypeRadioButtonIds: ['undirectedRadio', 'directedRadio']
        },
    
    
        ctx: null,
        canvas: null,
        nodes: [],
        animationFrameId: null,
        currentNode: null,
        isMouseDown: false,
        currentType: 'directed',
        actionsManager: null,
    
        init: function (options = {}) {
            this.onMouseDown = this.onMouseDown.bind(this);
            this.onMouseMove = this.onMouseMove.bind(this);
            this.onMouseUp = this.onMouseUp.bind(this);
            this.draw = this.draw.bind(this);
            this.changeGraphType = this.changeGraphType.bind(this);

            options = Object.assign(this.defaultOptions, options);
    
            this.canvas = document.getElementById(options.canvasId);
            this.ctx = this.canvas.getContext('2d');

            this.canvas.addEventListener("mousedown", this.onMouseDown);
            this.canvas.addEventListener("mousemove", this.onMouseMove);
            this.canvas.addEventListener("mouseup", this.onMouseUp);

            options.graphTypeRadioButtonIds.forEach(id => {
                document.getElementById(id).addEventListener('change', this.changeGraphType);
            })
           
            this.start();
            return this;
        },
    
        start: function () {
            this.nodes = [];
            this.actionsManager = new ActionsManager(this.nodes);
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = requestAnimationFrame(this.draw);
           
        },

        getNodeAt(x, y) {
            return this.nodes.find(node => {
               return Math.pow((x - node.x),2) + Math.pow(y - node.y, 2) <= Math.pow(2*Node.radius, 2);
            })
        },
    
        draw: function() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for (const node of this.nodes) {
                // node.x = getRandomArbitrary(0, this.canvas.width);
                // node.y = getRandomArbitrary(0, this.canvas.height);
                // node.x = node.x + 1;
                // node.y = Math.sin(node.x)*this.canvas.height/2;
                node.draw(this.ctx);
            }
            // if (this.nodes.length) {
            //     const lastNode = this.nodes[this.nodes.length -1];
            //     this.nodes.push(new Node(lastNode.x + 0.5, this.canvas.height/2 + Math.sin(lastNode.x)*this.canvas.height/4));
            // }
            // console.log(this.currentType);
            this.animationFrameId = requestAnimationFrame(this.draw);
        },

        async dfs() {
            const startNode = this.nodes.find(n => n.id === Node.selectedNodeId);
            this.nodes.forEach(n => n.visited = false);
            if (startNode) {
                const dfsR = async (node) => {
                    await sleep(1000);
                    node.visited = true;
                    for (const child of node.adjacentNodes) {
                        if (!child.visited) {
                            await dfsR(child);
                        }
                    }
                    return
                }

                dfsR(startNode);
            }
        },

        bfs() {

        },

        undo() {
            this.actionsManager.undo();
        },

        changeGraphType({target}) {
            // Actually it seems like according to spec if change event is fired
            // for radio button it means it is checked indeed 
            // TODO: read it up and make sure it is the case
            if(target && target.checked) {
                this.currentType = target.value;
            }
        },
    
        onMouseDown: function (event) {
            event.preventDefault();
            var x = event.x;
            var y = event.y;
            x -= this.canvas.offsetLeft;
            y -= this.canvas.offsetTop;
            this.isMouseDown = true;
            this.originalPos = {x,y};

            const node = this.getNodeAt(x, y);
            if (node) {
                // if (node == this.currentNode) {
                //     this.currentNode.selected = false;
                //     this.currentNode = null;
                // } else {
                //     if (this.currentNode) {
                //         this.currentNode.selected = false;
                //     }
                //     this.currentNode = node;
                //     this.currentNode.selected = true;
                // }
                if (Node.selectedNodeId !== null && node.id !== Node.selectedNodeId) {
                    const prevNode = this.nodes.find(n => n.id === Node.selectedNodeId);
                    prevNode.addChild(node, this.currentType);
                    this.actionsManager.add({
                        type: ActionType.addEdge,
                        from: prevNode,
                        to: node,
                        graphType: this.currentType
                    });
                    Node.selectedNodeId = null;
                } else {
                    Node.selectedNodeId = node.id == Node.selectedNodeId ? null : node.id;
                }
          
            } else {
                const newNode = new Node(x, y)
                this.actionsManager.add({
                    type: ActionType.addNode,
                    node: newNode
                });
                if (Node.selectedNodeId !== null) {
                    const prevNode = this.nodes.find(n => n.id === Node.selectedNodeId);
                    prevNode.addChild(newNode, this.currentType);
                    this.actionsManager.add({
                        type: ActionType.addEdge,
                        from: prevNode,
                        to: newNode,
                        graphType: this.currentType
                    });
                    Node.selectedNodeId = null;
                } else {
                    // Node.selectedNodeId = newNode.id;
                }
         
                this.nodes.push(newNode);
            }
          
          
        },
    
        onMouseMove: function (event) {
            event.preventDefault();
            var x = event.x;
            var y = event.y;
            x -= this.canvas.offsetLeft;
            y -= this.canvas.offsetTop;
     
            if (this.isMouseDown && Node.selectedNodeId !== null) {
                const node = this.nodes.find(n => n.id === Node.selectedNodeId);
                node.x = x;
                node.y = y;
            }
         
        },
    
        onMouseUp: function (event) {
            event.preventDefault();
            this.isMouseDown = false;
            if (Node.selectedNodeId !== null) {
                const node = this.nodes.find(n => n.id === Node.selectedNodeId);
                this.actionsManager.add({
                    type: ActionType.moved,
                    x: this.originalPos.x,
                    y: this.originalPos.y,
                    node: node,
                })
            }
           
            // Node.selectedNodeId = null;
        }
    }.init();
});


const GraphType = {
    directed: 'directed',
    undirected: 'undirected'
}

class Node {
    static radius = 8;
    static id = 0;
    static selectedNodeId = null;

    adjacentNodes = [];
    visited = false;
    constructor(x ,y ) {
        this.x = x;
        this.y = y;
        this.id = Node.id++;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle =  this.id == Node.selectedNodeId ? '#851e3e' : '#005b96';
        if (this.visited) {
            ctx.fillStyle = '#7bc043';
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, Node.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        this.drawEdges(ctx);
    } 

    drawEdges(ctx) {
        ctx.save();
        ctx.fillStyle = '#000000';
        for (const child of this.adjacentNodes) {
            let alpha = 0;
            if ((child.x - this.x) != 0) {
                alpha = Math.atan((child.y - this.y) / (child.x - this.x))
            }
            // console.log(alpha);
            // const betha = (Math.PI/2 - alpha) + Math.PI / 4;
            const betha = Math.PI / 4;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            const x = child.x - Node.radius*Math.cos(alpha);
            const y = child.y +  Node.radius*Math.sin(alpha);
            ctx.lineTo(x, y);
            
            const arrowLength = 20;
            ctx.moveTo(x,y);
            ctx.lineTo(x - arrowLength*Math.cos(betha), y - arrowLength*Math.sin(betha));

            ctx.moveTo(x,y);
            ctx.lineTo(x + arrowLength*Math.cos(betha), y - arrowLength*Math.sin(betha));

            ctx.stroke();
        }
    }

    addChild(node, type) {
        this.adjacentNodes.push(node);
        if (type == GraphType.undirected) {
            node.addChild(this, null);
        }
    }

}

const ActionType = {
    addNode: 'addNode',
    addEdge: 'addEdge',
    moved: 'moved',
}

class ActionsManager {
    actions = [];
    undoneActions = [];

    
    constructor(nodes) {
      this.nodes = nodes;
    }

    add(action) {
        this.actions.push(action)
    }

    redo() {
        const lastAction = this.undoneActions.pop();

    }

    undo() {
        const lastAction = this.actions.pop();
        if (lastAction) {
            switch (lastAction.type) {
                case ActionType.addNode: {
                    const node = lastAction.node;
                    const index = this.nodes.findIndex($node => $node.id == node.id);
                    this.nodes.map($node => 
                        ({ adjacentNodes: $node.adjacentNodes, index: $node.adjacentNodes.findIndex(child => child.id == node.id) })).filter(item => {
                            return item.index > -1
                        }).forEach(item => item.adjacentNodes.splice(item.index, 1));
                    if(index > -1) {
                        if (node.id == Node.selectedNodeId) {
                            Node.selectedNodeId = null;
                        }
                        this.nodes.splice(index, 1);
                    }
                    break;
                }
                case ActionType.addEdge: {
                    const {from, to, graphType} = lastAction;
                    let index = from.adjacentNodes.findIndex($node => $node.id == to.id);
                    from.adjacentNodes.splice(index, 1);
                    if (graphType == GraphType.undirected) {
                        index = to.adjacentNodes.findIndex($node => $node.id == from.id);
                        to.adjacentNodes.splice(index, 1);
                    }
                    break
                }
                case ActionType.moved: {
                    const {x, y, node} = lastAction;
                    node.x = x;
                    node.y = y;
                    break;
                }
            }
        }
    }

}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
