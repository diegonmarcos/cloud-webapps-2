import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

// Static SPA — no backend. Boards persist locally in the browser (IndexedDB)
// keyed by persistenceKey; nothing is shared across devices. See build.json.
export default function App() {
  return (
    <div className="tldraw-root">
      <Tldraw persistenceKey="tldraw-diegonmarcos" />
    </div>
  )
}
