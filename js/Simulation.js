
var QUAD_VERTEX_SOURCE = [
    'precision highp float;',
    
    'attribute vec3 a_position;',

    'uniform mat4 u_projection;',
    'uniform mat4 u_view;',
    'uniform mat4 u_model;',

    'void main (void) {',
        'gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);',
    '}',
].join('\n');

var QUAD_FRAGMENT_SOURCE = [
    'precision highp float;',

    'uniform vec3 u_color;',

    'void main (void) {',
        'gl_FragColor = vec4(u_color, 1.0);',
    '}',
].join('\n');

var Simulator = function(canvas, width, height) {
    var canvas = canvas;
    canvas.width = width;
    canvas.height = height;

    var rotationAngle = 0.0;

    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    gl.clearColor.apply(gl, CLEAR_COLOR);
    gl.enable(gl.DEPTH_TEST);

    var quadProgram = gl.createProgram();
    var quadProgram = buildProgramWrapper(gl,
        buildShader(gl, gl.VERTEX_SHADER, QUAD_VERTEX_SOURCE),
        buildShader(gl, gl.FRAGMENT_SHADER, QUAD_FRAGMENT_SOURCE),
        {"a_position" : 0});

    var quadColor = new Float32Array([0.9, 0.9, 0.9]);
    var outlineColor = new Float32Array([0.1, 0.1, 0.1]);
    
    gl.enableVertexAttribArray(0);

    var cubeData = new Float32Array([
        -0.5,  0.5, -0.5,
        -0.5,  0.5,  0.5,
         0.5,  0.5,  0.5,
         0.5,  0.5, -0.5,

        -0.5, -0.5, -0.5,
         0.5, -0.5, -0.5,
         0.5, -0.5,  0.5,
        -0.5, -0.5,  0.5,
    ]);

    var cubeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeData, gl.STATIC_DRAW);

    var cubeIndices = new Int32Array([
        0, 3, 1,  3, 1, 2, // Top
        1, 2, 7,  2, 7, 6, // Front
        0, 1, 4,  1, 4, 7, // Left
        4, 5, 7,  5, 7, 6, // Bottom
        0, 3, 4,  3, 4, 5, // Back
        2, 3, 6,  3, 6, 5, // Right
    ]);

    var cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

    var cubeOutlineIndices = new Int32Array([
        0, 1,  1, 2,  2, 3,  3, 0,
        1, 7,  7, 6,  6, 2,  2, 1,
        0, 4,  4, 7,  7, 1,  1, 0,
        4, 5,  5, 6,  6, 7,  7, 4,
        0, 3,  3, 5,  5, 4,  4, 0,
        2, 3,  3, 5,  5, 6,  6, 2,
    ]);

    var cubeOutlineIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeOutlineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeOutlineIndices), gl.STATIC_DRAW);

    this.resize = function (width, height) {
        canvas.width = width;
        canvas.height = height;
    };
    
    this.render = function(deltaTime, projectionMatrix, viewMatrix) {
        rotationAngle += deltaTime;

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(quadProgram.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * SIZE_OF_FLOAT, 0);

        var modelMatrix = makeIdentityMatrix(new Float32Array(16));
        var xRotationMatrix = new Float32Array(16);
        var yRotationMatrix = new Float32Array(16);
        makeXRotationMatrix(xRotationMatrix, rotationAngle / 3.);
        makeYRotationMatrix(yRotationMatrix, rotationAngle);
        premultiplyMatrix(modelMatrix, modelMatrix, xRotationMatrix);
        premultiplyMatrix(modelMatrix, modelMatrix, yRotationMatrix);

        gl.uniformMatrix4fv(quadProgram.uniformLocations['u_projection'], false, projectionMatrix);
        gl.uniformMatrix4fv(quadProgram.uniformLocations['u_view'], false, viewMatrix);
        gl.uniformMatrix4fv(quadProgram.uniformLocations['u_model'], false, modelMatrix);

        gl.uniform3fv(quadProgram.uniformLocations['u_color'], quadColor);

        // Draw Cube Faces
        gl.polygonOffset(1, 0);
        gl.enable(gl.POLYGON_OFFSET_FILL);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
        gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

        // Draw Cube Edges
        gl.polygonOffset(0, 0);
        gl.disable(gl.POLYGON_OFFSET_FILL);

        gl.uniform3fv(quadProgram.uniformLocations['u_color'], outlineColor);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeOutlineIndexBuffer);
        gl.drawElements(gl.LINES, cubeOutlineIndices.length, gl.UNSIGNED_SHORT, 0);
    }
}
