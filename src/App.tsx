// import { Button } from "@/components/ui/button"
import { ModeToggle } from "./components/mode-toggle"
import CodePlayground from "./pages/code-playground"
import CodePlayground2 from "./pages/code-playground-2"

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-svh">
      <div className="prose flex flex-row justify-between items-center w-full max-w-full px-4 py-4">
        <h1 className="m-0 text-xl">Code Playground</h1>
        <ModeToggle />
      </div>
      <CodePlayground2></CodePlayground2>
    </div>
  )
}

export default App
