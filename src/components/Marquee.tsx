import React, {
  Fragment,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
  CSSProperties,
  FC,
} from "react";
import "./Marquee.scss";

interface MarqueeProps {
  /**
   * @description Inline style for the container div
   * @type {CSSProperties}
   * @default {}
   */
  style?: CSSProperties;
  /**
   * @description Class name to style the container div
   * @type {string}
   * @default ""
   */
  className?: string;
  /**
   * @description Whether to automatically fill blank space in the marquee with copies of the children or not
   * @type {boolean}
   * @default true
   */
  autoFill?: boolean;
  /**
   * @description Whether to play or pause the marquee
   * @type {boolean}
   * @default true
   */
  play?: boolean;
  /**
   * @description Whether to pause the marquee when hovered
   * @type {boolean}
   * @default false
   */
  pauseOnHover?: boolean;
  /**
   * @description Whether to pause the marquee when clicked
   * @type {boolean}
   * @default false
   */
  pauseOnClick?: boolean;
  /**
   * @description The direction the marquee is sliding
   * @type {"left" | "right"}
   * @default "left"
   */
  direction?: "left" | "right";
  /**
   * @description Speed calculated as pixels/second
   * @type {number}
   * @default 100
   */
  speed?: number;
  /**
   * @description Duration to delay the animation after render, in seconds
   * @type {number}
   * @default 0
   */
  delay?: number;
  /**
   * @description The number of times the marquee should loop, 0 is equivalent to infinite
   * @type {number}
   * @default 0
   */
  loop?: number;
  /**
   * @description Whether to show the gradient or not
   * @type {boolean}
   * @default false
   */
  gradient?: boolean;
  /**
   * @description The rgb color of the gradient as an array of length 3
   * @type {Array<number>} of length 3
   * @default [255, 255, 255]
   */
  gradientColor?: [number, number, number];
  /**
   * @description The width of the gradient on either side
   * @type {number | string}
   * @default 200
   */
  gradientWidth?: number | string;
  /**
   * @description A callback for when the marquee finishes scrolling and stops. Only calls if loop is non-zero.
   * @type {() => void}
   * @default null
   */
  onFinish?: () => void;
  /**
   * @description A callback for when the marquee finishes a loop. Does not call if maximum loops are reached (use onFinish instead).
   * @type {() => void}
   * @default null
   */
  onCycleComplete?: () => void;
  /**
   * @description The children rendered inside the marquee
   * @type {ReactNode}
   * @default null
   */
  children?: ReactNode;
}

const multiplyChildren = (multiplier: number, children: ReactNode) => {
  return [
    ...Array(Number.isFinite(multiplier) && multiplier >= 0 ? multiplier : 0),
  ].map((_, i) => <Fragment key={i}>{children}</Fragment>);
};

const Marquee: FC<MarqueeProps> = ({
  style = {},
  className = "",
  autoFill = true,
  play = true,
  pauseOnHover = false,
  pauseOnClick = false,
  direction = "left",
  speed = 100,
  delay = 0,
  loop = 0,
  gradient = false,
  gradientColor = [255, 255, 255],
  gradientWidth = 200,
  onFinish,
  onCycleComplete,
  children,
}) => {
  // React Hooks
  const [containerWidth, setContainerWidth] = useState(0);
  const [marqueeWidth, setMarqueeWidth] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Calculate width of container and marquee and set multiplier
  const calculateWidth = useCallback(() => {
    if (marqueeRef.current && containerRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const marqueeWidth = marqueeRef.current.getBoundingClientRect().width;

      if (autoFill && containerWidth && marqueeWidth) {
        setMultiplier(
          marqueeWidth < containerWidth
            ? Math.ceil(containerWidth / marqueeWidth)
            : 1
        );
      } else {
        setMultiplier(1);
      }

      setContainerWidth(containerWidth);
      setMarqueeWidth(marqueeWidth);
    }
  }, [autoFill, marqueeRef]);

  // Calculate width and multiplier on mount and on window resize
  useEffect(() => {
    if (!isMounted) return;

    calculateWidth();
    if (marqueeRef.current) {
      const resizeObserver = new ResizeObserver(() => calculateWidth());
      resizeObserver.observe(marqueeRef.current);
      return () => {
        if (!resizeObserver) return;
        resizeObserver.disconnect();
      };
    }
  }, [calculateWidth, isMounted]);

  // Recalculate width when children change
  useEffect(() => {
    calculateWidth();
  }, [calculateWidth, children]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Animation duration
  const duration = useMemo(() => {
    if (autoFill) {
      return (marqueeWidth * multiplier) / speed;
    } else {
      return marqueeWidth < containerWidth
        ? containerWidth / speed
        : marqueeWidth / speed;
    }
  }, [autoFill, containerWidth, marqueeWidth, multiplier, speed]);

  // Gradient color in an unfinished rgba format
  const rgbaGradientColor = `rgba(${gradientColor[0]}, ${gradientColor[1]}, ${gradientColor[2]}`;

  const containerStyle = useMemo(
    () => ({
      ...style,
      ["--pause-on-hover" as string]:
        !play || pauseOnHover ? "paused" : "running",
      ["--pause-on-click" as string]:
        !play || (pauseOnHover && !pauseOnClick) || pauseOnClick
          ? "paused"
          : "running",
    }),
    [style, play, pauseOnHover, pauseOnClick]
  );

  const gradientStyle = useMemo(
    () => ({
      ["--gradient-color" as string]: `${rgbaGradientColor}, 1), ${rgbaGradientColor}, 0)`,
      ["--gradient-width" as string]:
        typeof gradientWidth === "number"
          ? `${gradientWidth}px`
          : gradientWidth,
    }),
    [rgbaGradientColor, gradientWidth]
  );

  const marqueeStyle = useMemo(
    () => ({
      ["--play" as string]: play ? "running" : "paused",
      ["--direction" as string]: direction === "left" ? "normal" : "reverse",
      ["--duration" as string]: `${duration}s`,
      ["--delay" as string]: `${delay}s`,
      ["--iteration-count" as string]: !!loop ? `${loop}` : "infinite",
      ["--min-width" as string]: autoFill ? `auto` : "100%",
    }),
    [play, direction, duration, delay, loop, autoFill]
  );

  return (
    <Fragment>
      {!isMounted ? null : (
        <div
          ref={containerRef}
          style={containerStyle}
          className={className + " marquee-container"}
        >
          {gradient && <div style={gradientStyle} className="overlay" />}
          <div
            className="marquee"
            style={marqueeStyle}
            onAnimationIteration={onCycleComplete}
            onAnimationEnd={onFinish}
          >
            <div
              className="children-container"
              ref={marqueeRef as React.RefObject<HTMLDivElement>}
            >
              {children}
            </div>
            {multiplyChildren(multiplier - 1, children)}
          </div>
          <div className="marquee" style={marqueeStyle}>
            {multiplyChildren(multiplier, children)}
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default Marquee;
