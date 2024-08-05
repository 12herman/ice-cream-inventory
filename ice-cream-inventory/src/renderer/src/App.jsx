// src/App.js
import { Button } from "antd";
import NavBar from "./components/NavBar";
import { useEffect, useState } from "react";

// react icons
import { GoHome } from "react-icons/go";
import { FiInbox } from "react-icons/fi";
import { FiShoppingBag } from "react-icons/fi";
import { MdOutlineStorage } from "react-icons/md";
import { MdOutlineWater } from "react-icons/md";
import { TbTruckDelivery } from "react-icons/tb";
import { FaRegRectangleList } from "react-icons/fa6";
import { MdOutlineSettings } from "react-icons/md";
import Pages from "./components/Pages";
import { getProjects } from "./firebase/data-tables/products";

const App =() =>{
  
  // nav state
  const [navPages, setNavPages] = useState({
    pages: ['Home', 'Product', 'Raw Material', 'Storage', 'Production', 'Delivery', 'Supplier List', 'Customer List'],
    icons:[<GoHome size={19}/>, <FiInbox size={17}/>,<FiShoppingBag size={17}/>,<MdOutlineStorage size={17}/>,<MdOutlineWater size={17}/>,<TbTruckDelivery size={17}/>,<FaRegRectangleList size={17}/>,<FaRegRectangleList size={17}/>],
    currentpage: 'Home',
    pagecount:0
  });

  // theme
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  const [datas,setDatas] = useState({
    projects:[],
    projectupdatestaus:false,
  });

  const projectUpdateMt =()=> setDatas(pre => ({...pre, projectupdatestaus:!pre.projectupdatestaus}));

  // get table datas 'project list'
  useEffect(()=>{
    const fetchData = async()=>{
      const {projects,status} = await getProjects();
      if(status){
        setDatas(pre => ({...pre, projects}));
      } 
    };
    fetchData();
  },[datas.projectupdatestaus])


  return (
    <main className="grid grid-cols-8 lg:grid-cols-12 w-full h-screen">
    {/* <Button onClick={toggleDarkMode}>Dark</Button> */}
      <NavBar navPages={navPages} setNavPages={setNavPages} />
      <Pages datas={datas} projectUpdateMt={projectUpdateMt} navPages={navPages}/>
    </main>
  );
}

export default App;
