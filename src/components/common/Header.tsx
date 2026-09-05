interface HeaderProps {
    toggleSidebar: () => void;
  }
  
  export default function Header({ toggleSidebar }: HeaderProps) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#F0A611] h-16 flex items-center justify-between px-4 shadow">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-white text-2xl"
        >
          &#9776;
        </button>
        {/* <h1 className="text-black font-bold text-lg">Maa Traditional Dresses</h1> */}
        <h1 className="text-black font-bold text-lg">Dashboard</h1>
      </header>
    );
  }