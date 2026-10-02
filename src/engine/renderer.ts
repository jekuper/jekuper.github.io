import { BACKGROUND, LINK } from './config';

const POINT_FLOATS = 7; // x, y, r, g, b, a, size
const LINE_FLOATS = 12; // ax, ay, bx, by, rgba at a, rgba at b

/** CPU side vertex data for one frame. Colors are 0-255, alpha 0-1. */
export class DrawBatch {
  points = new Float32Array(POINT_FLOATS * 8192);
  pointCount = 0;
  lines = new Float32Array(LINE_FLOATS * 8192);
  lineCount = 0;

  reset(): void {
    this.pointCount = 0;
    this.lineCount = 0;
  }

  point(x: number, y: number, r: number, g: number, b: number, size: number): void {
    let o = this.pointCount * POINT_FLOATS;
    if (o + POINT_FLOATS > this.points.length) this.points = grow(this.points);
    const p = this.points;
    p[o++] = x;
    p[o++] = y;
    p[o++] = r;
    p[o++] = g;
    p[o++] = b;
    p[o++] = 1;
    p[o] = size;
    this.pointCount++;
  }

  line(
    ax: number, ay: number, bx: number, by: number,
    ar: number, ag: number, ab: number,
    br: number, bg: number, bb: number,
    alpha: number,
  ): void {
    let o = this.lineCount * LINE_FLOATS;
    if (o + LINE_FLOATS > this.lines.length) this.lines = grow(this.lines);
    const l = this.lines;
    l[o++] = ax;
    l[o++] = ay;
    l[o++] = bx;
    l[o++] = by;
    l[o++] = ar;
    l[o++] = ag;
    l[o++] = ab;
    l[o++] = alpha;
    l[o++] = br;
    l[o++] = bg;
    l[o++] = bb;
    l[o] = alpha;
    this.lineCount++;
  }
}

function grow(a: Float32Array): Float32Array {
  const b = new Float32Array(a.length * 2);
  b.set(a);
  return b;
}

const POINT_VS = `#version 300 es
in vec2 a_pos;
in vec4 a_color;
in float a_size;
uniform vec2 u_resolution;
uniform vec2 u_offset;
out vec4 v_color;
void main() {
  vec2 clip = a_pos / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x + u_offset.x, -clip.y + u_offset.y, 0.0, 1.0);
  gl_PointSize = a_size;
  v_color = vec4(a_color.rgb / 255.0, a_color.a);
}`;

// Each segment is an instanced quad; a_corner.x runs along it, a_corner.y across.
const LINE_VS = `#version 300 es
in vec2 a_corner;
in vec2 a_from;
in vec2 a_to;
in vec4 a_colorFrom;
in vec4 a_colorTo;
uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_width;
out vec4 v_color;
void main() {
  vec2 axis = a_to - a_from;
  vec2 normal = normalize(vec2(-axis.y, axis.x));
  vec2 p = a_from + axis * a_corner.x + normal * u_width * a_corner.y;
  vec2 clip = p / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x + u_offset.x, -clip.y + u_offset.y, 0.0, 1.0);
  vec4 from = vec4(a_colorFrom.rgb / 255.0, a_colorFrom.a);
  vec4 to = vec4(a_colorTo.rgb / 255.0, a_colorTo.a);
  v_color = mix(from, to, a_corner.x);
}`;

const COLOR_FS = `#version 300 es
precision mediump float;
in vec4 v_color;
out vec4 outColor;
void main() {
  outColor = v_color;
}`;

const QUAD = new Float32Array([0, -0.5, 1, -0.5, 1, 0.5, 0, -0.5, 1, 0.5, 0, 0.5]);

interface Pass {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  buffer: WebGLBuffer;
  capacity: number;
  resolution: WebGLUniformLocation | null;
  offset: WebGLUniformLocation | null;
}

export class Renderer {
  private gl: WebGL2RenderingContext;
  private points: Pass | null = null;
  private lines: Pass | null = null;
  private lineWidth: WebGLUniformLocation | null = null;
  private width = 1;
  private height = 1;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance', antialias: false });
    if (!gl) throw new Error('WebGL2 is not supported');
    this.gl = gl;
    this.init();
  }

  /** (Re)creates GPU resources, also after a lost context is restored. */
  init(): void {
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(BACKGROUND.r / 255, BACKGROUND.g / 255, BACKGROUND.b / 255, 1);

    const pointProgram = link(gl, POINT_VS, COLOR_FS);
    this.points = createPass(gl, pointProgram, (stride) => {
      attrib(gl, pointProgram, 'a_pos', 2, stride, 0, 0);
      attrib(gl, pointProgram, 'a_color', 4, stride, 2, 0);
      attrib(gl, pointProgram, 'a_size', 1, stride, 6, 0);
    }, POINT_FLOATS);

    const lineProgram = link(gl, LINE_VS, COLOR_FS);
    this.lines = createPass(gl, lineProgram, (stride) => {
      attrib(gl, lineProgram, 'a_from', 2, stride, 0, 1);
      attrib(gl, lineProgram, 'a_to', 2, stride, 2, 1);
      attrib(gl, lineProgram, 'a_colorFrom', 4, stride, 4, 1);
      attrib(gl, lineProgram, 'a_colorTo', 4, stride, 8, 1);
      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
      attrib(gl, lineProgram, 'a_corner', 2, 0, 0, 0);
    }, LINE_FLOATS);
    this.lineWidth = gl.getUniformLocation(lineProgram, 'u_width');
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  /** Offsets are in clip space and implement screen shake. */
  draw(batch: DrawBatch, offsetX: number, offsetY: number): void {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (gl.isContextLost() || !this.points || !this.lines) return;

    if (batch.pointCount > 0) {
      this.bind(this.points, batch.points, batch.pointCount * POINT_FLOATS, offsetX, offsetY);
      gl.drawArrays(gl.POINTS, 0, batch.pointCount);
    }
    if (batch.lineCount > 0) {
      this.bind(this.lines, batch.lines, batch.lineCount * LINE_FLOATS, offsetX, offsetY);
      gl.uniform1f(this.lineWidth, LINK.width);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, batch.lineCount);
    }
    gl.bindVertexArray(null);
  }

  dispose(): void {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private bind(pass: Pass, data: Float32Array, floats: number, offsetX: number, offsetY: number): void {
    const gl = this.gl;
    gl.useProgram(pass.program);
    gl.bindVertexArray(pass.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, pass.buffer);
    if (floats > pass.capacity) {
      pass.capacity = data.length;
      gl.bufferData(gl.ARRAY_BUFFER, pass.capacity * 4, gl.DYNAMIC_DRAW);
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, floats);
    gl.uniform2f(pass.resolution, this.width, this.height);
    gl.uniform2f(pass.offset, offsetX, offsetY);
  }
}

function createPass(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  setup: (stride: number) => void,
  floatsPerItem: number,
): Pass {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  setup(floatsPerItem * 4);
  gl.bindVertexArray(null);
  return {
    program,
    vao,
    buffer,
    capacity: 0,
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    offset: gl.getUniformLocation(program, 'u_offset'),
  };
}

/** Binds an attribute of the currently bound ARRAY_BUFFER. Offset is in floats. */
function attrib(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  size: number,
  stride: number,
  offset: number,
  divisor: number,
): void {
  const loc = gl.getAttribLocation(program, name);
  if (loc < 0) return;
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset * 4);
  gl.vertexAttribDivisor(loc, divisor);
}

function link(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader compile failed: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}
