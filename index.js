import { WebAI, cv, ort } from './src/webai.mjs'

window.WebAI = WebAI
window.cv = cv
window.ort = ort

export { WebAI as default, WebAI, cv, ort}
