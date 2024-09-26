import React, { useState, useEffect, useRef } from 'react'
import { PrinterOutlined, DownloadOutlined, UnorderedListOutlined } from '@ant-design/icons'
import {
  Card,
  Statistic,
  DatePicker,
  Tag,
  Table,
  Typography,
  Button,
  Modal,
  Descriptions,
  Popconfirm,
  Form,
  message,
  Radio,
  Select,
  InputNumber,
  Input
} from 'antd'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { FaRupeeSign } from 'react-icons/fa'
import { FaRegFilePdf } from 'react-icons/fa6'
import { IoPerson } from 'react-icons/io5'
import { DatestampJs } from '../js-files/date-stamp'
import {
  fetchItemsForDelivery,
  getAllPayDetailsFromAllDelivery,
  // getDeliveryUsingDates
} from '../firebase/data-tables/delivery'
import { getCustomerById } from '../firebase/data-tables/customer'
import { getSupplierById, getOneMaterialDetailsById } from '../firebase/data-tables/supplier'
import { jsPDF } from 'jspdf'
const { RangePicker } = DatePicker
import { debounce } from 'lodash'
import dayjs from 'dayjs'
import { TimestampJs } from '../js-files/time-stamp'
import companyLogo from '../assets/img/companylogo.png'
import { formatToRupee } from '../js-files/formate-to-rupee'
import html2canvas from 'html2canvas'
import ReactToPrint from 'react-to-print'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { AiOutlineDelete } from 'react-icons/ai'
import { customRound } from '../js-files/round-amount'
import WarningModal from '../components/WarningModal'
import { toDigit } from '../js-files/tow-digit'
import { latestFirstSort } from '../js-files/sort-time-date-sec'
// import { lastestFirstSort } from '../js-files/sort-time-date-sec'

dayjs.extend(isSameOrAfter)

export default function Home({ datas }) {
  const today = dayjs(DatestampJs(), 'DD/MM/YYYY')
  const [dateRange, setDateRange] = useState([today, today])
  const [filteredDelivery, setFilteredDelivery] = useState([])
  const [filteredRawmaterials, setFilteredRawmaterials] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [selectedTableData, setSelectedTableData] = useState([])
  const [tableLoading, setTableLoading] = useState(true)
  const [filteredPayments, setFilteredPayments] = useState([])
  const [form] = Form.useForm()
  const [marginform] = Form.useForm()
  const [totalPayAmount, setTotalPayAmount] = useState(0)
  const [totalSpendAmount, setTotalSpendAmount] = useState(0)
  const [temform] = Form.useForm()
  const [quotationModalOpen, setQuotationModalOpen] = useState(false)
  const [deliveryData, setDeliveryData] = useState([])
  const [quotationData, setQuotationData] = useState({
    date: dayjs(),
    type: 'withGST',
    productname: '',
    flavour: '',
    quantity: '',
    numberofpacks: 1
  })

  const [quotationft, setQuotationFt] = useState({
    date: null,
    type: 'withGST',
    tempproduct: [],
    margin: 0,
    discount: 0,
    percentage: 0,
    amount: 0,
    count: 0,
    totalamount: 0,
    editingkey: '',
    mrpamount: 0,
    onfocus: false,
    edmargin: true,
    edprice: true,
    edpacks: true,
    customername: '',
    mobilenumber: ''
  })

  const quotationTempTable = [
    {
      title: <span className="text-[0.7rem]">Product</span>,
      dataIndex: 'productname',
      key: 'productname',
      editable: false,
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    {
      title: <span className="text-[0.7rem]">Flavor</span>,
      dataIndex: 'flavour',
      key: 'flavour',
      editable: false,
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },

    {
      title: <span className="text-[0.7rem]">Quantity</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      editable: false,
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    {
      title: <span className="text-[0.7rem]">Packs</span>,
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      editable: quotationft.edpacks,
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    {
      title: <span className="text-[0.7rem]">Piece Price</span>,
      dataIndex: 'productprice',
      key: 'productprice',
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    {
      title: <span className="text-[0.7rem]">MRP</span>,
      dataIndex: 'mrp',
      key: 'mrp',
      editable: false,
      render: (text) => <span className="text-[0.7rem]">{formatToRupee(text, true)}</span>
    },
    {
      title: <span className="text-[0.7rem]">Margin</span>,
      dataIndex: 'margin',
      key: 'margin',
      editable: quotationft.edmargin,
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    {
      title: <span className="text-[0.7rem]">Price</span>,
      dataIndex: 'price',
      key: 'price',
      render: (text) => <span className="text-[0.7rem]">{formatToRupee(text, true)}</span>,
      editable: quotationft.edprice
    },
    {
      title: <span className="text-[0.7rem]">Action</span>,
      dataIndex: 'operation',
      fixed: 'right',
      width: 80,
      render: (_, record) => {
        let iseditable = isEditionTemp(record)
        return !iseditable ? (
          <span className="flex gap-x-2">
            <MdOutlineModeEditOutline
              className="text-blue-500 cursor-pointer"
              size={19}
              onClick={() => temTbEdit(record)}
            />
            <Popconfirm
              className="cursor-pointer text-red-500 hover:text-red-400"
              // className={`${quotationft.editingkey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => removeTemProduct(record)}
              disabled={quotationft.editingkey !== ''}
            >
              <AiOutlineDelete
                // className={`${quotationft.editingkey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-2">
            <Typography.Link style={{ marginRight: 8 }} onClick={() => savedata(record)}>
              <LuSave size={17} />
            </Typography.Link>

            <Popconfirm
              title="Sure to cancel?"
              onConfirm={() => {
                setStoreFirst(null)
                setQuotationFt((pre) => ({
                  ...pre,
                  editingkey: '',
                  edpacks: true,
                  edprice: true,
                  edmargin: true
                }))
              }}
            >
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        )
      }
    }
  ]

  const isEditionTemp = (re) => {
    return quotationft.editingkey.includes(re.key)
  }

  const tempMergedColumns = quotationTempTable.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'margin' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditionTemp(record)
      })
    }
  })
  const [storefirst, setStoreFirst] = useState(null)
  const temTbEdit = (re) => {
    temform.setFieldsValue({ ...re })
    setQuotationFt((pre) => ({
      ...pre,
      editingkey: [re.key],
      ediable: { margin: true, packs: true, price: true }
    }))
  }

  const EditableCellTem = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    const inputNode =
      dataIndex === 'numberofpacks' ? (
        <InputNumber
          size="small"
          type="number"
          className="w-[4rem]"
          min={1}
          onFocus={(e) => {
            if (storefirst === null) {
              setStoreFirst(e.target.value)
              setQuotationFt((pre) => ({ ...pre, edmargin: false, edprice: false }))
            }
          }}
        />
      ) : dataIndex === 'margin' ? (
        <InputNumber
          type="number"
          onFocus={(e) => {
            if (storefirst === null) {
              setStoreFirst(e.target.value)
              setQuotationFt((pre) => ({ ...pre, edpacks: false, edprice: false }))
            }
          }}
          size="small"
          className="w-[4rem]"
          min={0}
          max={100}
        />
      ) : (
        <InputNumber
          onFocus={(e) => {
            if (storefirst === null) {
              setStoreFirst(e.target.value)
              setQuotationFt((pre) => ({ ...pre, edpacks: false, edmargin: false }))
            }
          }}
          size="small"
          className="w-[4rem]"
          min={0}
        />
      )
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{
              margin: 0
            }}
            rules={[
              {
                required: true,
                message: false
              }
            ]}
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    )
  }

  const savedata = async (data) => {
    let row = temform.getFieldValue()
    try {
      if (
        data.numberofpacks === row.numberofpacks &&
        data.margin === row.margin &&
        data.price === row.price
      ) {
        message.open({ type: 'info', content: 'No changes made' })
      } else if (
        (data.numberofpacks !== row.numberofpacks &&
          data.margin === row.margin &&
          data.price === row.price) ||
        (data.numberofpacks === row.numberofpacks &&
          data.margin !== row.margin &&
          data.price === row.price)
      ) {
        // calculation
        let mrp = row.numberofpacks * data.productprice
        let updatedTempproduct = quotationft.tempproduct.map((product) =>
          product.key === row.key
            ? {
                ...product,
                numberofpacks: row.numberofpacks,
                margin: row.margin,
                price: customRound(mrp - (mrp * row.margin) / 100),
                mrp: mrp
              }
            : product
        )
        // update amount
        let totalamount = updatedTempproduct.map((data) => data.price).reduce((a, b) => a + b, 0)
        let mrpamount = updatedTempproduct.map((data) => data.mrp).reduce((a, b) => a + b, 0)
        // Update the state with the new tempproduct array
        setQuotationFt((pre) => ({
          ...pre,
          tempproduct: updatedTempproduct,
          totalamount: totalamount,
          mrpamount: mrpamount
        }))
        message.open({ type: 'success', content: 'Updated Sucessfully' })
      } else if (
        data.numberofpacks === row.numberofpacks &&
        data.margin === row.margin &&
        data.price !== row.price
      ) {
        // calculation
        let mrp = row.numberofpacks * data.productprice
        let updatedTempproduct = quotationft.tempproduct.map((product) =>
          product.key === row.key
            ? {
                ...product,
                numberofpacks: row.numberofpacks,
                margin: customRound(((mrp - row.price) / mrp) * 100),
                price: row.price,
                mrp: mrp
              }
            : product
        )
        // update amount
        let totalamount = updatedTempproduct.map((data) => data.price).reduce((a, b) => a + b, 0)
        let mrpamount = updatedTempproduct.map((data) => data.mrp).reduce((a, b) => a + b, 0)
        // Update the state with the new tempproduct array
        setQuotationFt((pre) => ({
          ...pre,
          tempproduct: updatedTempproduct,
          totalamount: totalamount,
          mrpamount: mrpamount
        }))
        message.open({ type: 'success', content: 'Updated Sucessfully' })
      }
    } catch (e) {
      console.log(e)
    } finally {
      setStoreFirst(null)
      setQuotationFt((pre) => ({
        ...pre,
        edpacks: true,
        edprice: true,
        edmargin: true,
        editingkey: ''
      }))
    }
  }

  const removeTemProduct = (recorde) => {
    const newTempProduct = quotationft.tempproduct.filter((item) => item.key !== recorde.key)
    newTempProduct.length <= 0
      ? setQuotationFt((pre) => ({ ...pre, count: 0, mrpamount: 0, totalamount: 0 }))
      : setQuotationFt((pre) => ({
          ...pre,
          totalamount: pre.totalamount - recorde.price,
          mrpamount: pre.mrpamount - recorde.mrp
        }))
    setQuotationFt((pre) => ({
      ...pre,
      tempproduct: newTempProduct,
      amount: 0,
      discount: 0,
      percentage: 0
    }))
    marginform.resetFields(['marginvalue'])
  }

  // margin data
  const marginOnchange = debounce((value) => {
    let marginamount = quotationft.totalamount * (value.marginvalue / 100)
    let finalamounts = customRound(quotationft.totalamount - marginamount)
    setQuotationFt((pre) => ({
      ...pre,
      amount: finalamounts,
      percentage: value.marginvalue,
      discount: marginamount
    }))
    let newData = quotationft.tempproduct.map((item) => {
      let marginamount = item.mrp * (value.marginvalue / 100)
      let finalamounts = customRound(item.mrp - marginamount)
      return {
        ...item,
        price: finalamounts,
        margin: value.marginvalue
      }
    })
    let totalprice = newData.map((data) => data.price).reduce((a, b) => a + b, 0)
    setQuotationFt((pre) => ({ ...pre, tempproduct: newData, totalamount: totalprice }))
  }, 300)

  useEffect(() => {
    const fetchData = async () => {
      setTableLoading(true)

      const initialData = await Promise.all(
        datas.delivery
          .filter((data) => !data.isdeleted && data.date === today.format('DD/MM/YYYY'))
          .map(async (item, index) => {
            const result = await getCustomerById(item.customerid)
            const customerName =
              result.status === 200 ? result.customer.customername : item.customername
            return {
              ...item,
              sno: index + 1,
              key: item.id || index,
              customername: customerName
            }
          })
      )

      setSelectedTableData(initialData)

      setTableLoading(false)

      const initialDeliveryData = await Promise.all(
        datas.delivery
          .filter((data) => !data.isdeleted)
          .map(async (item, index) => {
            const result = await getCustomerById(item.customerid)
            const customerName =
              result.status === 200 ? result.customer.customername : item.customername
            return {
              ...item,
              sno: index + 1,
              key: item.id || index,
              customername: customerName
            }
          })
      )
      setDeliveryData(initialDeliveryData)
    }
    fetchData()
  }, [datas])

  useEffect(() => {

  // let testfetch = async()=>{
  //   // let {delivery,status} =await getDeliveryUsingDates();
  //   // console.log(delivery);
    
  // }
  // testfetch()

    const fetchFilteredData = async () => {
      const isWithinRange = (date) => {
        if (!dateRange[0] || !dateRange[1]) {
          return true
        }
        const dayjsDate = dayjs(date, 'DD/MM/YYYY')
        return (
          dayjsDate.isSame(dateRange[0], 'day') ||
          dayjsDate.isSame(dateRange[1], 'day') ||
          (dayjsDate.isAfter(dayjs(dateRange[0])) && dayjsDate.isBefore(dayjs(dateRange[1])))
        )
      }

      const newFilteredDelivery = await Promise.all(
        datas.delivery
          .filter((product) => !product.isdeleted && isWithinRange(product.date))
          .map(async (item) => {
            const result = await getCustomerById(item.customerid)
            const customerName =
              result.status === 200 ? result.customer.customername : item.customername
            return {
              ...item,
              key: item.id,
              customername: customerName
            }
          })
      )

      setFilteredDelivery(newFilteredDelivery)

      const newFilteredRawmaterials = await Promise.all(
        datas.rawmaterials
          .filter((material) => !material.isdeleted && isWithinRange(material.date))
          .map(async (item) => {
            let supplierName = '-'
            let materialName = '-'
            let materialUnit = '-'
            if (item.type === 'Added') {
              const result = await getSupplierById(item.supplierid)
              supplierName = result.supplier.suppliername
              const materialresult = await getOneMaterialDetailsById(
                item.supplierid,
                item.materialid
              )
              materialName = materialresult.material.materialname
              materialUnit = materialresult.material.unit
            }
            return {
              ...item,
              key: item.id,
              customername: supplierName,
              total: item.price,
              billamount: item.price,
              materialname: materialName,
              unit: materialUnit,
              materialquantity: item.quantity
            }
          })
      )
      setFilteredRawmaterials(newFilteredRawmaterials)
      let latestDataFilter = await latestFirstSort(newFilteredDelivery)
      setSelectedTableData(latestDataFilter)

      let { deliverys, status } = await getAllPayDetailsFromAllDelivery()
      if (status) {
        let filterData = deliverys.filter(
          (data) =>
            isWithinRange(data.date) &&
            (data.collectiontype === 'delivery' || data.collectiontype === 'customer')
        )
        let totalAmount = filterData
          .map((data) => Number(data.amount) || 0)
          .reduce((a, b) => a + b, 0)
        setTotalPayAmount(totalAmount)
        setFilteredPayments(filterData)
        let spendData = deliverys.filter(
          (data) =>
            isWithinRange(data.date) &&
            (data.collectiontype === 'supplier' || data.collectiontype === 'employee')
        )
        let spendAmount = spendData
          .map((data) => Number(data.amount) || 0)
          .reduce((a, b) => a + b, 0)
        setTotalSpendAmount(spendAmount)
      }
    }
    fetchFilteredData()
  }, [dateRange, datas.delivery, datas.rawmaterials])

  const handleDateChange = (dates) => {
    setDateRange(dates)
  }

  const showModal = async (record) => {
    const { items, status } = await fetchItemsForDelivery(record.id)
    if (status === 200) {
      let itemsWithProductNames = items.map((item) => {
        const product = datas.product.find((product) => product.id === item.id)
        return {
          ...item,
          productname: product ? product.productname : '',
          flavour: product ? product.flavour : '',
          quantity: product ? product.quantity : ''
        }
      })
      if (items.length === 0) {
        itemsWithProductNames = [
          {
            productname: record.materialname,
            flavour: '',
            quantity: record.unit,
            numberofpacks: record.materialquantity
          }
        ]
      }
      setSelectedRecord({ ...record, items: itemsWithProductNames })
      setIsModalVisible(true)
    }
  }

  const totalSales = filteredDelivery
    .filter((product) => product.type !== 'return')
    .reduce((total, product) => total + product.billamount, 0)

  const totalRawSpend = filteredRawmaterials
    .filter((material) => material.type === 'Added')
    .reduce((total, material) => total + material.price, 0)

  const totalSpend = totalRawSpend + (Number(totalSpendAmount))

  const totalProfit = totalSales - totalSpend

  const totalReturn = filteredDelivery
    .filter((product) => product.type === 'return')
    .reduce((total, product) => total + product.billamount, 0)

  const totalQuickSale = filteredDelivery
    .filter((product) => product.type === 'quick')
    .reduce((total, product) => total + product.billamount, 0)

  const totalBooking = deliveryData.filter((product) => {
    return (
      product.type === 'booking' && dayjs(product.date, 'DD/MM/YYYY').isSameOrAfter(dayjs(), 'day')
    )
  }).length

  const totalPaid = filteredDelivery.reduce((total, product) => {
    if (product.paymentstatus === 'Paid' && product.type !== 'return') {
      return total + (Number(product.billamount) || 0)
    } else if (product.paymentstatus === 'Partial' && product.type === 'order') {
      return total + (Number(product.partialamount) || 0)
    }
    return total
  }, 0)

  const totalUnpaid = filteredDelivery.reduce((total, product) => {
    if (product.paymentstatus === 'Unpaid') {
      return total + (Number(product.billamount) || 0)
    } else if (product.paymentstatus === 'Partial') {
      return total + ((Number(product.billamount) || 0) - (Number(product.partialamount) || 0))
    }
    return total
  }, 0)

  const [activeCard, setActiveCard] = useState('')
  const cardsData = [
    { key: 'totalSales', title: 'Total Sales', value: totalSales, prefix: <FaRupeeSign /> },
    { key: 'totalSpend', title: 'Total Spending', value: totalSpend, prefix: <FaRupeeSign /> },
    { key: 'totalProfit', title: 'Total Profit', value: totalProfit, prefix: <FaRupeeSign /> },
    { key: 'totalReturn', title: 'Total Return', value: totalReturn, prefix: <FaRupeeSign /> },
    { key: 'totalPaid', title: 'Total Paid', value: totalPaid, prefix: <FaRupeeSign /> },
    { key: 'totalUnpaid', title: 'Total Unpaid', value: totalUnpaid, prefix: <FaRupeeSign /> },
    {
      key: 'totalQuickSale',
      title: 'Total Quick Sale',
      value: totalQuickSale,
      prefix: <FaRupeeSign />
    },
    { key: 'totalBooking', title: 'Total Booking', value: totalBooking, prefix: <IoPerson /> }
  ]

  const handleCardClick =  async(type) => {
    setActiveCard(type)
    let newSelectedTableData = []
    switch (type) {
      case 'totalSales':
        newSelectedTableData = filteredDelivery.filter((product) => product.type !== 'return')
        break
      case 'totalSpend':
        newSelectedTableData = filteredRawmaterials.filter((material) => material.type === 'Added')
        break
      case 'totalQuickSale':
        newSelectedTableData = filteredDelivery.filter((product) => product.type === 'quick')
        break
      case 'totalReturn':
        newSelectedTableData = filteredDelivery.filter((product) => product.type === 'return')
        break
      case 'totalBooking':
        newSelectedTableData = deliveryData
          .filter((product) => {
            return (
              product.type === 'booking' &&
              dayjs(product.date, 'DD/MM/YYYY').isSameOrAfter(dayjs(), 'day')
            )
          })
          .map((product) => {
            const dateTimeString = `${product.date} ${product.time}`
            //const productDateTime = dayjs(dateTimeString, 'DD/MM/YYYY HH:mm')
            return {
              ...product,
              date: dateTimeString
            }
          })
        break
      case 'totalPaid':
        newSelectedTableData = filteredDelivery.filter(
          (product) =>
            product.type !== 'return' &&
            (product.paymentstatus === 'Paid' || product.paymentstatus === 'Partial')
        )
        break
      case 'totalUnpaid':
        newSelectedTableData = filteredDelivery.filter(
          (product) => product.paymentstatus === 'Unpaid' || product.paymentstatus === 'Partial'
        )
        break
      default:
        newSelectedTableData = filteredDelivery
    }
    let filterLatestData = await latestFirstSort(newSelectedTableData)
    setSelectedTableData(filterLatestData)
    // console.log(newSelectedTableData)
  }

  const handlePaymentTypeClick = (paymentMode) => {
    const filtered = filteredDelivery.filter(
      (product) =>
        product.type !== 'return' &&
        (product.paymentstatus === 'Paid' || product.paymentstatus === 'Partial') &&
        product.paymentmode === paymentMode
    )
    setSelectedTableData(filtered)
  }

  const componentRef = useRef()
  const printRef = useRef()
  const [isPrinting, setIsPrinting] = useState(false)
  const promiseResolveRef = useRef(null)

  const [invoiceDatas, setInvoiceDatas] = useState({
    data: [],
    isGenerate: false,
    customerdetails: {}
  })

  const handleDownloadPdf = async (record) => {
    const { items, status } = await fetchItemsForDelivery(record.id)
    const result = await getCustomerById(record.customerid)
    const gstin = result.customer?.gstin || ''
    const location = result.customer?.location || ''
    if (status === 200) {
      let prData = datas.product.filter((item, i) => items.find((item2) => item.id === item2.id))
      let prItems = await prData.map((pr, i) => {
        let matchingData = items.find((item, i) => item.id === pr.id)
        return {
          sno: i + 1,
          ...pr,
          pieceamount: pr.price,
          quantity: pr.quantity + ' ' + pr.unit,
          margin: matchingData.margin,
          price:
            matchingData.numberofpacks * pr.price -
            matchingData.numberofpacks * pr.price * (matchingData.margin / 100),
          numberofpacks: matchingData.numberofpacks,
          producttotalamount: matchingData.numberofpacks * pr.price,
          returntype: matchingData.returntype
        }
      })
      await setInvoiceDatas((pre) => ({
        ...pre,
        data: prItems,
        isGenerate: true,
        customerdetails: {
          ...record,
          gstin: gstin,
          location: location
        }
      }))
    }
  }

  const handlePrint = async (record) => {
    const { items, status } = await fetchItemsForDelivery(record.id)
    const result = await getCustomerById(record.customerid)
    const gstin = result.customer?.gstin || ''
    const location = result.customer?.location || ''
    if (status === 200) {
      let prData = datas.product.filter((item, i) => items.find((item2) => item.id === item2.id))
      let prItems = await prData.map((pr, i) => {
        let matchingData = items.find((item, i) => item.id === pr.id)
        return {
          sno: i + 1,
          ...pr,
          pieceamount: pr.price,
          quantity: pr.quantity + ' ' + pr.unit,
          margin: matchingData.margin,
          price:
            matchingData.numberofpacks * pr.price -
            matchingData.numberofpacks * pr.price * (matchingData.margin / 100),
          numberofpacks: matchingData.numberofpacks,
          producttotalamount: matchingData.numberofpacks * pr.price,
          returntype: matchingData.returntype
        }
      })
      await setInvoiceDatas((pre) => ({
        ...pre,
        data: prItems,
        isGenerate: false,
        customerdetails: {
          ...record,
          gstin: gstin,
          location: location
        }
      }))
    }
  }

  const handleQuotationPrint = async () => {
    // data
    let { date } = quotationft.tempproduct[0]
    // customer details
    let cusotmerData = {
      customername:
        quotationft.customername === null || quotationft.customername === ''
          ? undefined
          : quotationft.customername,
      mobilenumber:
        quotationft.mobilenumber === null || quotationft.mobilenumber === ''
          ? undefined
          : quotationft.mobilenumber,
      date,
      gstin: '',
      total: quotationft.mrpamount,
      billamount: quotationft.totalamount,
      location: '',
      partialamount: 0
    }
    // product items
    let items = quotationft.tempproduct.map((data, i) => ({
      sno: i + 1,
      productname: data.productname,
      flavour: data.flavour,
      quantity: data.quantity,
      pieceamount: data.productprice,
      numberofpacks: data.numberofpacks,
      producttotalamount: data.mrp,
      margin: data.margin,
      price: data.price
    }))

    // console.log(items);
    await setInvoiceDatas((pre) => ({
      ...pre,
      data: items,
      isGenerate: false,
      customerdetails: cusotmerData
    }))

    // console.log(cusotmerData,items);

    // setIsPrinting(true);

    // await setInvoiceDatas((pre) => ({
    //   ...pre,
    //   data: prItems,
    // }))
    // message.open({ type: 'success', content: 'Quotation Created' })
  }

  const handleQuotationDownload = async () => {
    // data
    let { date } = quotationft.tempproduct[0]
    // customer details
    let cusotmerData = {
      customername:
        quotationft.customername === null || quotationft.customername === ''
          ? undefined
          : quotationft.customername,
      mobilenumber:
        quotationft.mobilenumber === null || quotationft.mobilenumber === ''
          ? undefined
          : quotationft.mobilenumber,
      date,
      gstin: '',
      total: quotationft.mrpamount,
      billamount: quotationft.totalamount,
      location: '',
      partialamount: 0
    }
    // product items
    let items = quotationft.tempproduct.map((data, i) => ({
      sno: i + 1,
      productname: data.productname,
      flavour: data.flavour,
      quantity: data.quantity,
      pieceamount: data.productprice,
      numberofpacks: data.numberofpacks,
      producttotalamount: data.mrp,
      margin: data.margin,
      price: data.price
    }))

    await setInvoiceDatas((pre) => ({
      ...pre,
      data: items,
      isGenerate: true,
      customerdetails: cusotmerData
    }))

    // console.log(items);
    // await setInvoiceDatas({
    //   data: items,
    //   isGenerate: false,
    //   customerdetails: cusotmerData,
    //   location: ''
    // });
    // await setInvoiceDatas((pre) => ({
    //   ...pre,
    //   data: prItems,
    // }))
    // message.open({ type: 'success', content: 'Quotation Created' })
  }

  useEffect(() => {
    if (isPrinting && promiseResolveRef.current) {
      promiseResolveRef.current()
    }
  }, [isPrinting])

  useEffect(() => {
    const generatePDF = async () => {
      if (invoiceDatas.isGenerate) {
        const element = await printRef.current
        const canvas = await html2canvas(element)
        const data = await canvas.toDataURL('image/png')
        const pdf = await new jsPDF()
        const imgWidth = 210
        const pageHeight = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0
        pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
        pdf.save(
          `${invoiceDatas.customerdetails.customername + '-' + invoiceDatas.customerdetails.date}.pdf`
        )
        await setInvoiceDatas((pre) => ({ ...pre, isGenerate: false }))
      }
    }
    generatePDF()
  }, [invoiceDatas.isGenerate, printRef])

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date', 
      width: 150,
      sorter: (a, b) => {
        const format = 'DD/MM/YYYY' 
        const dateA = dayjs(a.date, format)
        const dateB = dayjs(b.date, format)
        return dateB.isAfter(dateA) ? -1 : 1
      },
      // defaultSortOrder: 'descend'
    },
    {
      title: 'Customer / Supplier',
      dataIndex: 'customername',
      key: 'customername'
    },
    {
      title: 'Gross Amount',
      dataIndex: 'total',
      key: 'total'
    },
    {
      title: 'Amount',
      dataIndex: 'billamount',
      key: 'billamount',
      render: (text) => <span>{formatToRupee(text, true)}</span>
    },
    {
      title: 'Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      render: (text, record) => {
        const { partialamount } = record
        if (text === 'Paid' && record.type !== 'Added') {
          return (
            <>
              <Tag color="green">{text}</Tag>
              <Tag color="blue">{record.type}</Tag>
              <Tag color="cyan">{record.paymentmode}</Tag>
            </>
          )
        } else if (text === 'Partial' ) {
          return (
            <>
              <Tag color="yellow">
                {text} - {partialamount}
              </Tag>
              <Tag color="blue">{record.type}</Tag>
              <Tag color="cyan">{record.paymentmode}</Tag>
            </>
          )
        } else if (text === 'Return') {
          return (
            <>
              <Tag color="red">{text}</Tag>
              <Tag color="red">{record.type === 'return' ? 'Returned' : record.type}</Tag>
            </>
          )
        } else {
          return (
            <>
              <Tag color="red">{text}</Tag>
              <Tag color="blue">{record.type}</Tag>
            </>
          )
        }
      }
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 150,
      render: (_, record) => (
        <span>
          <Button
            className="py-0 text-[0.7rem] h-[1.7rem]"
            icon={<UnorderedListOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => showModal(record)}
          />
          <Popconfirm title="Sure to download pdf?" onConfirm={() => handleDownloadPdf(record)}>
            <Button
              className="py-0 text-[0.7rem] h-[1.7rem]"
              icon={<DownloadOutlined />}
              style={{ marginRight: 8 }}
            />
          </Popconfirm>

          <ReactToPrint
            trigger={() => (
              <Button className="py-0 text-[0.7rem] h-[1.7rem]" icon={<PrinterOutlined />} />
            )}
            onBeforeGetContent={async () => {
              return new Promise((resolve) => {
                promiseResolveRef.current = resolve
                handlePrint(record).then(() => {
                  setIsPrinting(true)
                })
              })
            }}
            content={() => componentRef.current}
            onAfterPrint={() => {
              promiseResolveRef.current = null
              setIsPrinting(false)
            }}
          />
        </span>
      )
    }
  ]

  const quotationColumns = [
    {
      title: 'Product',
      key: 'productname',
      dataIndex: 'productname'
    },
    {
      title: 'Flavour',
      key: 'flavour',
      dataIndex: 'flavour'
    },
    {
      title: 'Size',
      key: 'quantity',
      dataIndex: 'quantity'
    },
    {
      title: 'Rate',
      key: 'pieceamount',
      dataIndex: 'pieceamount'
    },
    {
      title: 'Qty',
      key: 'numberofpacks',
      dataIndex: 'numberofpacks'
    },
    {
      title: 'MRP',
      key: 'producttotalamount',
      dataIndex: 'producttotalamount'
    },
    {
      title: 'Amount',
      key: 'price',
      dataIndex: 'price'
    }
  ]

  const [option, setOption] = useState({
    flavour: [],
    flavourstatus: true,
    product: [],
    productvalue: '',
    quantity: [],
    quantitystatus: true,
    tempproduct: []
  })

  //product initial value
  useEffect(() => {
    const productOp = datas.product
      .filter(
        (item, i, s) =>
          item.isdeleted === false &&
          s.findIndex((item2) => item2.productname === item.productname) === i
      )
      .map((data) => ({ label: data.productname, value: data.productname }))
    setOption((pre) => ({ ...pre, product: productOp }))
  }, [datas])

  const productOnchange = async (value, i) => {
    form.resetFields(['flavour'])
    form.resetFields(['quantity'])
    form.resetFields(['numberofpacks'])
    const flavourOp = await Array.from(
      new Set(
        datas.product
          .filter((item) => item.isdeleted === false && item.productname === value)
          .map((data) => data.flavour)
      )
    ).map((flavour) => ({ label: flavour, value: flavour }))
    await setOption((pre) => ({
      ...pre,
      flavourstatus: false,
      flavour: flavourOp,
      productvalue: value,
      quantitystatus: true
    }))
  }

  //flavour onchange value
  const flavourOnchange = async (value, i) => {
    form.resetFields(['quantity'])
    form.resetFields(['numberofpacks'])
    const quantityOp = await Array.from(
      new Set(
        datas.product.filter(
          (item) =>
            item.isdeleted === false &&
            item.flavour === value &&
            item.productname === option.productvalue
        )
      )
    ).map((q) => ({ label: q.quantity + ' ' + q.unit, value: q.quantity + ' ' + q.unit }))
    await setOption((pre) => ({ ...pre, quantitystatus: false, quantity: quantityOp }))
  }

  // (Add to List) btn
  const addTempProduct = async (values) => {
    setQuotationFt((pre) => ({ ...pre, count: pre.count + 1 }))
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : ''

    let [quantityvalue, units] = values.quantity.split(' ')
    const findPrice = await datas.product.find(
      (item) =>
        item.isdeleted === false &&
        item.productname === values.productname &&
        item.flavour === values.flavour &&
        item.quantity === Number(quantityvalue) &&
        item.unit === units
    ).price

    const newProduct = {
      ...values,
      key: quotationft.count,
      date: formattedDate,
      createddate: TimestampJs(),
      mrp: findPrice * values.numberofpacks,
      productprice: findPrice,
      margin: 0,
      price: findPrice * values.numberofpacks
    }

    const checkExsit = quotationft.tempproduct.some(
      (item) =>
        item.productname === newProduct.productname &&
        item.flavour === newProduct.flavour &&
        item.quantity === newProduct.quantity &&
        item.date === newProduct.date
    )

    if (checkExsit) {
      message.open({ type: 'warning', content: 'Product is already added' })
    } else {
      // mrp and total price
      let totalprice = [...quotationft.tempproduct, newProduct]
        .map((data) => data.price)
        .reduce((a, b) => a + b, 0)
      let mrpprice = [...quotationft.tempproduct, newProduct]
        .map((data) => data.mrp)
        .reduce((a, b) => a + b, 0)

      setQuotationFt((pre) => ({
        ...pre,
        totalamount: totalprice,
        tempproduct: [...pre.tempproduct, newProduct],
        amount: 0,
        discount: 0,
        percentage: 0,
        mrpamount: mrpprice
      }))

      marginform.resetFields(['marginvalue'])
    }
  }

  const itemColumns = [
    {
      title: 'Item Name',
      dataIndex: 'productname',
      key: 'productname',
      render: (text, record) => `${record.productname} - ${record.flavour} - ${record.quantity}`
    },
    {
      title: 'Packs',
      dataIndex: 'numberofpacks',
      key: 'numberofpacks'
    }
  ]

  // Table Hight Auto Adjustment (***Do not tounch this code*** ) //
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 200) // Initial height adjustment
  useEffect(() => {
    // Function to calculate and update table height
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 280 // Adjust this value based on your layout needs
      setTableHeight(newHeight)
    }
    // Set initial height
    updateTableHeight()
    // Update height on resize and fullscreen change
    window.addEventListener('resize', updateTableHeight)
    document.addEventListener('fullscreenchange', updateTableHeight)
    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('resize', updateTableHeight)
      document.removeEventListener('fullscreenchange', updateTableHeight)
    }
  }, [])

  // warning modal
  const [warningModal, setWarningModal] = useState(false)
  // cancel btn
  const warningModalCancel = () => {
    setWarningModal(false)
  }
  // ok btn
  const warningModalok = () => {
    setWarningModal(false)
    setQuotationFt({
      date: null,
      type: 'With GST',
      tempproduct: [],
      margin: 0,
      discount: 0,
      percentage: 0,
      amount: 0,
      count: 0,
      totalamount: 0,
      editingkey: '',
      mrpamount: 0,
      onfocus: false,
      edmargin: true,
      edprice: true,
      edpacks: true,
      customername: '',
      mobilenumber: ''
    })
    setQuotationModalOpen(false)
    marginform.resetFields(['marginvalue'])
  }

  // card
  const tabListNoTitle = [
    {
      key: 'total',
      label: 'Total Paid'
    },
    {
      key: 'cash',
      label: 'Cash'
    },
    {
      key: 'card',
      label: 'Card'
    },
    {
      key: 'upi',
      label: 'UPI'
    }
  ]

  const calculateCombinedAmount = (paymentMode) => {
    const paymentAmount = filteredPayments
      .filter((payment) => payment.paymentmode === paymentMode)
      .reduce((total, payment) => total + (Number(payment.amount) || 0), 0)
    const deliveryAmount = filteredDelivery.reduce((total, product) => {
      if (
        product.paymentstatus === 'Paid' &&
        product.type !== 'return' &&
        product.paymentmode === paymentMode
      ) {
        return total + (Number(product.billamount) || 0)
      } else if (
        product.paymentstatus === 'Partial' &&
        product.type === 'order' &&
        product.paymentmode === paymentMode
      ) {
        return total + (Number(product.partialamount) || 0)
      }
      return total
    }, 0)
    return paymentAmount + deliveryAmount
  }

  const combinedCashAmount = calculateCombinedAmount('Cash')
  const combinedCardAmount = calculateCombinedAmount('Card')
  const combinedUpiAmount = calculateCombinedAmount('UPI')

  const contentListNoTitle = {
    cash: <p className="pl-4">{formatToRupee(combinedCashAmount)}</p>,
    card: <p className="pl-4">{formatToRupee(combinedCardAmount)}</p>,
    upi: <p className="pl-4">{formatToRupee(combinedUpiAmount)}</p>,
    total: <p className="pl-4">{formatToRupee(totalPaid + Number(totalPayAmount))}</p>
  }

  const [activeTabKey2, setActiveTabKey2] = useState('total')

  const onTab2Change = (key) => {
    setActiveTabKey2(key)
    if (key === 'cash') {
      handlePaymentTypeClick('Cash')
    } else if (key === 'card') {
      handlePaymentTypeClick('Card')
    } else if (key === 'upi') {
      handlePaymentTypeClick('UPI')
    } else {
      handleCardClick('totalPaid')
    }
  }

  return (
    <div>
      <ul>
        <li className="flex gap-x-3 items-center justify-end">
          <RangePicker
            className="w-[16rem]"
            onChange={handleDateChange}
            defaultValue={[today, today]}
            format="DD/MM/YYYY"
          />
          <Button
            type="primary"
            onClick={() => {
              setQuotationModalOpen(true)
              form.resetFields()
            }}
          >
            Quotation <FaRegFilePdf />
          </Button>
        </li>

        <ul className="card-list mt-2 grid grid-cols-4 gap-x-2 gap-y-2">
          {cardsData.map((card) => {
            const isActive = activeCard === card.key
            return (
              <div>
                {card.key === 'totalPaid' ? (
                  <Card
                    style={{
                      cursor: 'pointer',
                      borderColor: isActive ? '#f26723' : card.value > 0 ? '#3f8600' : '#cf1322',
                      borderWidth: 2,
                      background: isActive ? '#f26723' : '',
                      color: isActive ? '#ffffff' : '#3f8600'
                    }}
                    tabList={tabListNoTitle}
                    activeTabKey={activeTabKey2}
                    onClick={() => {
                      handleCardClick(card.key)
                      let el = document.querySelectorAll('.ant-tabs-tab-btn')
                      let activeel = document.querySelector('.ant-tabs-tab-active')
                      if (el) {
                        el.forEach((data) => {
                          data.classList.add('active-text-white')
                        })
                      }
                    }}
                    onTabChange={onTab2Change}
                    tabProps={{
                      size: 'middle'
                    }}
                  >
                    {contentListNoTitle[activeTabKey2]}
                  </Card>
                ) : (
                  <Card
                    key={card.key}
                    onClick={() => {
                      handleCardClick(card.key)
                      let el = document.querySelectorAll('.ant-tabs-tab-btn')
                      if (el) {
                        el.forEach((data) => {
                          data.classList.remove('active-text-white')
                        })
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      borderColor: isActive ? '#f26723' : card.value > 0 ? '#3f8600' : '#cf1322',
                      borderWidth: 2,
                      background: isActive ? '#f26723' : '',
                      color: isActive ? '#ffffff' : ''
                    }}
                  >
                    <div className="flex flex-col">
                      <div className="flex justify-between">
                        <Statistic
                          title={
                            isActive ? (
                              <span className="text-white">{card.title}</span>
                            ) : (
                              <span>{card.title}</span>
                            )
                          }
                          value={card.value}
                          precision={card.key === 'totalBooking' ? 0 : 2}
                          valueStyle={{
                            color: isActive ? '#ffffff' : card.value > 0 ? '#3f8600' : '#cf1322'
                          }}
                          prefix={card.prefix}
                        />
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )
          })}
        </ul>

        <li className="mt-2">
          <Table
            virtual
            scroll={{ x: 900, y: tableHeight }}
            pagination={false}
            dataSource={selectedTableData}
            columns={columns}
            loading={tableLoading}
            rowKey="id"
          />
        </li>
      </ul>

      <Modal
        title="Items"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
        }}
        width={800}
        footer={null}
      >
        {selectedRecord && (
          <div>
            <Descriptions size='small' bordered column={2}>
              <Descriptions.Item label="Customer">{selectedRecord.customername}</Descriptions.Item>
              <Descriptions.Item label="Date">{selectedRecord.date}</Descriptions.Item>
              <Descriptions.Item label="Gross Amount">{selectedRecord.total}</Descriptions.Item>
              <Descriptions.Item label="Net Amount">{selectedRecord.billamount}</Descriptions.Item>
            </Descriptions>
            <div className="mt-2">
              <Table
                dataSource={selectedRecord.items}
                columns={itemColumns}
                pagination={false}
                rowKey="id"
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
      centered
        className="relative"
        width={1100}
        title={
          <span className="w-full flex justify-center items-center text-sm py-2">QUOTATION</span>
        }
        open={quotationModalOpen}
        onCancel={() => {
          if (quotationft.tempproduct.length > 0) {
            setWarningModal(true)
          } else {
            setQuotationModalOpen(false)
          }
        }}
        footer={
          <div>
            <section className="flex gap-x-3 justify-between items-center">
              <span className="flex gap-x-3 m-0 justify-center items-center">
                <Form
                  className="flex gap-x-2 justify-center items-center"
                  form={marginform}
                  onFinish={(value) => marginOnchange(value)}
                >
                  <Form.Item
                    className="mb-0"
                    name="marginvalue"
                    rules={[{ required: true, message: false }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      type="number"
                      className="w-[11.5rem]"
                      prefix={<span>Margin(%)</span>}
                    />
                  </Form.Item>
                  <Form.Item className="mb-0">
                    <Button type="primary" htmlType="submit">
                      Enter
                    </Button>
                  </Form.Item>
                </Form>
              </span>

              <span className="flex gap-x-3 justify-center items-center">
                {/* <Button  disabled={quotationft.tempproduct.length > 0 ? false : true} type="primary" className=" w-fit" onClick={() => handleQuotationPrint()}>
                <PrinterOutlined />Print 
                </Button> */}
                <ReactToPrint
                  trigger={() => (
                    <Button
                      type="primary"
                      disabled={quotationft.tempproduct.length > 0 ? false : true}
                    >
                      <PrinterOutlined /> Print
                    </Button>
                  )}
                  onBeforeGetContent={async () => {
                    return new Promise((resolve) => {
                      promiseResolveRef.current = resolve
                      handleQuotationPrint().then(() => {
                        setIsPrinting(true)
                      })
                    })
                  }}
                  content={() => componentRef.current}
                  onAfterPrint={() => {
                    promiseResolveRef.current = null
                    setIsPrinting(false)
                  }}
                />
                <Popconfirm
                  title="Sure to download pdf?"
                  onConfirm={() => handleQuotationDownload()}
                >
                  <Button
                    type="primary"
                    disabled={quotationft.tempproduct.length > 0 ? false : true}
                  >
                    <DownloadOutlined size={20} /> Download
                  </Button>
                </Popconfirm>

                {/* <Button  type="primary" className=" w-fit" onClick={() => handleQuotationDownload()}>
                  <DownloadOutlined />
                </Button> */}
              </span>
            </section>
          </div>
        }
      >
        <div className="relative">
          <div className="grid grid-cols-4 gap-x-2">
            <span className="col-span-1">
              <Form
                form={form}
                layout="vertical"
                onFinish={addTempProduct}
                initialValues={{ date: dayjs(), type: 'withGST' }}
              >
                <Form.Item
                  className="mb-3 absolute top-[-2.7rem]"
                  name="date"
                  label=""
                  rules={[{ required: true, message: false }]}
                >
                  <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
                </Form.Item>
                <Form.Item name="type" className="mb-1 mt-3">
                  <Radio.Group
                    buttonStyle="solid"
                    style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
                    onChange={(e) => {
                      setQuotationFt((pre) => ({ ...pre, type: e.target.value }))
                      // setQuotationData(pre=>({...pre,type:e.target.value}))
                      // form.resetFields(['productname','flavour','quantity', 'numberofpacks',]);
                      marginform.resetFields(['marginvalue'])
                    }}
                  >
                    <Radio.Button value="withGST" style={{ width: '50%' }}>
                      With GST
                    </Radio.Button>
                    <Radio.Button value="withoutGST" style={{ width: '50%' }}>
                      Without GST
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
                <Form.Item
                  className="mb-1"
                  name="productname"
                  label="Product Name"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    onChange={(value, i) => productOnchange(value, i)}
                    showSearch
                    placeholder="Select the Product"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={option.product}
                  />
                </Form.Item>
                <Form.Item
                  className="mb-1"
                  name="flavour"
                  label="Flavour"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    disabled={option.flavourstatus}
                    onChange={(value, i) => flavourOnchange(value, i)}
                    showSearch
                    placeholder="Select the Flavour"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={option.flavour}
                  />
                </Form.Item>
                <Form.Item
                  className="mb-1"
                  name="quantity"
                  label="Quantity"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    disabled={option.quantitystatus}
                    showSearch
                    placeholder="Select the Quantity"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={option.quantity}
                  />
                </Form.Item>
                <Form.Item
                  className="mb-3"
                  name="numberofpacks"
                  label="Number of Packs"
                  rules={[{ required: true, message: false }]}
                >
                  <InputNumber
                    type="number"
                    min={1}
                    className="w-full"
                    placeholder="Enter the Number"
                  />
                </Form.Item>
                <span className="absolute flex justify-center items-center left-[18rem] bottom-[-3.1rem] gap-x-2">
                  <Form.Item className="mb-1" name="customername">
                    <Input
                      onChange={(e) =>
                        setQuotationFt((pre) => ({ ...pre, customername: e.target.value }))
                      }
                      placeholder="Customer Name"
                    />
                  </Form.Item>

                  <Form.Item
                    className="mb-1"
                    name="mobilenumber"
                    // label="Mobile Number"
                  >
                    <InputNumber
                      type="number"
                      onChange={(e) => setQuotationFt((pre) => ({ ...pre, mobilenumber: e }))}
                      placeholder="Mobile No"
                      className="w-full"
                      min={0}
                    />
                  </Form.Item>
                </span>
                <div className="mb-3 w-full">
                  <Button className="w-full" type="primary" htmlType="submit">
                    Add To List
                  </Button>
                </div>
              </Form>
            </span>

            {/* <Table
                virtual
                columns={quotationColumns}
                // components={{ body: { cell: EditableCellTem } }}
                pagination={{ pageSize: 4 }}
                className="col-span-3"
                dataSource={option.tempproduct}
                scroll={{ x: false, y: false }}
              /> */}

            <span className="col-span-3">
              <Form
                form={temform}
                component={false}
                //  onFinish={tempSingleMargin}
              >
                <Table
                  virtual
                  columns={tempMergedColumns}
                  components={{ body: { cell: EditableCellTem } }}
                  dataSource={quotationft.tempproduct}
                  pagination={{ pageSize: 4 }}
                  scroll={{ x: false, y: false }}
                />
              </Form>
            </span>
          </div>

          <span
            className={`absolute top-[-2.7rem] right-10 ${option.margin === 0 ? 'hidden' : 'block'}`}
          >
            <Tag color="blue">
              MRP Amount:{' '}
              <span className="text-sm">{formatToRupee(quotationft.mrpamount, true)}</span>
            </Tag>
            <Tag color="green">
              Net Amount:{' '}
              <span className="text-sm">{formatToRupee(quotationft.totalamount, true)}</span>
            </Tag>
          </span>
        </div>
      </Modal>
      <WarningModal state={warningModal} cancel={warningModalCancel} ok={warningModalok} />
      <div
        ref={printRef}
        className="absolute top-[-200rem]"
        style={{ padding: '20px', backgroundColor: '#ffff' }}
      >
        <div ref={componentRef}>
          <section className="w-[90%] mx-auto mt-5">
            <ul className="flex justify-center items-center gap-x-5">
              <li>
                {' '}
                <img className="w-[6rem]" src={companyLogo} alt="comapanylogo" />{' '}
              </li>
              <li className="text-center">
                {' '}
                <h1 className="text-xl font-bold">NEW SARANYA ICE COMPANY</h1>{' '}
                <p>PILAVILAI, AZHAGANPARAI P.O.</p> <p>K.K.DIST</p>{' '}
              </li>
            </ul>

            <ul className="mt-5 flex justify-between">
              <li>
                <div
                  className={`font-bold ${quotationft.type === 'withoutGST' ? 'hidden' : 'inline-block'}`}
                >
                  <span>GSTIN :</span> 33AAIFN6367K1ZV
                </div>
                <div>
                  {' '}
                  <span className="font-bold">Date :</span>{' '}
                  <span>
                    {Object.keys(invoiceDatas.customerdetails).length !== 0
                      ? invoiceDatas.customerdetails.date
                      : null}
                  </span>
                </div>
                <div
                  className={`${invoiceDatas.customerdetails.customername === 'Quick Sale' || invoiceDatas.customerdetails.customername === undefined ? 'hidden' : 'block'}`}
                >
                  <span className="font-bold">Customer Name :</span>{' '}
                  <span>
                    {Object.keys(invoiceDatas.customerdetails).length !== 0
                      ? invoiceDatas.customerdetails.customername
                      : null}
                  </span>
                </div>

                <div
                  className={`${invoiceDatas.customerdetails.mobilenumber === '' || invoiceDatas.customerdetails.mobilenumber === undefined ? 'hidden' : 'block'}`}
                >
                  <span className="font-bold">Mobile Number : </span>{' '}
                  <span>{invoiceDatas.customerdetails.mobilenumber}</span>
                </div>

                <div
                  className={` ${invoiceDatas.customerdetails.gstin !== '' ? 'block' : 'hidden'}`}
                >
                  <span className="font-bold">Customer GSTIN :</span>{' '}
                  <span>
                    {invoiceDatas.customerdetails.gstin
                      ? invoiceDatas.customerdetails.gstin
                      : 'N/A'}
                  </span>
                </div>
                <div
                  className={` ${invoiceDatas.customerdetails.location !== '' ? 'block' : 'hidden'}`}
                >
                  <span className="font-bold">Customer Address :</span>{' '}
                  <span>
                    {invoiceDatas.customerdetails.location
                      ? invoiceDatas.customerdetails.location
                      : 'N/A'}
                  </span>
                </div>
              </li>

              <li className="text-end flex flex-col items-end">
                <span>
                  {' '}
                  <span className="font-bold">Cell :</span> 7373674757
                </span>
                <span>9487369569</span>
              </li>
            </ul>

            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left border-b">S.No</th>
                  <th className="p-4 border-b text-left">Product</th>
                  <th className="p-4 border-b text-left">Flavour</th>
                  <th className="p-4 border-b text-left">Size</th>
                  <th className="p-4 border-b text-left">Rate</th>
                  <th className="p-4 border-b text-left">Qty</th>
                  <th className="p-4 border-b text-left">MRP</th>
                  <th className="p-4 border-b text-left">Margin</th>
                  <th className="p-4 border-b text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceDatas.data.length > 0
                  ? invoiceDatas.data.map((item, i) => (
                      <tr key={i}>
                        <td className="p-4 border-b">{i + 1}</td>
                        <td className="p-4 border-b">{item.productname}</td>
                        <td className="p-4 border-b">{item.flavour}</td>
                        <td className="p-4 border-b">{item.quantity}</td>
                        <td className="p-4 border-b">{item.pieceamount}</td>
                        <td className="p-4 border-b">{item.numberofpacks}</td>
                        <td className="p-4 border-b">{item.producttotalamount}</td>
                        <td className="p-4 border-b">{toDigit(item.margin)}%</td>
                        <td className="p-4 border-b">
                          {customRound(
                            item.numberofpacks * item.pieceamount -
                              (item.numberofpacks * item.pieceamount * item.margin) / 100
                          )}
                        </td>
                      </tr>
                    ))
                  : 'No Data'}
              </tbody>
            </table>
            <p className="text-end mt-5">
              Total Amount :{' '}
              <span className=" font-bold">
                {Object.keys(invoiceDatas.customerdetails).length !== 0
                  ? formatToRupee(invoiceDatas.customerdetails.total)
                  : null}
              </span>{' '}
            </p>
            <p className="text-end">
              Billing Amount :{' '}
              <span className=" font-bold">
                {Object.keys(invoiceDatas.customerdetails).length !== 0
                  ? formatToRupee(invoiceDatas.customerdetails.billamount)
                  : null}
              </span>
            </p>
            <p
              className={` ${invoiceDatas.customerdetails.partialamount !== 0 ? 'block text-end' : 'hidden'}`}
            >
              Partial Amount :{' '}
              <span className=" font-bold">
                {Object.keys(invoiceDatas.customerdetails).length !== 0
                  ? formatToRupee(invoiceDatas.customerdetails.partialamount)
                  : null}
              </span>
            </p>
            <p className="text-end mt-28 p-2">Authorised Signature</p>
          </section>
        </div>
      </div>
    </div>
  )
}
