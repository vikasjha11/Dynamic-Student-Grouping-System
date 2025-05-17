import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import {HomePage} from './components/homePage';
import {ResultPage} from './components/ResultPage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </Router>
  );
}

export default App
