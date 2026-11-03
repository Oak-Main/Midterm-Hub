import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { canonicalOrigin } from "@/lib/refresh";
const dm=localFont({src:"../assets/fonts/dm-sans-latin.woff2",weight:"100 1000",display:"swap",variable:"--font-dm"});
const fraunces=localFont({src:"../assets/fonts/fraunces-latin.woff2",adjustFontFallback:"Times New Roman",weight:"100 900",display:"swap",variable:"--font-fraunces"});
// KEVYN-WRITE: social preview uses the local default brand card | facts: app/opengraph-image.tsx exports a 1200 by 630 brand image; no counts or calls
export const metadata:Metadata={authors:[{name:"Oak and Main Developers"}],publisher:"Oak and Main Developers",metadataBase:new URL(canonicalOrigin),robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}},title:{default:"2026 Midterm Election Date: November 3 | Midterm Watch",template:"%s · Midterm Watch"},description:"The 2026 midterm election is Tuesday, November 3, 2026. Every state's registration, mail-ballot, and early-voting deadlines, verified from official sources.",twitter:{card:"summary_large_image"},openGraph:{type:"website",siteName:"Midterm Watch",title:"2026 Midterm Election Date: November 3 | Midterm Watch",description:"The 2026 midterm election is Tuesday, November 3, 2026, with every state's deadlines verified from official sources."}};
export const viewport:Viewport={themeColor:[{media:"(prefers-color-scheme: light)",color:"#f5f4f2"},{media:"(prefers-color-scheme: dark)",color:"#0b1526"}],colorScheme:"light dark"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${dm.variable} ${fraunces.variable} bg-background`}><body><StructuredData value={{"@context":"https://schema.org","@type":"Organization",name:"Oak and Main Developers",url:canonicalOrigin+"/",email:"admin@oakandmain.dev"}}/><SiteHeader/><main id="main">{children}</main><SiteFooter/></body></html>}
