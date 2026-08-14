// JSDOM / HTMLIFrameElement prototype polyfill for Node 24 JSDOM compatibility
class HTMLIFrameElementMock {}
class SelectionMock {}

const g = globalThis as any
g.HTMLIFrameElement = g.HTMLIFrameElement || HTMLIFrameElementMock
g.Selection = g.Selection || SelectionMock

if (typeof window !== 'undefined') {
  const w = window as any
  w.HTMLIFrameElement = w.HTMLIFrameElement || HTMLIFrameElementMock
  w.Selection = w.Selection || SelectionMock
}

if (typeof global !== 'undefined') {
  const gl = global as any
  gl.HTMLIFrameElement = gl.HTMLIFrameElement || HTMLIFrameElementMock
  gl.Selection = gl.Selection || SelectionMock
}
