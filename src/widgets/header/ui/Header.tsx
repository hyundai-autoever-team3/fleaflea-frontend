import { Link, NavLink } from "react-router";
import { BellIcon } from "@heroicons/react/24/outline";

const navItmes = [
    { to : '/market',label : '마켓' },
    { to : '/item-dex',label : '물건 도감' },
    { to : '/friends',label : '친구' },
    { to : '/my-page',label : '마이페이지' },
]

export function Header(){
    return(
        <header className = "bg-bg">
            {/* 배경은 화면 끝까지. 헤더는 본문 여백이 커져도 따라 줄어들지 않게 자체 여백(px-6 lg:px-8)을 유지한다 */}
            <div className = "mx-auto grid w-full max-w-7xl grid-cols-3 items-center px-6 py-3 sm:grid-cols-[1fr_auto_1fr] lg:px-8">
            <Link to="/market" aria-label="FleaFlea 홈, 마켓으로 이동" className = "flex w-fit items-center gap-2 transition-opacity hover:opacity-80">
                <div className={"size-8 overflow-hidden rounded-full"}>
                    <img src="/mascot/flea.png" alt="" className="h-full w-full object-cover"/>
                </div>
                <span className = "font-jua text-head-03 text-text-strong">FleaFlea</span>
            </Link>

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
            </div>
        </header>
    )
}
