import NavBar from './components/NavBar'
import { useEffect, useState } from 'react'
import { GoHome } from 'react-icons/go'
import { TbTruckDelivery } from 'react-icons/tb'
import { LuIceCream } from 'react-icons/lu'
import { PiGarageBold } from 'react-icons/pi'
import { LuBoxes } from 'react-icons/lu'
import { MdOutlinePeopleAlt } from 'react-icons/md'
import { PiUserListBold } from 'react-icons/pi'
import { GrUserWorker } from 'react-icons/gr'
import { LuMilk } from 'react-icons/lu'
import { notification } from 'antd'
import { FaBoxesPacking } from 'react-icons/fa6'
import { TbFileSpreadsheet } from "react-icons/tb";
import Pages from './components/Pages'
import { getproduct } from './firebase/data-tables/products'
import { getSupplier } from './firebase/data-tables/supplier'
import { getCustomer } from './firebase/data-tables/customer'
import { getRawmaterial } from './firebase/data-tables/rawmaterial'
import { getDelivery } from './firebase/data-tables/delivery'
import { getEmployee } from './firebase/data-tables/employee'
import { getProduction } from './firebase/data-tables/production'
import { getStorage } from './firebase/data-tables/storage'
import dayjs from 'dayjs'
import { getBalanceSheet } from './firebase/data-tables/balancesheet'

const App = () => {
  const [navPages, setNavPages] = useState({
    pages: [
      'Home',
      'Raw Material',
      'Production',
      'Delivery',
      'Storage',
      'Product List',
      'Supplier List',
      'Customer List',
      'Employee List',
      'Balance Sheet'
    ],
    icons: [
      <GoHome size={19} />,
      <LuMilk size={17} />,
      <LuBoxes size={17} />,
      <TbTruckDelivery size={17} />,
      <PiGarageBold size={17} />,
      <LuIceCream size={17} />,
      <MdOutlinePeopleAlt size={17} />,
      <PiUserListBold size={17} />,
      <GrUserWorker size={17} />,
      <TbFileSpreadsheet size={17}/>
    ],
    currentpage: 'Home',
    pagecount: 0
  });

  const [datas, setDatas] = useState({
    product: [],
    projectupdatestaus: false,
    suppliers: [],
    supplierupdatestaus: false,
    customers: [],
    customerupdatestaus: false,
    rawmaterials: [],
    rawmaterialupdatestaus: false,
    delivery: [],
    deliveryupdatestaus: false,
    employees: [],
    employeeupdatestaus: false,
    productions: [],
    productionupdatestaus: false,
    usedmaterials: [],
    usedmaterialupdatestaus: false,
    storage: [],
    storageupdatestaus: false,
    balancesheet:[],
    balancesheetstatus:false
  });

  const productUpdateMt = () =>setDatas((pre) => ({ ...pre, projectupdatestaus: !pre.projectupdatestaus }))
  const supplierUpdateMt = () =>setDatas((pre) => ({ ...pre, supplierupdatestaus: !pre.supplierupdatestaus }))
  const customerUpdateMt = () =>setDatas((pre) => ({ ...pre, customerupdatestaus: !pre.customerupdatestaus }))
  const rawmaterialUpdateMt = () =>setDatas((pre) => ({ ...pre, rawmaterialupdatestaus: !pre.rawmaterialupdatestaus }))
  const deliveryUpdateMt = () => setDatas((pre) => ({ ...pre, deliveryupdatestaus: !pre.deliveryupdatestaus }))
  const employeeUpdateMt = () =>setDatas((pre) => ({ ...pre, employeeupdatestaus: !pre.employeeupdatestaus }))
  const productionUpdateMt = () =>setDatas((pre) => ({ ...pre, productionupdatestaus: !pre.productionupdatestaus }))
  const usedmaterialUpdateMt = () =>setDatas((pre) => ({ ...pre, usedmaterialupdatestaus: !pre.usedmaterialupdatestaus }))
  const storageUpdateMt = () => setDatas((pre) => ({ ...pre, storageupdatestaus: !pre.storageupdatestaus }))
  const balanceSheetUpdateMt =()=> setDatas(pre =>({...pre,balancesheetstatus:!pre.balancesheetstatus}))

  // get table datas 'project list'
  useEffect(() => {
    const fetchData = async () => {
      const { product, status } = await getproduct()

      if (status) {
        setDatas((pre) => ({ ...pre, product }))
      }
    }
    fetchData()
  }, [datas.projectupdatestaus])

  // get table datas 'supplier list'
  useEffect(() => {
    const fetchData = async () => {
      const { supplier, status } = await getSupplier()
      if (status) {
        setDatas((pre) => ({ ...pre, suppliers: supplier }))
      }
    }
    fetchData()
  }, [datas.supplierupdatestaus])

  // get table datas 'customer list'
  useEffect(() => {
    const fetchData = async () => {
      const { customer, status } = await getCustomer()
      if (status) {
        setDatas((pre) => ({ ...pre, customers: customer }))
      }
    }
    fetchData()
  }, [datas.customerupdatestaus])

  // get table datas 'raw material list'
  useEffect(() => {
    const fetchData = async () => {
      const { status, rawmaterial } = await getRawmaterial()
      if (status) {
        setDatas((pre) => ({ ...pre, rawmaterials: rawmaterial }))
      }
    }
    fetchData()
  }, [datas.rawmaterialupdatestaus])

  // get table datas 'delivery list'
  useEffect(() => {
    const fetchData = async () => {
      const { status, delivery } = await getDelivery()
      if (status) {
        setDatas((pre) => ({ ...pre, delivery }))
      }
    }
    fetchData()
  }, [datas.deliveryupdatestaus])

  // get table datas 'employee list'
  useEffect(() => {
    const fetchData = async () => {
      const { status, employee } = await getEmployee()
      if (status) {
        setDatas((pre) => ({ ...pre, employees: employee }))
      }
    }
    fetchData()
  }, [datas.employeeupdatestaus])

  // get table datas 'production list'
  useEffect(() => {
    const fetchData = async () => {
      const { status, production } = await getProduction()
      if (status) {
        setDatas((pre) => ({ ...pre, productions: production }))
      }
    }
    fetchData()
  }, [datas.productionupdatestaus])

  // get table datas 'storage list'
  useEffect(() => {
    const fetchData = async () => {
      const { status, storage } = await getStorage()
      if (status) {
        setDatas((pre) => ({ ...pre, storage }))
      }
    }
    fetchData()
  }, [datas.storageupdatestaus])

    // get table datas 'balace sheet'
    useEffect(() => {
      const fetchData = async () => {
        const { balancesheet, status } = await getBalanceSheet()
        if (status) {
          setDatas((pre) => ({ ...pre, balancesheet:balancesheet }))
        }
      }
      fetchData()
    }, [datas.balancesheetstatus])

  // Notification logic
  useEffect(() => {
    datas.storage.forEach((record) => {
      if (record.category === 'Product List') {
        if (record.numberofpacks < record.alertcount) {
          notification.warning({
            message: 'Alert',
            duration: 0,
            description: `${record.productname} has less number of packs ${record.numberofpacks} than the alert count ${record.alertcount}!`
          })
        }
      } else {
        if (record.quantity < record.alertcount) {
          notification.warning({
            message: 'Alert',
            duration: 0,
            description: `${record.materialname} has less number of packs ${record.quantity} than the alert count ${record.alertcount}!`
          })
        }
      }
    })
  }, [datas.storage])

  useEffect(() => {
    const today = dayjs().format('DD/MM/YYYY')
    const tomorrow = dayjs().add(1, 'day').format('DD/MM/YYYY')
    const dayAfterTomorrow = dayjs().add(2, 'day').format('DD/MM/YYYY')
    datas.delivery.forEach((record) => {
      if (record.type === 'booking') {
        if (record.date === today || record.date === tomorrow || record.date === dayAfterTomorrow) {
          notification.info({
            message: 'Alert',
            icon: <FaBoxesPacking style={{ color: '#f26723' }} />,
            duration: 0,
            description: `${record.customername} have a booking on ${record.date}!`
          })
        }
      }
    })
  }, [datas.delivery])

  

  return (
    <main className="grid grid-cols-8 lg:grid-cols-12 w-full h-screen">
      <NavBar
        deliveryUpdateMt={deliveryUpdateMt}
        datas={datas}
        navPages={navPages}
        setNavPages={setNavPages}
      />
      <Pages
        datas={datas}
        productUpdateMt={productUpdateMt}
        supplierUpdateMt={supplierUpdateMt}
        customerUpdateMt={customerUpdateMt}
        rawmaterialUpdateMt={rawmaterialUpdateMt}
        deliveryUpdateMt={deliveryUpdateMt}
        employeeUpdateMt={employeeUpdateMt}
        productionUpdateMt={productionUpdateMt}
        usedmaterialUpdateMt={usedmaterialUpdateMt}
        storageUpdateMt={storageUpdateMt}
        balanceSheetUpdateMt={balanceSheetUpdateMt}
        navPages={navPages}
      />
    </main>
  )
}

export default App
