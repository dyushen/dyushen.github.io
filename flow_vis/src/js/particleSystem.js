/* author: Andrew Burks */
"use strict";

/* Get or create the application global variable */
var App = App || {};

const ParticleSystem = function() {
    var tooltip = d3.select('.cutDiv').append("div").attr("class","tooltip");
    var tooltipOffset = {x: 5, y: -25};
    // setup the pointer to the scope 'this' variable
    const self = this;

    // data container
    const data = [];

    // scene graph group for the particle system
    const sceneObject = new THREE.Group();

    // bounds of the data
    const bounds = {};
    
    //save two colors
    const color1 = [];
    const color2 = [];
    
    var rangeslider = document.getElementById("zvalue");
    var output = document.getElementById("showzvalue");
    output.innerHTML = rangeslider.value;
    var fixz =0;
    
    var checkbox = document.getElementById("Brushing");
    
    var rangeslider2 = document.getElementById("bandwidth");
    var output2 = document.getElementById("showbandwidth");
    output2.innerHTML = rangeslider2.value;
    var bandwidth = 0.05;

    
    var color = d3.scaleLinear()
                  .domain([0,357.19])
                  .range(["#c994c7", "#67001f"]);
    var greycolor = d3.scaleLinear()
                  .domain([0,357.19])
                  .range(["#bdbdbd", "#252525"]);
    var legend = d3.legendColor()
                   //.title('Concentration')
                   .labelFormat(d3.format(".0f"))
                   .shapeWidth(30)
                   .cells(10)
                   .orient('horizontal')
                   .scale(color);
    var width = 600;
    var height = width;
    var xScale = d3.scaleLinear()
                   .domain([-5, 5])
                   .range([0.7*width+100,100]);
    var yScale = d3.scaleLinear()
                   .domain([0, 10])
                   .range([0.7*height+100,100]);
    
    //create svg
    const svg = d3.create("svg").attr("width", 600).attr("height", 600);
    

    // creates the particle system
    self.createParticleSystem = function() {
      var geometry = new THREE.Geometry();
      for (var i = 0; i < data.length; i++) {
        //point info
        var vertex = new THREE.Vector3();
        vertex.x = 1.5*data[i].X;
        vertex.y = 1.5*(data[i].Z-5);
        vertex.z = 1.5*(data[i].Y);
        geometry.vertices.push(vertex);
        //color info
        color1.push(new THREE.Color(color(data[i].concentration)));
        color2.push(new THREE.Color(greycolor(data[i].concentration)));
        //geometry.colors.push(new THREE.Color(color(data[i].concentration)));
        geometry.colors=color1;
      }
      var material = new THREE.PointsMaterial( { size: 0.1, vertexColors: true } );
      self.particles = new THREE.Points(geometry,material);
      sceneObject.add(self.particles);
    };
    
    // creates the particle system for fixz
    self.createParticleSystemfixz = function(z,b) {
      sceneObject.remove(self.particlesfixz);
      var dataf=data.filter( d => d.Y <= z+b && d.Y >= z-b)
      var geometry = new THREE.Geometry();
      for (var i = 0; i < dataf.length; i++) {
        //point info
        var vertex = new THREE.Vector3();
        vertex.x = 1.5*dataf[i].X;
        vertex.y = 1.5*(dataf[i].Z-5);
        vertex.z = 1.5*(dataf[i].Y);
        geometry.vertices.push(vertex);
        //color info
        geometry.colors.push(new THREE.Color(color(dataf[i].concentration)));
      }
      var material = new THREE.PointsMaterial( { size: 0.1, vertexColors: true } );
      self.particlesfixz = new THREE.Points(geometry,material);
      sceneObject.add(self.particlesfixz);
    };
    
    //create a xy-surface
    self.createlines = function() {
        var materiall = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 5} );
        var points = [];
        points.push( new THREE.Vector3( -8, -8, fixz ) );
        points.push( new THREE.Vector3( -8, 8, fixz ) );
        points.push( new THREE.Vector3( 8, 8, fixz ) );
        points.push( new THREE.Vector3( 8, -8, fixz ) );
        points.push( new THREE.Vector3( -8, -8, fixz ) );
        var geometryl = new THREE.BufferGeometry().setFromPoints( points );
        self.line = new THREE.Line( geometryl, materiall );
        sceneObject.add(self.line);
    };
    
    //create 2d view
    self.createcutview = function(z,b) {
      //color for the pointcloud
        document.querySelectorAll('.cutpoint').forEach(e => e.remove());
        svg.append("g")
           .attr("transform", "translate(0,0)")
           .call(legend)
           .selectAll("circle")
           .data(data.filter( d => d.Y <= z+b && d.Y >= z-b))
           .enter()
           .append("circle")
           .attr('cx', function(d) {return xScale(d.X);})
           .attr('cy', function(d) {return yScale(d.Z);})
           .attr('fill', function(d) {return color(d.concentration);})
           .attr('class','cutpoint')
           .attr("r", 1.5)
           .on("mouseover",showTooltip)
           .on("mousemove",moveTooltip)
           .on("mouseout",hideTooltip);

    };

    // data loading function
    self.loadData = function(file){
        // read the csv file
        d3.csv(file)
        // iterate over the rows of the csv file
            //.row(function(d) {
          .then(function(temp) {
              temp.forEach(function(d) {
                // get the min bounds
                bounds.minX = Math.min(bounds.minX || Infinity, d.Points0);
                bounds.minY = Math.min(bounds.minY || Infinity, d.Points1);
                bounds.minZ = Math.min(bounds.minZ || Infinity, d.Points2);

                // get the max bounds
                bounds.maxX = Math.max(bounds.maxX || -Infinity, d.Points0);
                bounds.maxY = Math.max(bounds.maxY || -Infinity, d.Points1);
                bounds.maxZ = Math.max(bounds.maxY || -Infinity, d.Points2);

                // add the element to the data collection
                data.push({
                    // concentration density
                    concentration: Number(d.concentration),
                    // Position
                    X: Number(d.Points0),
                    Y: Number(d.Points1),
                    Z: Number(d.Points2),
                    // Velocity
                    U: Number(d.velocity0),
                    V: Number(d.velocity1),
                    W: Number(d.velocity2)});
              });
              self.createlines();
              self.createParticleSystem();
              self.createParticleSystemfixz(0,0.05);
              self.createcutview(0,0.05);
              });
    };
    
    
    //tooltip
    //show tooltip
    function showTooltip(d) {
      moveTooltip();
        tooltip.style("display","block")
                  .html('<div style="float: left; text-align: left; font-size: 15px; font-weight:bold">'+
                        'X: ' + d.X +'<br/>'+
                        'Y: ' + d.Z +'<br/>'+
                        'Z: ' + d.Y +'<br/>'+
                        'Xvelocity: ' + d.U +'<br/>'+
                        'Yvelocity: ' + d.W +'<br/>'+
                        'Zvelocity: ' + d.V +'<br/>'+
                        'Concentration: ' + d.concentration +'<br/>'+'</div>');
        
    };
    //Move the tooltip to track the mouse
    function moveTooltip() {
      tooltip.style("top",(d3.event.pageY+tooltipOffset.y)+"px")
          .style("left",(d3.event.pageX+tooltipOffset.x)+"px");
    };

    //Create a tooltip, hidden at the start
    function hideTooltip() {
      tooltip.style("display","none");
    };
    
    
    //react
    rangeslider.oninput = function() {
      output.innerHTML = this.value;
      fixz = Number(this.value);
      self.line.position.z=1.5*fixz;
      self.createcutview(fixz,bandwidth);
      self.createParticleSystemfixz(fixz,bandwidth);
     };
    rangeslider2.oninput = function() {
      output2.innerHTML = this.value;
      bandwidth = Number(this.value);
      self.createcutview(fixz,bandwidth);
      self.createParticleSystemfixz(fixz,bandwidth);
     };
    checkbox.oninput = function() {
        var brush= this.checked;
        if (brush) {
            self.particles.geometry.colors = color2;
            self.particles.geometry.colorsNeedUpdate=true;
        }else {
            self.particles.geometry.colors = color1;
            self.particles.geometry.colorsNeedUpdate=true;
        };
    };
    
    

    // publicly available functions
    self.public = {

        // load the data and setup the system
        initialize: function(file){
            self.loadData(file);
        },

        // accessor for the particle system
        getParticleSystems : function() {
            return sceneObject;
        },
        getcutview : function() {
            return svg;
        }

    };

    return self.public;

};
