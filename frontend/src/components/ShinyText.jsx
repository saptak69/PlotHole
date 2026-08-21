export default function ShinyText({ text, className = '' }) {
  return <span className={`shimmer-text ${className}`}>{text}</span>;
}
