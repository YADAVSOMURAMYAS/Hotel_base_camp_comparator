import CityMap from './components/CityMap'
import Controls from './components/Controls'
import DevPanel from './components/DevPanel'
import ExplanationPanel from './components/ExplanationPanel'
import HotelRanking from './components/HotelRanking'
import StatusBanner from './components/StatusBanner'
import TravelMatrixTable from './components/TravelMatrixTable'
import { ComparatorProvider } from './state/ComparatorContext'

export default function App() {
  return (
    <ComparatorProvider>
      <div className="app">
        <header className="app-header">
          <h1>Hotel Base-Camp Comparator</h1>
        </header>
        <div className="area-controls">
          <Controls />
          <StatusBanner />
        </div>
        <main className="area-map">
          <CityMap />
        </main>
        <div className="area-ranking">
          <HotelRanking />
        </div>
        <div className="area-explanation">
          <ExplanationPanel />
        </div>
        <div className="area-table">
          <TravelMatrixTable />
        </div>
        <div className="area-dev">
          <DevPanel />
        </div>
      </div>
    </ComparatorProvider>
  )
}
