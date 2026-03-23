import { useState, useRef, useEffect, useCallback } from 'react';

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

interface ClockProps {
  initialHour?: number;
  initialMinute?: number;
  interactive?: boolean;
  onTimeChange?: (time: { hour: number; minute: number }) => void;
  snapInterval?: number;
}

export const Clock = ({
  initialHour = 12,
  initialMinute = 0,
  interactive = true,
  onTimeChange,
  snapInterval = 5,
}: ClockProps) => {
  const [hourAngle, setHourAngle] = useState(initialHour * 30 + (initialMinute / 60) * 30);
  const [minuteAngle, setMinuteAngle] = useState(initialMinute * 6);
  const [activeHand, setActiveHand] = useState<'hour' | 'minute' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeHandRef = useRef<'hour' | 'minute' | null>(null);

  // Keep latest onTimeChange and angles in refs for use in global event listeners without rebinding
  const onTimeChangeRef = useRef(onTimeChange);
  const hourAngleRef = useRef(hourAngle);
  const minuteAngleRef = useRef(minuteAngle);

  useEffect(() => {
    onTimeChangeRef.current = onTimeChange;
    hourAngleRef.current = hourAngle;
    minuteAngleRef.current = minuteAngle;
  });

  // Reset clock when initial values change and not dragging
  useEffect(() => {
    if (!activeHand) {
      setHourAngle(initialHour * 30 + (initialMinute / 60) * 30);
      setMinuteAngle(initialMinute * 6);
    }
  }, [initialHour, initialMinute, activeHand]);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!activeHandRef.current || !interactive || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      
      if (activeHandRef.current === 'minute') {
        const snapDeg = snapInterval * 6; 
        angle = Math.round(angle / snapDeg) * snapDeg;
        setMinuteAngle(angle === 360 ? 0 : angle);
      } else {
        const snapDeg = 15; 
        angle = Math.round(angle / snapDeg) * snapDeg;
        setHourAngle(angle === 360 ? 0 : angle);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (activeHandRef.current) {
        e.preventDefault(); // Prevent scrolling if supported
        handleMove(e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (activeHandRef.current && e.touches.length > 0) {
        e.preventDefault(); // Strongly prevent scrolling on iOS Safari
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleUp = (e: Event) => {
      if (activeHandRef.current) {
        activeHandRef.current = null;
        setActiveHand(null);

        let readMinute = Math.round(minuteAngleRef.current / 6);
        if (readMinute === 60) readMinute = 0;
        
        let readHour = Math.floor(hourAngleRef.current / 30);
        if (readHour === 0) readHour = 12;

        onTimeChangeRef.current?.({ hour: readHour, minute: readMinute });
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    // Explicit touch events to fight iOS Safari SVG touch absorption
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    window.addEventListener('touchcancel', handleUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);

      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
      window.removeEventListener('touchcancel', handleUp);
    };
  }, [interactive, snapInterval]);

  const handlePointerDown = (hand: 'hour' | 'minute') => (e: React.PointerEvent | React.TouchEvent) => {
    if (!interactive) return;
    
    // Optional: avoid default to prevent browser text selection during drag
    if(e.type !== 'touchstart') {
      e.preventDefault();
    }
    
    activeHandRef.current = hand;
    setActiveHand(hand);
  };

  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const isHour = i % 5 === 0;
    const { x: x1, y: y1 } = polarToCartesian(150, 150, isHour ? 130 : 138, i * 6);
    const { x: x2, y: y2 } = polarToCartesian(150, 150, 142, i * 6);
    ticks.push(<line key={`tick-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth={isHour ? 3 : 1} />);
  }

  const numbers = [];
  for (let i = 1; i <= 12; i++) {
    const { x, y } = polarToCartesian(150, 150, 110, i * 30);
    numbers.push(
      <text
        key={`num-${i}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="24"
        fontWeight="bold"
        fill="#333"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {i}
      </text>
    );
  }

  const renderHand = (
    type: 'hour' | 'minute',
    angle: number,
    color: string,
    length: number,
    width: number
  ) => {
    return (
      <g 
        transform={`rotate(${angle} 150 150)`} 
        onPointerDown={handlePointerDown(type)}
        onTouchStart={handlePointerDown(type)}
        style={{ cursor: interactive ? (activeHand === type ? 'grabbing' : 'grab') : 'default' }}
      >
        <line x1="150" y1="150" x2="150" y2={150 - length} stroke={color} strokeWidth={width} strokeLinecap="round" />
        <circle cx="150" cy="150" r={width * 1.5} fill={color} />
        {/* Invisible larger hitbox covering the length of the hand + padding */}
        <polygon 
          points={`135,160 165,160 165,${150 - length - 20} 135,${150 - length - 20}`} 
          fill="transparent" 
        />
      </g>
    );
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none', // Critical for preventing scroll on mobile
      }}
    >
      <svg
        viewBox="0 0 300 300"
        width="100%"
        height="100%"
        style={{
          filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.15))'
        }}
      >
        <circle cx="150" cy="150" r="145" fill="var(--clock-face)" stroke="var(--clock-border)" strokeWidth="10" />
        {ticks}
        {numbers}
        {/* Minute Hand rendered first (underneath) */}
        {renderHand('minute', minuteAngle, 'var(--minute-hand)', 110, 6)}
        {/* Hour Hand rendered second (on top) */}
        {renderHand('hour', hourAngle, 'var(--hour-hand)', 70, 8)}
        <circle cx="150" cy="150" r="8" fill="#333" />
      </svg>
    </div>
  );
};
