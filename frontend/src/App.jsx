import { useState } from 'react'
import './App.css'
import ResourceDashboard from './components/ResourceDashboard'
import { resourceConfigs, supportResources } from './config/resources'

function App() {
  const [activeKey, setActiveKey] = useState(resourceConfigs[0].key)
  const activeConfig = resourceConfigs.find((resource) => resource.key === activeKey)

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">PPSA Project</p>
          <h2>Dashboard CRUD</h2>
          <p className="sidebar-copy">Frontend React terhubung ke API Laravel.</p>
        </div>

        <nav className="resource-nav" aria-label="Resource">
          {resourceConfigs.map((resource) => (
            <button
              key={resource.key}
              type="button"
              className={resource.key === activeKey ? 'active' : ''}
              onClick={() => setActiveKey(resource.key)}
            >
              {resource.label}
            </button>
          ))}
        </nav>
      </aside>

      <ResourceDashboard
        config={activeConfig}
        resourceConfigs={resourceConfigs}
        supportResources={supportResources}
      />
    </main>
  )
}

export default App
