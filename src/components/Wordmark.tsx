// "Barkad" in charcoal + "Aral" in warm yellow, matching the logo.
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-serif font-bold leading-none tracking-tight ${className}`}>
      <span className="text-[#2b2f36] dark:text-[#ecebe6]">Barkad</span>
      <span className="text-[#d08a1c] dark:text-[#f0b43c]">Aral</span>
    </span>
  );
}
