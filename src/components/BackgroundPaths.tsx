import { motion } from "framer-motion"

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    d: `M-${200 - i * 3 * position} -${100 + i * 4}C-${
      200 - i * 3 * position
    } -${100 + i * 4} -${150 - i * 3 * position} ${150 - i * 4} ${
      100 - i * 3 * position
    } ${200 - i * 4}C${300 - i * 3 * position} ${250 - i * 4} ${
      350 - i * 3 * position
    } ${400 - i * 4} ${350 - i * 3 * position} ${400 - i * 4}`,
    width: 0.3 + i * 0.02,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none opacity-30">
      <svg className="w-full h-full text-gray-400" viewBox="0 0 400 300" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.02}
            fill="none"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 15 + path.id * 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: path.id * 0.5,
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export default function BackgroundPaths() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
    </div>
  )
} 