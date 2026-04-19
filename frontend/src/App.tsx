import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SOListPage from "./pages/SOListPage";
import SODetailsPage from "./pages/SODetailsPage";
import PickingPage from "./pages/PickingPages";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SOListPage />} />
        <Route path="/so/:so" element={<SODetailsPage />} />
        <Route path="/picking/:so" element={<PickingPage />} />
      </Routes>
    </Router>
  );
}

export default App;