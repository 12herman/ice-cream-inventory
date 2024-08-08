import React from 'react'
import Home from '../pages/Home'
import Product from '../pages/Product'
import RawMaterial from '../pages/RawMaterial'
import Storage from '../pages/Storage'
import Production from '../pages/Production'
import Delivery from '../pages/Delivery'
import SupplierList from '../pages/SupplierList'
import CustomerList from '../pages/CustomerList'
import Employee from '../pages/Employee'

export default function Pages({navPages,datas,productUpdateMt,supplierUpdateMt,customerUpdateMt,rawmaterialUpdateMt,deliveryUpdateMt,employeeUpdateMt,productionUpdateMt,usedmaterialUpdateMt}) {
    const PageLists = [
        <Home datas={datas}/>,
        <RawMaterial datas={datas} rawmaterialUpdateMt={rawmaterialUpdateMt}/>,
        <Production datas={datas} productionUpdateMt={productionUpdateMt} usedmaterialUpdateMt={usedmaterialUpdateMt}/>,
        <Delivery datas={datas} deliveryUpdateMt={deliveryUpdateMt}/>,
        <Storage datas={datas}/>,
        <Product datas={datas} productUpdateMt={productUpdateMt}/>,
        <SupplierList datas={datas} supplierUpdateMt={supplierUpdateMt}/>,
        <CustomerList datas={datas} customerUpdateMt={customerUpdateMt}/>,
        <Employee datas={datas} employeeUpdateMt={employeeUpdateMt}/>
    ];
  return (
    <div className="col-span-6 lg:col-span-10 p-2 overflow-y-hidden" style={{height: '100vh'}}>
    {PageLists[navPages.pagecount]}
    </div>
  )
}
