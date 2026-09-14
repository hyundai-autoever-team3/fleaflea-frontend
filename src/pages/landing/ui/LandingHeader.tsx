import { SparklesIcon } from '@heroicons/react/24/outline'

export interface LandingNavItem {
  id: string
  label: string
}

export function LandingHeader({
  navItems,
  activeId,
}: {
  navItems: LandingNavItem[]
  activeId: string | null
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-bg/90 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="size-8 overflow-hidden rounded-full">
          <img src="/mascot/flea.png" alt="" className="h-full w-full object-cover" />
        </div>
        <span className="font-jua text-body-02 text-text-strong">FLEE</span>
        <SparklesIcon className="size-4 text-primary" />
      </div>

      <nav className="flex gap-6">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`text-body-03 transition-colors hover:text-primary ${
              activeId === item.id ? 'font-bold text-primary' : 'text-text-muted'
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
