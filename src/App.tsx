import Footer from './components/Footer';
import Header from "./components/Header";
import Converter from "./pages/converter/Converter";

function App() {
  return (
    <>
      <Header />
      <main>
        <Converter />
      </main>
      <Footer/> 
    </>
  );
}

export default App;
