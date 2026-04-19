"use client"

import { ExternalLink } from "lucide-react"
import { motion } from "framer-motion"

export interface LinkData {
  id: string
  title: string
  url: string
  description: string
  icon_url?: string
}

interface LinkCardProps {
  link: LinkData
  delay?: number
}

export function LinkCard({ link, delay = 0 }: LinkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: delay * 0.03 }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <a 
        href={`/redirect/${link.id}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block h-full cursor-pointer focus:outline-none"
      >
        <div className="h-full flex flex-col p-5 bg-card rounded-xl border border-border/60 hover:shadow-md hover:border-primary/30 transition-all duration-300">
          
          <div className="flex items-center gap-4 mb-3">
            <div className="flex shrink-0 items-center justify-center h-12 w-12 rounded-full overflow-hidden border bg-background/50 group">
              {link.icon_url ? (
                <img 
                  src={link.icon_url} 
                  alt={link.title} 
                  className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                />
              ) : (
                <div className="bg-primary/5 w-full h-full flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-muted-foreground/60" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-base leading-snug tracking-tight text-foreground/90 flex-1 line-clamp-2">
              {link.title}
            </h3>
          </div>
          
          <div className="mt-auto pt-2">
            <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed h-[42px]">
               {link.description || "暂无关于该网址的详细介绍信息。"}
            </p>
          </div>

        </div>
      </a>
    </motion.div>
  )
}
