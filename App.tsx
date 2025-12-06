import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { TreeState } from './types';
import { Loader } from '@react-three/drei';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.SCATTERED);

  const toggleState = () => {
    setTreeState(prev => prev === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE);
  };

  return (
    <div className="relative w-full h-screen bg-[#000501]">
      <Canvas
        dpr={[1, 2]} // Optimize pixel ratio for performance
        shadows
        gl={{ 
          antialias: false, // Postprocessing handles AA or looks better without heavy AA with bloom
          toneMappingExposure: 1.0,
          powerPreference: "high-performance"
        }}
      >
        <Scene treeState={treeState} />
      </Canvas>
      
      <UI treeState={treeState} onToggle={toggleState} />
      
      <Loader 
        containerStyles={{ background: '#000501' }}
        innerStyles={{ width: '400px', height: '2px', background: '#333' }}
        barStyles={{ background: '#D4AF37', height: '2px' }}
        dataStyles={{ color: '#F7E7CE', fontFamily: 'Cinzel', fontSize: '12px' }}
      />
    </div>
  );
};

export default App;