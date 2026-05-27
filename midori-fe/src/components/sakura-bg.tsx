export function SakuraBg({ count = 18 }: { count?: number }) {
  const petals = Array.from({ length: count });
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full bg-lavender/40 blur-3xl dark:bg-indigo-950/20" />
      <div className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full bg-sky-blue/30 blur-3xl dark:bg-blue-950/10" />
      <div className="absolute bottom-0 left-1/4 w-[32rem] h-[32rem] rounded-full bg-sakura/40 blur-3xl dark:bg-pink-950/10" />
      {petals.map((_, i) => {
        const left = (i * 53) % 100;
        const dur = 12 + ((i * 7) % 14);
        const delay = (i * 1.3) % 12;
        const drift = ((i * 37) % 200) - 100;
        const size = 8 + ((i * 5) % 12);
        return (
          <span
            key={i}
            className="sakura-petal dark:opacity-0"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
              ["--drift" as string]: `${drift}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
