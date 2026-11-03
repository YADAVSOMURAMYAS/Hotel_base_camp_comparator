import Drawer from './components/Drawer'
import Plan from './components/Plan'
import StepIndicator from './components/Plan/StepIndicator'
import Results from './components/Results'
import TopBar from './components/TopBar'
import PillButton from './components/ui/PillButton'
import { ComparatorProvider } from './state/ComparatorContext'
import { useViewMode } from './state/useViewMode'

/** Plan screen to set up a trip; Results to read it. On Results, Edit opens the same Plan steps in a drawer. */
function Screens() {
  const view = useViewMode()
  const planning = view.mode === 'plan'
  return (
    <div className="app">
      {/* Everything behind the drawer is inert, so focus and clicks cannot reach it. */}
      <div inert={view.drawerOpen}>
        <TopBar>
          {planning ? (
            <StepIndicator />
          ) : (
            <PillButton
              variant="secondary"
              aria-haspopup="dialog"
              onClick={view.openDrawer}
            >
              <span aria-hidden="true">✎</span> Edit
            </PillButton>
          )}
        </TopBar>
        <main key={view.mode} className="app-main screen">
          {planning ? (
            <Plan onCompare={view.showResults} />
          ) : (
            <Results onEdit={view.openDrawer} />
          )}
        </main>
      </div>
      {view.drawerOpen && (
        <Drawer title="Edit your trip" onClose={view.closeDrawer}>
          <Plan variant="drawer" onCompare={view.closeDrawer} />
        </Drawer>
      )}
    </div>
  )
}

export default function App() {
  return (
    <ComparatorProvider>
      <Screens />
    </ComparatorProvider>
  )
}
