import React from 'react';
import { TreeState } from '../types';

interface UIProps {
  treeState: TreeState;
  onToggle: () => void;
}

export const UI: React.FC<UIProps> = ({ treeState, onToggle }) => {
  const isTree = treeState === TreeState.TREE_SHAPE;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-6 px-8 z-10 text-[#F7E7CE]">
      
      {/* Header */}
      <header className="flex flex-col items-center opacity-90">
        <h1 className="font-['Playfair_Display'] text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#F7E7CE] to-[#D4AF37] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Merry Christmas
        </h1>
      </header>

      {/* Controls */}
      <footer className="flex flex-col items-center pointer-events-auto">
        <button
          onClick={onToggle}
          className={`
            group relative px-8 py-4 
            border border-[#D4AF37]/50 
            bg-[#012b0a]/80 backdrop-blur-md
            overflow-hidden transition-all duration-500 ease-out
            hover:border-[#D4AF37] hover:bg-[#046307]/90 hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]
          `}
        >
          {/* Button Glow Effect */}
          <div className="absolute inset-0 w-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent transition-all duration-700 ease-out group-hover:w-full opacity-0 group-hover:opacity-100" />
          
          <span className="relative font-['Cinzel'] tracking-[0.2em] text-lg font-bold text-[#F7E7CE]">
            {isTree ? "Release to Chaos" : "Assemble"}
          </span>
        </button>
        
        <div className="mt-4 flex gap-4 text-[10px] tracking-widest opacity-50 font-sans">
           <span>DRAG TO ROTATE</span>
           <span>•</span>
           <span>SCROLL TO ZOOM</span>
        </div>
      </footer>
    </div>
  );
};