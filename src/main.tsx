import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { LandingPage } from './features/landing/pages/LandingPage'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)
const hasSupabaseConfig = Boolean(
	import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)

if (!hasSupabaseConfig) {
	root.render(
		<StrictMode>
			<BrowserRouter>
				<LandingPage />
			</BrowserRouter>
		</StrictMode>,
	)
} else {
	void import('./App').then(({ default: App }) => {
		root.render(
			<StrictMode>
				<App />
			</StrictMode>,
		)
	})
}
