import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
const f = Plus_Jakarta_Sans({ subsets: ["latin"] });
export const metadata: Metadata = { title: "HostelOS", description: "Hostel operations platform" };
export default function Root({ children }: { children: React.ReactNode }) { return <html lang="en"><body className={f.className}>{children}</body></html>; }
