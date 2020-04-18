window.addEventListener('load', (event) => {
    window.Teacher = {
        defaultOptions: {
            canvasId: 'canvas',
        },
    
    
        ctx: null,
        canvas: null,
        nodes: [],
        animationFrameId: null,
        currentNode: null,
        isMouseDown: false,
    
        init: function (options = {}) {
            this.onMouseDown = this.onMouseDown.bind(this);
            this.onMouseMove = this.onMouseMove.bind(this);
            this.onMouseUp = this.onMouseUp.bind(this);
            this.draw = this.draw.bind(this);

            options = Object.assign(this.defaultOptions, options);
    
            this.canvas = document.getElementById(options.canvasId);
            this.ctx = this.canvas.getContext('2d');

            this.canvas.addEventListener("mousedown", this.onMouseDown);
            this.canvas.addEventListener("mousemove", this.onMouseMove);
            this.canvas.addEventListener("mouseup", this.onMouseUp);
            
            this.start();
            return this;
        },
    
        start: function () {
            this.nodes = [];
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
    
        onMouseDown: function (event) {
            event.preventDefault();
            var x = event.x;
            var y = event.y;
            x -= this.canvas.offsetLeft;
            y -= this.canvas.offsetTop;
            this.isMouseDown = true;

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
                    prevNode.addChild(node);
                    Node.selectedNodeId = null;
                } else {
                    Node.selectedNodeId = node.id == Node.selectedNodeId ? null : node.id;
                }
          
            } else {
                const newNode = new Node(x, y)
                if (Node.selectedNodeId !== null) {
                    const prevNode = this.nodes.find(n => n.id === Node.selectedNodeId);
                    prevNode.addChild(newNode);
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
     
            if (this.isMouseDown && Node.selectedNodeId) {
                const node = this.nodes.find(n => n.id === Node.selectedNodeId);
                node.x = x;
                node.y = y;
            }
         
        },
    
        onMouseUp: function (event) {
            event.preventDefault();
            this.isMouseDown = false;
           
            // Node.selectedNodeId = null;
        }
    }.init();
});




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
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(child.x, child.y);
            ctx.stroke();
        }
    }

    addChild(node) {
        this.adjacentNodes.push(node);
    }

}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
