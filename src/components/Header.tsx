import ConverterIcon from "./icons/converterIcon";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <ConverterIcon size={40} className="drop-shadow-md" />
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Konvert-img
          </h1>
        </div>
      </div>
    </header>
  );
}
