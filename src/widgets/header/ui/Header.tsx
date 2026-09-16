import { NavLink } from "react-router";
import { BellIcon } from "@heroicons/react/24/outline";

const navItmes = [
    { to : '/market',label : '마켓' },
    { to : '/item-dex',label : '물건 도감' },
    { to : '/friends',label : '친구' },
    { to : '/my-page',label : '마이페이지' },
]

export function Header(){
    return(
        <header className = "grid grid-cols-3 items-center bg-bg px-6 py-3">
            <div className = "flex items-center gap-2">
                <div className={"size-8 overflow-hidden rounded-full"}>
                    <img src="/mascot/flea.png" alt="FELA" className="h-full w-full object-cover"/>
                </div>
                <span className = "font-jua text-head-03 text-text-strong">FleaFlea</span>
            </div>

            {/* 마우스 호버 시, 색 변화*/}
            <nav className = "flex justify-center gap-6">{navItmes.map((item)=> (
            <NavLink
                key = {item.to}
                to={item.to}
                className={({ isActive }) => `text-body-03 transition-colors hover:text-primary ${isActive ? 'font-bold text-primary' : 'text-text'}`}
            >
                {item.label}
                </NavLink>
                ))}
            </nav>

            <div className="flex items-center justify-end gap-3">
                <BellIcon className="size-6 text-text-muted" />
                <div className="size-8 overflow-hidden rounded-full ring-1 ring-border shadow-md">
                    <img src="/mascot/flea.png" alt="프로필" className="h-full w-full object-cover"/>
                </div>
            </div>
        </header>
    )
}
