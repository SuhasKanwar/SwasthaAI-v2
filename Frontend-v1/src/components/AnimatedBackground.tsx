export function AnimatedBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 mesh-animation" />

      <div
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-teal-400/20 rounded-full blur-xl float-animation"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full blur-xl float-animation"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-xl float-animation"
        style={{ animationDelay: "1s" }}
      />

      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-12 gap-4 h-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-blue-200/20" />
          ))}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-radial from-transparent via-white/5 to-white/20" />
    </div>
  )
}