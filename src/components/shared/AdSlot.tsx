import { createClient } from "@/utils/supabase/server"

interface AdSlotProps {
  slotName: 'header' | 'sidebar' | 'list'
  className?: string
}

export async function AdSlot({ slotName, className = "" }: AdSlotProps) {
  const supabase = await createClient()

  // 查询对应的且已上线的广告位
  const { data: ad, error } = await supabase
    .from('ads')
    .select('*')
    .eq('slot_name', slotName)
    .eq('is_active', true)
    .single()

  if (error || !ad || !ad.image_url) {
    return null // 没配置或没上线则不渲染
  }

  return (
    <div className={`w-full overflow-hidden rounded-lg shadow-sm border border-border/40 bg-muted/30 transition-all hover:shadow-md ${className}`}>
      <a 
        href={ad.target_url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block w-full h-full group"
      >
        <div className="relative aspect-video sm:aspect-[21/9] md:aspect-[3/1] lg:aspect-[4/1] w-full h-full overflow-hidden">
          {/* 特殊处理侧边栏广告位比例 */}
          {slotName === 'sidebar' && (
             <div className="aspect-square sm:aspect-video w-full h-full">
                <img 
                  src={ad.image_url} 
                  alt="广告" 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
             </div>
          )}
          
          {slotName !== 'sidebar' && (
             <img 
               src={ad.image_url} 
               alt="广告" 
               className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
             />
          )}

          {/* 广告标识 */}
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/20 backdrop-blur-sm text-[10px] text-white/80 uppercase tracking-wider border border-white/10">
            AD
          </div>
        </div>
      </a>
    </div>
  )
}
