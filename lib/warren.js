define([
    "../bower_components/lodash/lodash",
    "../bower_components/d3/d3.min.js"
], function(
    _,
    d3
) {
    return function WarrenGraph(options) {
        var parentEl = options.parentEl;
        var data = options.data;

        var graphWidth = parentEl.offsetWidth;
        var graphHeight = parentEl.offsetHeight;

        var svg = d3.select(parentEl).append("svg")
            .attr("width", graphWidth)
            .attr("height", graphHeight);

        var nodeRadius = 100;

        var processData = function(data, width, height, mode) {
            var calculateLayout = function(maxPeerCount, maxDepth) {
                var xOffset = width / (maxDepth + 1) / 2;
                var yOffset = height / maxPeerCount;
                console.log("Height", height, yOffset)
                return {
                    xOffset: xOffset,
                    yOffset: yOffset,
                    nodeRadius: Math.min(xOffset, yOffset) / 2
                }
            };

            // Get unique nodes as objects
            var individualNodes = 
                _(data)
                .flatten()
                .uniq()
                .reduce(
                    function(memo, n) { 
                        memo[n] = { name: n, children: [], parents: [], leaf: false };
                        return memo;
                    }, 
                {});
            
            // Calculate and include relations
            _.forEach(data, function(n) { 
                var child = individualNodes[n[0]];
                var parent = individualNodes[n[1]];
                if (!_.contains(child.parents, parent)) {
                    child.parents.push(parent);
                }
                if (!_.contains(parent.children, child)) {
                    parent.children.push(child);
                }
            });

            // Calculate max amount of children
            var maxChildren = _.reduce(individualNodes, function(memo, n) { return Math.max(memo, n.children.length); }, 0);

            // TODO though not sure if necessary
            // Calculate max depth
            var calculateDepth = function calculateDepth(sum, node) {
                // TODO: prevent circular dependencies
                if (_.isEmpty(node.parents)) {
                    node.depth = 0;
                    return 0;
                }
                var childSum = node.parents.map(calculateDepth.bind(null, sum));
                var depth = 1 + _.max(childSum)
                node.depth = depth;
                return depth;
            }
            
            var maxDepth = _.max(_.map(individualNodes, calculateDepth.bind(null, 0)));

            // Calculate and mark the node count on the same depth
            var peerIndex = _.range(maxDepth + 1).map(function(n) { return 0; });
            _.forEach(individualNodes, function(n) {
                var myDepth = n.depth;
                var myPeerCount = _.filter(individualNodes, function(other) {
                    return other.depth === myDepth;
                }).length;
                n.peerCount = myPeerCount;
                n.peerIndex = peerIndex[n.depth];
                ++peerIndex[n.depth];
            });

            var maxPeerCount = _.max(_.pluck(individualNodes, "peerCount"));

            var layoutParams = calculateLayout(maxPeerCount, maxDepth);

            _.each(individualNodes, function(node) {
                node.y = (1 + node.depth) * layoutParams.xOffset + node.depth * layoutParams.xOffset;
                node.x = layoutParams.yOffset / 2 + node.peerIndex * layoutParams.yOffset;
                node.radius = layoutParams.nodeRadius;
            });

            return {
                nodes: individualNodes,
                maxChildren: maxChildren,
                maxDepth: maxDepth,
                maxPeerCount: maxPeerCount
            };
        }

        var drawNodes = function(nodeData) {
            console.log("Drawing nodes", nodeData);
            svg.selectAll(".warren__node")
                .data(nodeData)
                .enter()
                .append("circle")
                .attr("class", "warren__node")
                .attr("cx", function(n, i) { return n.x; })
                .attr("cy", function(n, i) { return n.y; })
                .attr("r", 0)
                .transition()
                .duration(function(n, i) { return (i + 1) * 200; })
                .attr("r", function(n, i) { return n.radius; });

            svg.selectAll(".warren__text")
                .data(nodeData)
                .enter()
                .append("text")
                .attr("class", "warren__text")
                .attr("text-anchor", "middle")
                .attr("x", function(n, i) { return n.x; })
                .attr("y", function(n, i) { return n.y; })
                .attr("font-size", "0px")
                .text(function(n) { return n.name; })
                .transition()
                .duration(function(n, i) { return (i + 1) * 200; })
                .attr("font-size", "13px");


        };

        var drawLines = function(nodeData) {
            _.forEach(nodeData, function(n) {
                _.forEach(n.children, function(child) {
                    svg
                        .append("line")
                        .attr("class", "warren__line")
                        .attr("x1", n.x)
                        .attr("y1", n.y)
                        .attr("x2", child.x)
                        .attr("y2", child.y);
                })
                
            });
        }

        var processedData = processData(data, graphWidth, graphHeight);
        // Lines have to be drawn first for proper overlay
        drawLines(_.values(processedData.nodes));
        drawNodes(_.values(processedData.nodes));
    };

});