type Props = { size?: "sm" | "md" };

export default function LogoComponent({ size = "md" }: Props) {
  const sizes = {
    sm: "text-xl",
    md: "text-3xl",
  };

  return (
    <span className={`font-semibold tracking-tight ${sizes[size]}`}>
      <span className="text-sky-500">Derma</span>
      <span className="bg-gradient-to-r from-cyan-400 to-sky-500 bg-clip-text text-transparent">
        Core
      </span>
    </span>
  );
}
