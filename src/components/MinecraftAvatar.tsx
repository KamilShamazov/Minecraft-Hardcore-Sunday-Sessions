import React from "react";

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function MinecraftAvatar({ name, size = 48, className = "" }: AvatarProps) {
  // Simple deterministic hash to choose a character preset or generate one
  const cleanName = name.trim().toLowerCase();
  
  // Deterministic color generation based on name
  const getHashColor = (seed: string, offset: number) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    const hex = "000000".substring(0, 6 - c.length) + c;
    // apply slight modification on offset for depth
    return `#${hex}`;
  };

  // Preset faces: Creeper, Steve, Alex, Enderman, Pig, Zombie, Skeleton
  if (cleanName.includes("creeper")) {
    return (
      <svg width={size} height={size} viewBox="0 0 8 8" className={`rounded-md shadow-md ${className}`} id={`avatar-${name}`}>
        {/* Creeper Grid */}
        <rect width="8" height="8" fill="#4B9C3F" />
        <rect x="1" y="2" width="2" height="2" fill="#1C1F1B" />
        <rect x="5" y="2" width="2" height="2" fill="#1C1F1B" />
        <rect x="3" y="4" width="2" height="2" fill="#1C1F1B" />
        <rect x="2" y="5" width="4" height="3" fill="#1C1F1B" />
        <rect x="1" y="6" width="1" height="2" fill="#1C1F1B" />
        <rect x="6" y="6" width="1" height="2" fill="#1C1F1B" />
      </svg>
    );
  }

  if (cleanName.includes("alex") || cleanName.includes("girl") || cleanName.includes("builder")) {
    return (
      <svg width={size} height={size} viewBox="0 0 8 8" className={`rounded-md shadow-md ${className}`} id={`avatar-${name}`}>
        {/* Alex Hair & Skin */}
        <rect width="8" height="8" fill="#E4A07F" />
        {/* Hair orange */}
        <rect width="8" height="2" fill="#D36B1D" />
        <rect x="0" y="2" width="2" height="4" fill="#D36B1D" />
        <rect x="6" y="2" width="2" height="4" fill="#D36B1D" />
        {/* Eyes green */}
        <rect x="2" y="3" width="1" height="1" fill="#FFFFFF" />
        <rect x="3" y="3" width="1" height="1" fill="#43954C" />
        <rect x="4" y="3" width="1" height="1" fill="#43954C" />
        <rect x="5" y="3" width="1" height="1" fill="#FFFFFF" />
        {/* Mouth/Blush */}
        <rect x="3" y="5" width="2" height="1" fill="#C55B51" />
      </svg>
    );
  }

  if (cleanName.includes("enderman") || cleanName.includes("ender") || cleanName.includes("night")) {
    return (
      <svg width={size} height={size} viewBox="0 0 8 8" className={`rounded-md shadow-md ${className}`} id={`avatar-${name}`}>
        {/* Enderman Dark Charcoal Face */}
        <rect width="8" height="8" fill="#181818" />
        {/* Soft purple gradients */}
        <rect x="1" y="4" width="2" height="1" fill="#CF41FF" />
        <rect x="2" y="4" width="1" height="1" fill="#FF5EFF" />
        <rect x="5" y="4" width="2" height="1" fill="#CF41FF" />
        <rect x="5" y="4" width="1" height="1" fill="#FF5EFF" />
      </svg>
    );
  }

  if (cleanName.includes("pig") || cleanName.includes("steve_pig") || cleanName.includes("pork")) {
    return (
      <svg width={size} height={size} viewBox="0 0 8 8" className={`rounded-md shadow-md ${className}`} id={`avatar-${name}`}>
        {/* Pig Pink Face */}
        <rect width="8" height="8" fill="#F49CB3" />
        <rect x="0" y="0" width="8" height="2" fill="#E0839C" />
        {/* Snout */}
        <rect x="2" y="4" width="4" height="3" fill="#D24A75" />
        <rect x="3" y="5" width="1" height="1" fill="#750E34" />
        <rect x="4" y="5" width="1" height="1" fill="#750E34" />
        {/* Eyes */}
        <rect x="1" y="3" width="2" height="1" fill="#FFFFFF" />
        <rect x="1" y="3" width="1" height="1" fill="#3B1C5B" />
        <rect x="5" y="3" width="2" height="1" fill="#FFFFFF" />
        <rect x="6" y="3" width="1" height="1" fill="#3B1C5B" />
      </svg>
    );
  }

  if (cleanName.includes("steve") || cleanName.includes("default") || cleanName.includes("hero")) {
    return (
      <svg width={size} height={size} viewBox="0 0 8 8" className={`rounded-md shadow-md ${className}`} id={`avatar-${name}`}>
        {/* Steve Skin */}
        <rect width="8" height="8" fill="#C18E68" />
        {/* Hair dark brown */}
        <rect x="0" y="0" width="8" height="2" fill="#2C1A0F" />
        <rect x="0" y="2" width="1" height="1" fill="#2C1A0F" />
        <rect x="7" y="2" width="1" height="1" fill="#2C1A0F" />
        {/* Eyes blue */}
        <rect x="1" y="3" width="2" height="1" fill="#FFFFFF" />
        <rect x="2" y="3" width="1" height="1" fill="#3D4FA0" />
        <rect x="5" y="3" width="2" height="1" fill="#FFFFFF" />
        <rect x="5" y="3" width="1" height="1" fill="#3D4FA0" />
        {/* Smile/Beard */}
        <rect x="2" y="4" width="4" height="1" fill="#58311B" />
        <rect x="3" y="5" width="2" height="1" fill="#AA7055" />
      </svg>
    );
  }

  // Procedural Face base on unique string hash
  const baseBg = getHashColor(cleanName, 0);
  const secondaryBg = getHashColor(cleanName, 4);
  const eyesColor = getHashColor(cleanName, 9);

  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className={`rounded-md shadow-md ${className}`} id={`avatar-${name}`}>
      {/* Background skin */}
      <rect width="8" height="8" fill={baseBg} />
      {/* Hair outline */}
      <rect x="0" y="0" width="8" height="2" fill={secondaryBg} opacity="0.8" />
      <rect x="0" y="2" width="1" height="2" fill={secondaryBg} opacity="0.8" />
      <rect x="7" y="2" width="1" height="2" fill={secondaryBg} opacity="0.8" />
      {/* Eyes */}
      <rect x="1" y="3.5" width="2" height="1" fill="#FFFFFF" />
      <rect x="2.0" y="3.5" width="1" height="1" fill={eyesColor} />
      <rect x="5" y="3.5" width="2" height="1" fill="#FFFFFF" />
      <rect x="5.0" y="3.5" width="1" height="1" fill={eyesColor} />
      {/* Beard / mouth detail */}
      <rect x="3" y="5.5" width="2" height="1.5" fill={secondaryBg} opacity="0.4" />
    </svg>
  );
}
