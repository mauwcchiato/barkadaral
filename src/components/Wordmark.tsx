// "Barkad" in navy + "Aral" in mustard, matching the logo.
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-serif font-bold leading-none tracking-tight ${className}`}>
      <span className="text-[#1f2b5c] dark:text-[#e8ebf7]">Barkad</span>
      <span className="text-[#e3a21a] dark:text-[#f0b43c]">Aral</span>
    </span>
  );
}
