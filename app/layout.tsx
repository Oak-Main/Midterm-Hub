import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
const dm=DM_Sans({subsets:["latin"],variable:"--font-dm"});
const fraunces=Fraunces({subsets:["latin"],variable:"--font-fraunces"});
export const metadata:Metadata={authors:[{name:"Oak and Main Developers"}],publisher:"Oak and Main Developers",metadataBase:new URL("https://www.midtermwatch.com"),robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}},title:{default:"2026 Midterm Election Date: November 3 | Midterm Watch",template:"%s · Midterm Watch"},description:"The 2026 midterm election is Tuesday, November 3, 2026. Every state's registration, mail-ballot, and early-voting deadlines, verified from official sources.",openGraph:{type:"website",siteName:"Midterm Watch",title:"2026 Midterm Election Date: November 3 | Midterm Watch",description:"The 2026 midterm election is Tuesday, November 3, 2026, with every state's deadlines verified from official sources."}};
export const viewport:Viewport={themeColor:[{media:"(prefers-color-scheme: light)",color:"#f5f4f2"},{media:"(prefers-color-scheme: dark)",color:"#0b1526"}],colorScheme:"light dark"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${dm.variable} ${fraunces.variable} bg-background`}><body><StructuredData value={{"@context":"https://schema.org","@type":"Organization",name:"Oak and Main Developers",url:"https://www.midtermwatch.com/",email:"admin@oakandmain.dev"}}/><SiteHeader/><main id="main">{children}</main><SiteFooter/></body></html>}
