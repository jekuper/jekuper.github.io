import { BACKGROUND, LINK } from './config';

const POINT_FLOATS = 7; // x, y, r, g, b, a, size
const LINE_FLOATS = 12; // ax, ay, bx, by, rgba at a, rgba at b

function grow(a: Float32Array): Float32Array {
  const b = new Float32Array(a.length * 2);
  b.set(a);
  return b;
}

export class PointList {
  data: Float32Array = new Float32Array(POINT_FLOATS * 8192);
  count = 0;

  push(x: number, y: number, r: number, g: number, b: number, a: number, size: number): void {
    let o = this.count * POINT_FLOATS;
    if (o + POINT_FLOATS > this.data.length) this.data = grow(this.data);
    const p = this.data;
    p[o++] = x;
    p[o++] = y;
    p[o++] = r;
    p[o++] = g;
    p[o++] = b;
    p[o++] = a;
    p[o] = size;
    this.count++;
  }
}

/** CPU side vertex data for one frame, in world device pixels. Colors are 0-255, alpha 0-1. */
export class DrawBatch {
  /** Blended normally. */
  points = new PointList();
  /** Blended additively, so overlapping dots brighten. */
  glow = new PointList();
  lines: Float32Array = new Float32Array(LINE_FLOATS * 8192);
  lineCount = 0;

  reset(): void {
    this.points.count = 0;
    this.glow.count = 0;
    this.lineCount = 0;
  }

  point(x: number, y: number, r: number, g: number, b: number, size: number): void {
    this.points.push(x, y, r, g, b, 1, size);
  }

  line(
    ax: number, ay: number, bx: number, by: number,
    ar: number, ag: number, ab: number,
    br: number, bg: number, bb: number,
    alpha: number,
    alphaB = alpha,
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
    l[o] = alphaB;
    this.lineCount++;
  }
}

/** Where the viewport sits in the world, plus a clip-space shake offset. */
export interface View {
  x: number;
  y: number;
  shakeX: number;
  shakeY: number;
}

// A negative size marks a round dot; squares are the default look.
const POINT_VS = `#version 300 es
in vec2 a_pos;
in vec4 a_color;
in float a_size;
uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform vec2 u_offset;
out vec4 v_color;
out float v_round;
void main() {
  vec2 clip = (a_pos - u_camera) / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x + u_offset.x, -clip.y + u_offset.y, 0.0, 1.0);
  gl_PointSize = abs(a_size);
  v_round = a_size < 0.0 ? 1.0 : 0.0;
  v_color = vec4(a_color.rgb / 255.0, a_color.a);
}`;

const POINT_FS = `#version 300 es
precision mediump float;
in vec4 v_color;
in float v_round;
out vec4 outColor;
void main() {
  if (v_round > 0.5 && length(gl_PointCoord - 0.5) > 0.5) discard;
  outColor = v_color;
}`;

// Each segment is an instanced quad; a_corner.x runs along it, a_corner.y across.
const LINE_VS = `#version 300 es
in vec2 a_corner;
in vec2 a_from;
in vec2 a_to;
in vec4 a_colorFrom;
in vec4 a_colorTo;
uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform vec2 u_offset;
uniform float u_width;
out vec4 v_color;
void main() {
  vec2 axis = a_to - a_from;
  vec2 normal = normalize(vec2(-axis.y, axis.x));
  vec2 p = a_from + axis * a_corner.x + normal * u_width * a_corner.y;
  vec2 clip = (p - u_camera) / u_resolution * 2.0 - 1.0;
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
  camera: WebGLUniformLocation | null;
  offset: WebGLUniformLocation | null;
}

export class Renderer {
  private gl: WebGL2RenderingContext;
  private glow: Pass | null = null;
  private points: Pass | null = null;
  private lines: Pass | null = null;
  private programs: WebGLProgram[] = [];
  private lineWidth: WebGLUniformLocation | null = null;
  private quad: WebGLBuffer | null = null;
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
    gl.clearColor(BACKGROUND.r / 255, BACKGROUND.g / 255, BACKGROUND.b / 255, 1);

    const pointProgram = link(gl, POINT_VS, POINT_FS);
    const pointLayout = (stride: number) => {
      attrib(gl, pointProgram, 'a_pos', 2, stride, 0, 0);
      attrib(gl, pointProgram, 'a_color', 4, stride, 2, 0);
      attrib(gl, pointProgram, 'a_size', 1, stride, 6, 0);
    };
    this.glow = createPass(gl, pointProgram, pointLayout, POINT_FLOATS);
    this.points = createPass(gl, pointProgram, pointLayout, POINT_FLOATS);

    const lineProgram = link(gl, LINE_VS, COLOR_FS);
    this.lines = createPass(gl, lineProgram, (stride) => {
      attrib(gl, lineProgram, 'a_from', 2, stride, 0, 1);
      attrib(gl, lineProgram, 'a_to', 2, stride, 2, 1);
      attrib(gl, lineProgram, 'a_colorFrom', 4, stride, 4, 1);
      attrib(gl, lineProgram, 'a_colorTo', 4, stride, 8, 1);
      this.quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
      attrib(gl, lineProgram, 'a_corner', 2, 0, 0, 0);
    }, LINE_FLOATS);
    this.lineWidth = gl.getUniformLocation(lineProgram, 'u_width');
    this.programs = [pointProgram, lineProgram];
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  draw(batch: DrawBatch, view: View): void {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (gl.isContextLost() || !this.glow || !this.points || !this.lines) return;

    if (batch.glow.count > 0) {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      this.bind(this.glow, batch.glow.data, batch.glow.count * POINT_FLOATS, view);
      gl.drawArrays(gl.POINTS, 0, batch.glow.count);
    }
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (batch.points.count > 0) {
      this.bind(this.points, batch.points.data, batch.points.count * POINT_FLOATS, view);
      gl.drawArrays(gl.POINTS, 0, batch.points.count);
    }
    if (batch.lineCount > 0) {
      this.bind(this.lines, batch.lines, batch.lineCount * LINE_FLOATS, view);
      gl.uniform1f(this.lineWidth, LINK.width);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, batch.lineCount);
    }
    gl.bindVertexArray(null);
  }

  /** Frees GPU objects but keeps the context, so the canvas can be reused. */
  dispose(): void {
    const gl = this.gl;
    for (const pass of [this.glow, this.points, this.lines]) {
      if (!pass) continue;
      gl.deleteVertexArray(pass.vao);
      gl.deleteBuffer(pass.buffer);
    }
    for (const program of this.programs) gl.deleteProgram(program);
    gl.deleteBuffer(this.quad);
    this.glow = this.points = this.lines = null;
    this.programs = [];
  }

  private bind(pass: Pass, data: Float32Array, floats: number, view: View): void {
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
    gl.uniform2f(pass.camera, view.x, view.y);
    gl.uniform2f(pass.offset, view.shakeX, view.shakeY);
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
    camera: gl.getUniformLocation(program, 'u_camera'),
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
