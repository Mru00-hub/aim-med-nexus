import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div>
            <h1>Hello World!</h1>
            <p>Step 1: Router is working.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
