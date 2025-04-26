import { Link } from "wouter";

export function Logo() {
  return (
    <Link href="/">
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="text-2xl font-bold bg-gradient-to-r from-[#025E73] to-[#412754] bg-clip-text text-transparent">
          Meta<span className="text-[#F2A71B]">Sys</span>
        </div>
        <div className="text-sm font-medium text-[#025E73] px-1.5 py-0.5 bg-[#F2A71B]/10 rounded">ERP</div>
      </div>
    </Link>
  );
}