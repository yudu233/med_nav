"use client"

import { ExternalLink, MousePointerClick } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LinkData {
  id: string
  title: string
  url: string
  description: string
  icon_url?: string
  click_count: number
}

interface LinkCardProps {
  link: LinkData
  delay?: number
}

export function LinkCard({ link, delay = 0 }: LinkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.05 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <a href={`/redirect/${link.id}`} target="_blank" rel="noopener noreferrer" className="block h-full cursor-pointer">
        <Card className="h-full transition-shadow hover:shadow-md border-border/50 bg-card overflow-hidden group">
          <CardHeader className="flex flex-row items-start gap-4 p-5 pb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
              {link.icon_url ? (
                <img src={link.icon_url} alt={link.title} className="h-6 w-6 rounded-sm object-cover" />
              ) : (
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                {link.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <CardDescription className="text-sm line-clamp-2 mb-4 h-10">
              {link.description}
            </CardDescription>
            <div className="flex items-center text-xs text-muted-foreground mt-auto">
              <MousePointerClick className="mr-1 h-3 w-3" />
              {link.click_count} 次使用
            </div>
          </CardContent>
        </Card>
      </a>
    </motion.div>
  )
}
