import { ThemeProvider } from './context/ThemeContext'
import { ChatInterface } from './components/ChatInterface'

function App() {
  return (
    <ThemeProvider>
      <ChatInterface />
    </ThemeProvider>
  )
}

export default App
