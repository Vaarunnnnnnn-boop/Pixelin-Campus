"use client";

import { useEffect, useRef } from "react";

import * as THREE from "three";

import WAVES from "vanta/dist/vanta.waves.min";

export default function VantaBackground() {

  const vantaRef = useRef(null);

  useEffect(() => {

    let effect = WAVES({

      el: vantaRef.current,

      THREE,

      mouseControls: true,

      touchControls: true,

      gyroControls: false,

      minHeight: 200,

      minWidth: 200,

      scale: 1,

      scaleMobile: 1,

      color: 0x1e1b4b,

      shininess: 35,

      waveHeight: 18,

      waveSpeed: 0.8,

      zoom: 0.9,

      backgroundColor: 0xf5f6fa

    });

    return () => {

      if (effect) effect.destroy();

    };

  }, []);

  return (

    <div
      ref={vantaRef}
      className="absolute inset-0 z-0"
    />

  );

}