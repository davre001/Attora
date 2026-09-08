import Home from "@/views/Home";

/** Unknown routes land on the landing page (mirrors the old catch-all route). */
export default function NotFound() {
  return <Home />;
}
