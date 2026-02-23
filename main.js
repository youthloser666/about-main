/* ══════════════════════════════════════
   1. SHADER — raw WebGL on header canvas
══════════════════════════════════════ */
(function initShader() {
  const canvas = document.getElementById('shader-canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) return;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const VS = `
    precision highp float;
    attribute vec2 a_pos;
    void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const FS = `
    precision highp float;
    uniform float u_time;
    uniform vec2  u_res;

    float cheapNoise(vec3 stp){
      vec3 p = vec3(stp.st, stp.p);
      vec4 a = vec4(5.0, 7.0, 9.0, 13.0);
      return mix(
        sin(p.z + p.x*a.x + cos(p.x*a.x - p.z)) *
        cos(p.z + p.y*a.y + cos(p.y*a.x + p.z)),
        sin(1.0 + p.x*a.z + p.z + cos(p.y*a.w - p.z)) *
        cos(1.0 + p.y*a.w + p.z + cos(p.x*a.x + p.z)),
        0.436
      );
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      uv.y    = 1.0 - uv.y;
      float ar = u_res.x / u_res.y;
      vec2 st  = uv * vec2(ar, 1.0) * 0.4;

      float S = sin(u_time * 0.005);
      float C = cos(u_time * 0.005);

      vec2 v1 = vec2(cheapNoise(vec3(st, 2.0)), cheapNoise(vec3(st, 1.0)));
      vec2 v2 = vec2(
        cheapNoise(vec3(st + 1.0*v1  + vec2(C*1.7, S*9.2),  0.15 *u_time)),
        cheapNoise(vec3(st + -1.0*v1 + vec2(S*8.3, C*2.8),  0.126*u_time))
      );
      float n = 0.5 + 0.5 * cheapNoise(vec3(st + v2, 0.0));

      /* Moonless Night — dark warm palette */
      vec3 c1 = vec3(0.115, 0.105, 0.145);
      vec3 c2 = vec3(0.195, 0.175, 0.225);
      vec3 c3 = vec3(0.140, 0.150, 0.200);
      vec3 c4 = vec3(0.085, 0.078, 0.100);

      vec3 color = mix(c1, c2, clamp(n*n*8.0, 0.0, 1.0));
      color = mix(color, c3, clamp(length(v1),   0.0, 1.0));
      color = mix(color, c4, clamp(length(v2.x), 0.0, 1.0));
      color /= n*n + n*7.0;

      /* Subtle Electric Blue tint in dark areas */
      color += vec3(0.035, 0.055, 0.115) * (1.0 - n);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function mkShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const posLoc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes = gl.getUniformLocation(prog, 'u_res');

  const t0 = performance.now();
  const TIME_SCALE = 0.01;  /* slow the shader down */
  (function frame() {
    gl.uniform1f(uTime, (performance.now() - t0) * TIME_SCALE);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  })();
})();

/* ══════════════════════════════════════
   2. CUSTOM CURSOR
══════════════════════════════════════ */
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mx = -200, my = -200;
let rx = -200, ry = -200;

function getCursorOffset(el) {
  return el.offsetWidth / 2;
}

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  const off = getCursorOffset(cursor);
  gsap.to(cursor, { left: mx - off, top: my - off, duration: 0.06, ease: 'none' });
});

gsap.ticker.add(() => {
  rx += (mx - rx) * 0.10;
  ry += (my - ry) * 0.10;
  const off = getCursorOffset(cursorRing);
  gsap.set(cursorRing, { left: rx - off, top: ry - off });
});

document.querySelectorAll('a, button, img').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ══════════════════════════════════════
   3. GSAP ENTRANCE TIMELINE
══════════════════════════════════════ */
document.addEventListener('contextmenu', e => e.preventDefault());

gsap.timeline({ defaults: { ease: 'power3.out' } })
  .to('.card', {
    opacity: 1, y: 0, duration: 0.85
  })
  .from('.profile-row', {
    opacity: 0, x: -14, duration: 0.55
  }, '-=0.45')
  .to('ul li a', {
    opacity: 1, x: 0, duration: 0.48,
    stagger: 0.07
  }, '-=0.25')
  .to('.card-footer', {
    opacity: 1, duration: 0.38
  }, '-=0.1');

/* ══════════════════════════════════════
   4. GSAP HOVER — link magnetic slide
══════════════════════════════════════ */
document.querySelectorAll('ul li a').forEach(link => {
  link.addEventListener('mouseenter', () => {
    gsap.to(link, { x: 5, duration: 0.22, ease: 'power2.out' });
  });
  link.addEventListener('mouseleave', () => {
    gsap.to(link, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.55)' });
  });
});

/* ══════════════════════════════════════
   5. AVATAR SWAP
══════════════════════════════════════ */
const img = document.getElementById('profile-img');
img.addEventListener('mouseenter', () => {
  gsap.to(img, { scale: 1.07, duration: 0.22, ease: 'power2.out' });
  img.src = 'img/uwu.gif';
});
img.addEventListener('mouseleave', () => {
  gsap.to(img, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' });
  img.src = 'img/pp.png';
});