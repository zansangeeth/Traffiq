import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, Polygon, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { Plus, Trash2, MousePointer2, Flame, ChevronUp, ChevronDown, List } from 'lucide-react'

function App() {
    const [crimeData, setCrimeData] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchMode, setSearchMode] = useState('point') // 'point' | 'area'
    const [polyPoints, setPolyPoints] = useState([])
    const [selectedPoint, setSelectedPoint] = useState(null)
    const [mousePos, setMousePos] = useState(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [showHeatmap, setShowHeatmap] = useState(false)
    const [currentZoom, setCurrentZoom] = useState(13)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [date, setDate] = useState('2024-01')

    const fetchCrimeData = async (lat, lng, poly = null) => {
        try {
            setLoading(true)
            let url = `https://data.police.uk/api/crimes-street/all-crime?date=${date}`

            if (poly) {
                const polyString = poly.map(p => `${p[0]},${p[1]}`).join(':')
                url += `&poly=${polyString}`
            } else {
                url += `&lat=${lat}&lng=${lng}`
            }

            const response = await axios.get(url)
            const data = response.data || []

            // Helpful logs for cross-checking
            const uniqueLocations = new Set(data.map(c => `${c.location.latitude},${c.location.longitude}`)).size
            console.log(`📊 Data Summary: ${data.length} Total Crimes | ${uniqueLocations} Unique Locations (Markers)`)
            console.log('📦 Raw Crime Data:', data)

            setCrimeData(data)
        } catch (error) {
            console.error('❌ Error fetching UK crime data:', error)
            if (error.response?.status === 503) {
                alert('Area contains too many crimes (>10,000). Please try a smaller area.')
            }
        } finally {
            setLoading(false)
        }
    }

    const clearAll = () => {
        setCrimeData([])
        setPolyPoints([])
        setSelectedPoint(null)
        setIsDrawing(false)
        setMousePos(null)
        setShowHeatmap(false)
        setIsDrawerOpen(false)
    }

    function HeatmapLayer({ points }) {
        const map = useMap()

        useEffect(() => {
            if (!points || points.length === 0) return

            const heatData = points.map(crime => [
                parseFloat(crime.location.latitude),
                parseFloat(crime.location.longitude),
                0.5 // intensity
            ])

            const heatLayer = L.heatLayer(heatData, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
                gradient: {
                    0.4: 'rgba(0, 0, 255, 0.5)',
                    0.6: 'rgba(0, 255, 0, 0.6)',
                    0.8: 'rgba(255, 255, 0, 0.7)',
                    1.0: 'rgba(255, 0, 0, 0.8)'
                }
            }).addTo(map)

            return () => {
                map.removeLayer(heatLayer)
            }
        }, [points, map])

        return null
    }

    function MapEvents() {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng
                if (searchMode === 'point') {
                    setSelectedPoint([lat, lng])
                    setPolyPoints([])
                    fetchCrimeData(lat, lng)
                } else if (searchMode === 'area') {
                    if (polyPoints.length === 0) setIsDrawing(true)

                    if (isDrawing || polyPoints.length === 0) {
                        setPolyPoints(prev => [...prev, [lat, lng]])
                        setSelectedPoint(null)
                    }
                }
            },
            dblclick(e) {
                if (searchMode === 'area' && polyPoints.length >= 2) {
                    setIsDrawing(false)
                    setMousePos(null)
                }
            },
            mousemove(e) {
                if (searchMode === 'area' && isDrawing && polyPoints.length > 0) {
                    setMousePos([e.latlng.lat, e.latlng.lng])
                } else {
                    setMousePos(null)
                }
            },
            zoomend(e) {
                setCurrentZoom(e.target.getZoom())
            }
        })
        return null
    }

    const getCrimeColor = (category) => {
        const colors = {
            'anti-social-behaviour': '#ec4899', // Pink
            'bicycle-theft': '#f59e0b',        // Amber
            'burglary': '#7c3aed',             // Violet
            'criminal-damage-arson': '#dc2626', // Red
            'drugs': '#059669',                // Emerald
            'other-theft': '#6366f1',           // Indigo
            'possession-of-weapons': '#b91c1c', // Dark Red
            'public-order': '#ea580c',          // Orange
            'robbery': '#9f1239',               // Rose
            'shoplifting': '#2563eb',           // Blue
            'theft-from-the-person': '#4f46e5', // Indigo
            'vehicle-crime': '#0891b2',         // Cyan
            'violent-crime': '#7f1d1d',         // Maroon
            'other-crime': '#52525b'            // Zinc
        }
        return colors[category] || '#71717a'
    }

    return (
        <div className="h-screen w-screen bg-zinc-950 text-white overflow-hidden font-sans">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-[1000] p-6 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className="glass px-6 py-3 rounded-2xl pointer-events-auto shadow-2xl border border-white/10">
                        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-red-400 to-rose-600 bg-clip-text text-transparent">
                            UK Crime Watch
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Controls */}
                    <div className="glass flex p-1 rounded-xl pointer-events-auto shadow-2xl border border-white/10">
                        <button
                            onClick={() => {
                                setSearchMode('point')
                                clearAll()
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${searchMode === 'point' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <MousePointer2 size={16} />
                            Point
                        </button>
                        <button
                            onClick={() => {
                                setSearchMode('area')
                                clearAll()
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${searchMode === 'area' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <Plus size={16} />
                            Area
                        </button>
                    </div>

                    {searchMode === 'area' && polyPoints.length >= 3 && !isDrawing && (
                        <button
                            onClick={() => fetchCrimeData(null, null, polyPoints)}
                            className="glass px-4 py-2 rounded-xl pointer-events-auto bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-sm font-bold shadow-2xl transition-all hover:bg-emerald-600 hover:text-white"
                        >
                            Search Area
                        </button>
                    )}

                    {crimeData.length > 0 && (
                        <button
                            onClick={() => {
                                const newHeatMode = !showHeatmap
                                setShowHeatmap(newHeatMode)
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all pointer-events-auto border shadow-2xl ${showHeatmap ? '!bg-red-500 text-white !border-red-400' : 'glass text-zinc-400 hover:text-white border-white/10'}`}
                        >
                            <Flame size={16} className={showHeatmap ? 'animate-pulse' : ''} />
                            Heatmap
                        </button>
                    )}

                    {(selectedPoint || polyPoints.length > 0 || crimeData.length > 0) && (
                        <button
                            onClick={clearAll}
                            className="glass p-2 rounded-xl pointer-events-auto bg-zinc-800/50 text-zinc-400 border border-white/10 hover:text-red-400 transition-all shadow-2xl"
                            title="Clear all results"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}

                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold glass shadow-2xl min-w-[150px] justify-center ${loading ? 'border-red-500/20 text-red-400' : 'border-emerald-500/20 text-emerald-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-red-500' : 'bg-emerald-500'} ${loading ? 'animate-ping' : ''}`} />
                        {loading ? 'Searching...' : `${crimeData.length} Crimes Found`}
                    </div>
                </div>
            </header>

            {/* Zoom Status Indicator for Heatmap */}
            {showHeatmap && currentZoom > 16 && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                    <div className="glass px-4 py-2 rounded-full !border-red-500/30 !text-red-400 text-[10px] font-black uppercase tracking-tighter shadow-2xl flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full !bg-red-500 animate-pulse" />
                        Detailed View: Showing Points
                    </div>
                </div>
            )}

            {/* Map */}
            <MapContainer
                center={[52.63, -1.13]}
                zoom={13}
                className="h-full w-full"
                zoomControl={false}
                doubleClickZoom={searchMode !== 'area'}
            >
                <ZoomHandler showHeatmap={showHeatmap} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapEvents />

                {selectedPoint && (
                    <CircleMarker center={selectedPoint} radius={10} fillColor="#ef4444" color="#fff" weight={2} opacity={1} fillOpacity={0.4}>
                        <Popup>Selection Center</Popup>
                    </CircleMarker>
                )}

                {polyPoints.length > 0 && (
                    <Polygon
                        positions={polyPoints}
                        pathOptions={{ color: '#ef4444', weight: 2, fillOpacity: 0.2, dashArray: '5, 10' }}
                    />
                )}

                {searchMode === 'area' && isDrawing && polyPoints.length > 0 && mousePos && (
                    <Polyline
                        positions={[polyPoints[polyPoints.length - 1], mousePos]}
                        pathOptions={{ color: '#ef4444', weight: 2, dashArray: '5, 5', opacity: 0.6 }}
                    />
                )}

                {showHeatmap ? (
                    currentZoom > 16 ? (
                        crimeData.map((crime, index) => (
                            <CircleMarker
                                key={`crime-${index}`}
                                center={[parseFloat(crime.location.latitude), parseFloat(crime.location.longitude)]}
                                radius={6}
                                fillColor={getCrimeColor(crime.category)}
                                color="#fff"
                                weight={1}
                                opacity={0.8}
                                fillOpacity={0.6}
                            >
                                <Popup>
                                    <div className="text-sm max-w-[200px]">
                                        <div className="font-bold text-zinc-900 capitalize">
                                            {crime.category.replace(/-/g, ' ')}
                                        </div>
                                        <div className="text-zinc-600 text-xs mt-1">
                                            <div className="font-medium text-zinc-800">{crime.location.street.name}</div>
                                            <div className="mt-1">Month: {crime.month}</div>
                                        </div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))
                    ) : (
                        <HeatmapLayer points={crimeData} />
                    )
                ) : (
                    crimeData.map((crime, index) => (
                        <CircleMarker
                            key={`crime-${index}`}
                            center={[parseFloat(crime.location.latitude), parseFloat(crime.location.longitude)]}
                            radius={6}
                            fillColor={getCrimeColor(crime.category)}
                            color="#fff"
                            weight={1}
                            opacity={0.8}
                            fillOpacity={0.6}
                        >
                            <Popup>
                                <div className="text-sm max-w-[200px]">
                                    <div className="font-bold text-zinc-900 capitalize">
                                        {crime.category.replace(/-/g, ' ')}
                                    </div>
                                    <div className="text-zinc-600 text-xs mt-1">
                                        <div className="font-medium text-zinc-800">{crime.location.street.name}</div>
                                        <div className="mt-1">Month: {crime.month}</div>
                                        {crime.outcome_status && (
                                            <div className="mt-1 p-1.5 bg-zinc-100 rounded border border-zinc-200 text-[10px]">
                                                <span className="font-bold">Outcome:</span> {crime.outcome_status.category}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))
                )}
            </MapContainer>

            {/* Legend */}
            <div className="absolute top-24 right-6 z-[1000] glass p-4 rounded-2xl pointer-events-auto max-h-[400px] overflow-y-auto custom-scrollbar border border-white/10 shadow-2xl w-64">
                <div className="text-xs font-bold mb-3 text-zinc-400 uppercase tracking-widest">Dashboard</div>

                <div className="mb-4">
                    <label className="text-[10px] text-zinc-500 block mb-1 font-bold">SELECT MONTH</label>
                    <input
                        type="month"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 w-full"
                    />
                </div>

                <div className="text-xs font-bold mb-2 text-zinc-400">Crime Categories</div>
                <div className="space-y-1.5">
                    {[
                        { label: 'Violent Crime', color: '#7f1d1d' },
                        { label: 'Anti-social', color: '#ec4899' },
                        { label: 'Burglary', color: '#7c3aed' },
                        { label: 'Vehicle Crime', color: '#0891b2' },
                        { label: 'Drugs', color: '#059669' },
                        { label: 'Robbery', color: '#9f1239' },
                        { label: 'Damage/Arson', color: '#dc2626' },
                        { label: 'Theft', color: '#6366f1' },
                        { label: 'Other', color: '#52525b' }
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-xs text-zinc-300 font-medium">{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="text-[10px] text-zinc-500 space-y-2 leading-relaxed italic">
                        <p>• {searchMode === 'point' ? 'Click on map to fetch local data.' : 'Draw area by clicking, then Search.'}</p>
                        <p>• Heatmap provides density overview. Zoom in for street-level details.</p>
                        <p>• Data provided by data.police.uk API.</p>
                    </div>
                </div>
            </div>

            {/* Data Drawer */}
            {crimeData.length > 0 && (
                <div
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-5xl transition-all duration-500 ease-in-out px-6 ${isDrawerOpen ? 'h-[60vh]' : 'h-12'}`}
                >
                    <div className="h-full glass rounded-t-3xl border-t border-x border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
                        {/* Drawer Toggle Handle */}
                        <button
                            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                            className="w-full h-12 flex items-center justify-between px-8 hover:bg-white/5 transition-colors group relative"
                        >
                            <div className="flex items-center gap-3">
                                <List size={18} className="text-red-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
                                    Crime Data Explorer <span className="text-zinc-500 ml-2">({crimeData.length} records)</span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 font-bold group-hover:text-zinc-300 transition-colors uppercase tracking-widest">
                                    {isDrawerOpen ? 'Collapse' : 'Expand View'}
                                </span>
                                {isDrawerOpen ? <ChevronDown size={20} className="text-zinc-400 group-hover:text-white" /> : <ChevronUp size={20} className="text-zinc-400 group-hover:text-white" />}
                            </div>

                            {/* Visual drag handle top border effect */}
                            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-white/10 group-hover:bg-red-500/50 transition-colors" />
                        </button>

                        {/* Drawer Content (Table) */}
                        <div className="flex-1 overflow-hidden flex flex-col p-4 pt-0">
                            <div className="flex-1 overflow-auto custom-scrollbar border border-white/5 rounded-xl bg-black/20">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead className="sticky top-0 z-10 glass border-b border-white/10">
                                        <tr className="bg-zinc-900/50 text-[11px] font-black uppercase tracking-widest text-red-400/80">
                                            <th className="px-6 py-4">Crime Category</th>
                                            <th className="px-6 py-4">Location / Street</th>
                                            <th className="px-6 py-4 text-center">Month</th>
                                            <th className="px-6 py-4">Current Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {crimeData.map((crime, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: getCrimeColor(crime.category) }}></div>
                                                        <span className="text-sm font-bold text-zinc-200 capitalize tracking-tight group-hover:text-white transition-colors">
                                                            {crime.category.replace(/-/g, ' ')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="text-sm text-zinc-400 font-medium group-hover:text-zinc-300">
                                                        {crime.location.street.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <span className="text-xs font-black text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md border border-white/5 whitespace-nowrap">
                                                        {crime.month}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    {crime.outcome_status ? (
                                                        <div className="text-[11px] font-bold text-zinc-400 leading-tight border-l-2 border-emerald-500/30 pl-3">
                                                            {crime.outcome_status.category}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[11px] font-medium text-zinc-600 italic">
                                                            Pending investigation
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ZoomHandler({ showHeatmap }) {
    const map = useMap()

    useEffect(() => {
        if (showHeatmap) {
            const currentZoom = map.getZoom()
            if (currentZoom > 14) {
                map.setZoom(currentZoom - 2, { animate: true })
            }
        }
    }, [showHeatmap, map])

    return null
}

export default App
