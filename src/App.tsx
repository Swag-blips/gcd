import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./features/home";
import { Ticket } from "./features/ticket";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ticket/:id" element={<Ticket />} />
    </Routes>
  );
}

export default App;
