import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <p>404</p>
      <h1>That vocabulary is not declared.</h1>
      <span>The page may have moved, or the URL may be incomplete.</span>
      <Link href="/docs">Return to the documentation</Link>
    </main>
  );
}
