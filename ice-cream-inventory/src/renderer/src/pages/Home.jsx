import React, { useState, useEffect, useRef } from 'react'
import { PrinterOutlined, DownloadOutlined, UnorderedListOutlined } from '@ant-design/icons'
import {
  Card,
  Statistic,
  DatePicker,
  Tag,
  Table,
  Button,
  Modal,
  Descriptions,
  Popconfirm,
  Form,
  message,
  Radio,
  Select,
  InputNumber
} from 'antd'
import { FaRupeeSign } from 'react-icons/fa'
import { FaRegFilePdf } from 'react-icons/fa6'
import { IoPerson } from 'react-icons/io5'
import { DatestampJs } from '../js-files/date-stamp'
import { fetchItemsForDelivery } from '../firebase/data-tables/delivery'
import { getCustomerById } from '../firebase/data-tables/customer'
import { getSupplierById } from '../firebase/data-tables/supplier'
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
  const [form] = Form.useForm()
  const [form2] = Form.useForm()
  const [quotationModalOpen, setQuotationModalOpen] = useState(false)
  const [deliveryData, setDeliveryData] = useState([])
  const [quotationData, setQuotationData] = useState({
    date: dayjs(),
    type: 'withGST',
    productname: '',
    flavour: '',
    quantity: '',
    numberofpacks: 1,
  })
 

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
          .filter((product) => isWithinRange(product.date))
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
          .filter((material) => isWithinRange(material.date))
          .map(async (item) => {
            let suppliername = '-'
            if (item.type === 'Added') {
              const result = await getSupplierById(item.supplierid)
              suppliername = result.supplier.suppliername
            }
            return {
              ...item,
              key: item.id,
              customername: suppliername,
              billamount: item.price
            }
          })
      )
      setFilteredRawmaterials(newFilteredRawmaterials)
      setSelectedTableData(newFilteredDelivery)
    }

    fetchFilteredData()
  }, [dateRange, datas.delivery, datas.rawmaterials])

  const handleDateChange = (dates) => {
    setDateRange(dates)
  }

  const showModal = async (record) => {
    const { items, status } = await fetchItemsForDelivery(record.id)
    if (status === 200) {
      const itemsWithProductNames = items.map((item) => {
        const product = datas.product.find((product) => product.id === item.id)
        return {
          ...item,
          productname: product ? product.productname : 'Deleted'
        }
      })
      setSelectedRecord({ ...record, items: itemsWithProductNames })
      setIsModalVisible(true)
    }
  }

  const totalSales = filteredDelivery
    .filter((product) => product.type !== 'return')
    .reduce((total, product) => total + product.billamount, 0)

  const totalSpend = filteredRawmaterials
    .filter((material) => material.type === 'Added')
    .reduce((total, material) => total + material.price, 0)

  const totalProfit = totalSales - totalSpend

  const totalCustomers = filteredDelivery.length

  const totalQuickSale = filteredDelivery
    .filter((product) => product.type === 'quick')
    .reduce((total, product) => total + product.billamount, 0)

  const totalBooking = deliveryData.filter((product) => {
    return (
      product.type === 'booking' &&
      dayjs(product.date, 'DD/MM/YYYY').isSameOrAfter(dayjs(), 'day')
    )
  }).length

  const totalPaid = filteredDelivery.reduce((total, product) => {
    if (product.paymentstatus === 'Paid') {
      return total + (Number(product.billamount) || 0);
    } else if (product.paymentstatus === 'Partial') {
      return total + (Number(product.partialamount) || 0);
    }
    return total;
  }, 0);

  const totalUnpaid = filteredDelivery.reduce((total, product) => {
    if (product.paymentstatus === 'Unpaid') {
      return total + (Number(product.billamount) || 0);
    } else if (product.paymentstatus === 'Partial') {
      return total + ((Number(product.billamount) || 0) - (Number(product.partialamount) || 0));
    }
    return total;
  }, 0);

  const [activeCard, setActiveCard] = useState('totalCustomers')
  const cardsData = [
    { key: 'totalSales', title: 'Total Sales', value: totalSales, prefix: <FaRupeeSign /> },
    { key: 'totalSpend', title: 'Total Spending', value: totalSpend, prefix: <FaRupeeSign /> },
    { key: 'totalProfit', title: 'Total Profit', value: totalProfit, prefix: <FaRupeeSign /> },
    { key: 'totalCustomers', title: 'Total Customer', value: totalCustomers, prefix: <IoPerson /> },
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

  const handleCardClick = (type) => {
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
      case 'totalBooking':
        newSelectedTableData = deliveryData.filter((product) => {
          return (
            product.type === 'booking' &&
            dayjs(product.date, 'DD/MM/YYYY').isSameOrAfter(dayjs(), 'day')
          )
        }).map((product) => {
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
          (product) => product.paymentstatus === 'Paid' || product.paymentstatus === 'Partial'
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
    setSelectedTableData(newSelectedTableData)
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

  const handleQuotationPrint = async () =>{
    await setInvoiceDatas((pre) => ({
      ...pre,
      data: prItems,
    }))
    message.open({ type: 'success', content: 'Quotation Created' })
  }

  const handleQuotationDownload = async () =>{
    await setInvoiceDatas((pre) => ({
      ...pre,
      data: prItems,
    }))
    message.open({ type: 'success', content: 'Quotation Created' })
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
        const imgWidth = 210 // A4 page width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        pdf.addImage(data, 'PNG', 0, 0, imgWidth, imgHeight)
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
      key: 'createddate',
      width: 150,
      sorter: (a, b) => {
        const format = 'DD/MM/YYYY,HH:mm'
        const dateA = dayjs(a.createddate, format)
        const dateB = dayjs(b.createddate, format)
        return dateB.isAfter(dateA) ? -1 : 1
      },
      defaultSortOrder: 'descend'
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
      key: 'billamount'
    },
    {
      title: 'Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      render: (text, record) => {
        const { partialamount } = record
        if (text === 'Paid') {
          return (
            <>
              <Tag color="green">Paid</Tag>
              <Tag color="blue">{record.type}</Tag>
            </>
          )
        } else if (text === 'Partial') {
          return (
            <>
              <Tag color="yellow">Partial - {partialamount}</Tag>
              <Tag color="blue">{record.type}</Tag>
            </>
          )
        } else {
          return (
            <>
              <Tag color="red">Unpaid</Tag>
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
      dataIndex: 'pieceamount',
    },
    {
      title: 'Qty',
      key: 'numberofpacks',
      dataIndex: 'numberofpacks'
    },
    {
      title: 'MRP',
      key: 'producttotalamount',
      dataIndex: 'producttotalamount',
    },
    {
      title: 'Amount',
      key: 'price',
      dataIndex: 'price',
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

  // create add temp product
  const [count, setCount] = useState(0)
  const addTempProduct = async (values) => {
    setCount(count + 1)
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : ''
    const newProduct = { ...values, key: count, date: formattedDate, createddate: TimestampJs() }
    const checkExsit = option.tempproduct.some(
      (item) =>
        item.productname === newProduct.productname &&
        item.flavour === newProduct.flavour &&
        item.quantity === newProduct.quantity &&
        item.numberofpacks === newProduct.numberofpacks &&
        item.date === newProduct.date
    )
    const checkSamePacks = option.tempproduct.some(
      (item) =>
        item.productname === newProduct.productname &&
        item.flavour === newProduct.flavour &&
        item.quantity === newProduct.quantity &&
        item.numberofpacks !== newProduct.numberofpacks &&
        item.date === newProduct.date &&
        item.key !== newProduct.key
    )
    const temVales = { ...values, date: formattedDate }
    const dbCheck = datas.productions.some(
      (item) =>
        item.productname === temVales.productname &&
        item.flavour === temVales.flavour &&
        item.quantity === temVales.quantity &&
        item.date === temVales.date
    )
    if (checkExsit) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else if (checkSamePacks) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else if (dbCheck) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else {
      setOption((pre) => ({ ...pre, tempproduct: [...pre.tempproduct, newProduct] }))
    }
  }


  const itemColumns = [
    {
      title: 'Item Name',
      dataIndex: 'productname',
      key: 'productname'
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
          {/* <Button
            type="primary"
            onClick={() => {
              setQuotationModalOpen(true)
              form.resetFields()
            }}
          >
            Quotation <FaRegFilePdf />
          </Button> */}
        </li>

        <ul className="card-list mt-2 grid grid-cols-4 gap-x-2 gap-y-2">
          {cardsData.map((card) => {
            const isActive = activeCard === card.key
            return (
              <Card
                key={card.key}
                onClick={() => handleCardClick(card.key)}
                style={{
                  cursor: 'pointer',
                  borderColor: isActive ? '#f26723' : card.value > 0 ? '#3f8600' : '#cf1322',
                  borderWidth: 2,
                  background: isActive ? '#f26723' : '',
                  color: isActive ? '#ffffff' : ''
                }}
              >
                <Statistic
                  title={
                    isActive ? (
                      <span className="text-white">{card.title}</span>
                    ) : (
                      <span>{card.title}</span>
                    )
                  }
                  value={card.value}
                  precision={card.key === 'totalCustomers' || card.key === 'totalBooking' ? 0 : 2}
                  valueStyle={{
                    color: isActive ? '#ffffff' : card.value > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={card.prefix}
                />
              </Card>
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
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={null}
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={2}>
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
        className="relative"
        width={1000}
        title={
          <span className="w-full flex justify-center items-center text-sm py-2">QUOTATION</span>
        }
        open={quotationModalOpen}
        onCancel={() => {
          setQuotationModalOpen(false)
        }}
        footer={
          <div>
            <section className="flex gap-x-3 justify-between items-center">
              <span className="flex gap-x-3 m-0 justify-center">
                <Form
                 className="flex gap-x-2 justify-center items-center"
                  form={form2}
                  onFinish={() => {console.log('Margin')}}
                >
                  <Form.Item name="marginvalue" rules={[{ required: true, message: false }]}>
                    <InputNumber
                      min={0}
                      max={100}
                      type="number"
                      className="w-[11.5rem]"
                      prefix={<span>Margin(%)</span>}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      Enter
                    </Button>
                  </Form.Item>
                </Form>
              </span>
              <span className="flex gap-x-3 justify-center items-center">
                <Button htmlType="submit" type="primary" className=" w-fit" onClick={() => handleQuotationPrint()}>
                <PrinterOutlined />Print 
                </Button>
                <Button htmlType="submit" type="primary" className=" w-fit" onClick={() => handleQuotationDownload()}>
                  <DownloadOutlined />Download
                </Button>
              </span>
            </section>
          </div>
        }
      >
        <div className="relative">
          <div className="grid grid-cols-4 gap-x-2">
            <Form
              className="col-span-1"
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
                <DatePicker
                  className="w-[8.5rem]"
                  format={'DD/MM/YYYY'}
                />
              </Form.Item>
              <Form.Item name="type" className="mb-1 mt-3">
                <Radio.Group
                  buttonStyle="solid"
                  style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
                  onChange={(e) => {
                    form.resetFields();
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
              <div className="mb-3 w-full">
                <Button className="w-full" type="primary" htmlType="submit">
                  Add To List
                </Button>
                    </div>
            </Form>

              <Table
                virtual
                columns={quotationColumns}
                // components={{ body: { cell: EditableCellTem } }}
                pagination={{ pageSize: 4 }}
                className="col-span-3"
                dataSource={option.tempproduct}
                scroll={{ x: false, y: false }}
              />
          </div>

          <span
            className={`absolute top-[-2.7rem] right-10 ${option.margin === 0 ? 'hidden' : 'block'}`}
          >
            <Tag color="blue">
              MRP Amount: <span className="text-sm">{option.price}</span>
            </Tag>
            <Tag color="green">
              Net Amount: <span className="text-sm">{option.amount}</span>
            </Tag>
          </span>
          
        </div>
      </Modal>

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
                <div>
                  <span className="font-bold">GSTIN :</span> 33AAIFN6367K1ZV
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
                  className={` ${invoiceDatas.customerdetails.customername !== 'Quick Sale' ? 'block' : 'hidden'}`}
                >
                  <span className="font-bold">Customer Name :</span>{' '}
                  <span>
                    {Object.keys(invoiceDatas.customerdetails).length !== 0
                      ? invoiceDatas.customerdetails.customername
                      : null}
                  </span>
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
                <span>8056848361</span>
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
                        <td className="p-4 border-b">{item.margin}</td>
                        <td className="p-4 border-b">
                          {item.numberofpacks * item.pieceamount -
                            (item.numberofpacks * item.pieceamount * item.margin) / 100}
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
