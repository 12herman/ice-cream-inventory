// src/components/NavBar.js
import React from 'react';
import IceCreamLogo from '../assets/img/33456902_6600_7_04.jpg'
import { LiaHandHoldingUsdSolid } from "react-icons/lia";
import { TbIceCream } from "react-icons/tb";
export default function NavBar({ navPages,setNavPages }) {
  return (
    <nav className='border-r-2 h-screen col-span-2 relative'>
      <ul>
       <li className='flex flex-col justify-center items-center gap-y-1 my-8'><img className='w-14 rounded-full' src={IceCreamLogo}/><span className='font-medium text-[0.9rem]'>Ice Cream</span></li>
        {navPages.pages.map((page, i) => (
            <li key={i} className={`${page === navPages.currentpage ? 'text-white bg-blue-500 rounded-r-full':''} cursor-pointer px-2 py-2 flex items-center gap-x-2`} onClick={() => setNavPages(pre =>({...pre,currentpage:page,pagecount:i}))}>
                <span >{navPages.icons[i]}</span>
                <span>{page}</span>
            </li>
        ))}
      </ul>
      <span className='flex justify-center items-center gap-x-2 bg-blue-500 text-white p-1 w-[95%] rounded-md absolute bottom-16 left-1/2 -translate-x-1/2 cursor-pointer hover:bg-blue-400'><TbIceCream size={25}/><span>Quick Sale</span></span>
      <span className='flex justify-center items-center gap-x-2 bg-blue-500 text-white p-1 w-[95%] rounded-md absolute bottom-5 left-1/2 -translate-x-1/2 cursor-pointer hover:bg-blue-400'><LiaHandHoldingUsdSolid size={25}/><span>Spending</span></span>
    </nav>
  );
}
