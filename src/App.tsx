import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Header from "./components/header/Header";
import Converter from "./pages/converter/Converter";
import RemoveBackground from './pages/remove-background/RemoveBackground';
import Signature from "./pages/signature/Signature";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Converter />} />
          <Route path="/remove-background" element={<RemoveBackground />} />
          <Route path="/signature" element={<Signature />} />
        </Routes>
      </main>
      <Footer/>
    </BrowserRouter>
  );
}

export default App;
