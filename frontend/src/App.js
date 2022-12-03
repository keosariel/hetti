import "nes.css/css/nes.min.css";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Action from "./pages/action";

function App() {
  return (
    <div className="App">
        <BrowserRouter>
            <Routes>
                  <Route index element={<Home/>} />
                  <Route path="/action" element={<Action/>} />
                  <Route path="*" element={<>404</>} />
            </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;
