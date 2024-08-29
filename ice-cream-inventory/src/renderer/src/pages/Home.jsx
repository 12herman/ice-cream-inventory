import React, { useState, useEffect, useRef } from 'react'
import { PrinterOutlined, DownloadOutlined, UnorderedListOutlined } from '@ant-design/icons'
import {
  Card,
  Col,
  Row,
  Statistic,
  DatePicker,
  Tag,
  Table,
  Button,
  Modal,
  Descriptions,
  Popconfirm
} from 'antd'
import { FaRupeeSign } from 'react-icons/fa'
import { IoPerson } from 'react-icons/io5'
import { DatestampJs } from '../js-files/date-stamp'
import { fetchItemsForDelivery } from '../firebase/data-tables/delivery'
import { getCustomerById } from '../firebase/data-tables/customer'
import { getSupplierById } from '../firebase/data-tables/supplier'
import { jsPDF } from 'jspdf'
const { RangePicker } = DatePicker
import dayjs from 'dayjs'
import companyLogo from '../assets/img/companylogo.png'
import { formatToRupee } from '../js-files/formate-to-rupee'
import html2canvas from 'html2canvas'
import ReactToPrint from 'react-to-print'

export default function Home({ datas }) {
  const today = dayjs(DatestampJs(), 'DD/MM/YYYY')
  const [dateRange, setDateRange] = useState([today, today])
  const [filteredDelivery, setFilteredDelivery] = useState([])
  const [filteredRawmaterials, setFilteredRawmaterials] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [selectedTableData, setSelectedTableData] = useState([])
  const [tableLoading, setTableLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setTableLoading(true)
      const initialData = await Promise.all(
        datas.delivery
          .filter((data) => !data.isdeleted && data.date === today.format('DD/MM/YYYY'))
          .map(async (item, index) => {
            const result = await getCustomerById(item.customerid)
            const customerName = result.status === 200 ? result.customer.customername : 'Unknown'
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
            const customerName = result.status === 200 ? result.customer.customername : 'Unknown'
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
  .filter((product) => product.type === 'order')
  .reduce((total, product) => total + product.billamount, 0)

  const totalSpend = filteredRawmaterials
  .filter((material) => material.type === 'Added')
  .reduce((total, material) => total + material.price, 0)

const totalProfit = totalSales - totalSpend


const totalCustomers = filteredDelivery.length


const totalQuickSale = filteredDelivery
  .filter((product) => product.type === 'quick')
  .reduce((total, product) => total + product.billamount, 0)

  //const totalReturn = filteredDelivery.filter((product) => product.type === 'return').length
const totalBooking = filteredDelivery.filter((product) => product.type === 'booking').length

const totalPaid = filteredDelivery
  .filter((product) => product.paymentstatus === 'Paid')
  .reduce((total, product) => total + product.billamount, 0)

  const totalUnpaid = filteredDelivery
  .filter((product) => product.paymentstatus === 'Unpaid')
  .reduce((total, product) => total + product.billamount, 0)

  const [activeCard, setActiveCard] = useState('totalCustomers');
  const cardsData = [
    { key: 'totalSales', title: 'Total Sales', value: totalSales, prefix: <FaRupeeSign /> },
    { key: 'totalSpend', title: 'Total Spending', value: totalSpend, prefix: <FaRupeeSign /> },
    { key: 'totalProfit', title: 'Total Profit', value: totalProfit, prefix: <FaRupeeSign /> },
    { key: 'totalCustomers', title: 'Total Customer', value: totalCustomers, prefix: <IoPerson /> },
    { key: 'totalPaid', title: 'Total Paid', value: totalPaid, prefix: <FaRupeeSign /> },
    { key: 'totalUnpaid', title: 'Total Unpaid', value: totalUnpaid, prefix: <FaRupeeSign /> },
    { key: 'totalQuickSale', title: 'Total Quick Sale', value: totalQuickSale, prefix: <FaRupeeSign /> },
    { key: 'totalBooking', title: 'Total Booking', value: totalBooking, prefix: <IoPerson /> },
  ];

  const handleCardClick = (type) => {
    setActiveCard(type);
    let newSelectedTableData = []
    switch (type) {
      case 'totalSales':
        newSelectedTableData = filteredDelivery.filter((product) => product.type === 'order')
        break
      case 'totalSpend':
        newSelectedTableData = filteredRawmaterials.filter((material) => material.type === 'Added')
        break
      case 'totalQuickSale':
        newSelectedTableData = filteredDelivery.filter((product) => product.type === 'quick')
        break
      case 'totalBooking':
        newSelectedTableData = filteredDelivery.filter((product) => product.type === 'booking')
        break
      case 'totalPaid':
        newSelectedTableData = filteredDelivery.filter(
          (product) => product.paymentstatus === 'Paid'
        )
        break
      case 'totalUnpaid':
        newSelectedTableData = filteredDelivery.filter(
          (product) => product.paymentstatus === 'Unpaid'
        )
        break
      default:
        newSelectedTableData = filteredDelivery
    }
    setSelectedTableData(newSelectedTableData)
  }

 

  // const handlePrint = async (record) => {
  //   const { items, status } = await fetchItemsForDelivery(record.id)
  //   if (status === 200) {
  //     let prData = datas.product.filter((item, i) => items.find((item2) => item.id === item2.id))
  //     let prItems = await prData.map((pr, i) => {
  //       let matchingData = items.find((item, i) => item.id === pr.id)
  //       return {
  //         sno: i + 1,
  //         ...pr,
  //         pieceamount: pr.price,
  //         quantity: pr.quantity + ' ' + pr.unit,
  //         margin: matchingData.margin,
  //         price:
  //           matchingData.numberofpacks * pr.price -
  //           matchingData.numberofpacks * pr.price * (matchingData.margin / 100),
  //         numberofpacks: matchingData.numberofpacks,
  //         producttotalamount: matchingData.numberofpacks * pr.price,
  //         returntype: matchingData.returntype
  //       }
  //     });

  //     const printContent = `
  //       <div>
  //         <h1>Invoice</h1>
  //         <p>Customer Details: ${record.customerName}</p>
  //         <table>
  //           <thead>
  //             <tr>
  //               <th>S.No</th>
  //               <th>Product Name</th>
  //               <th>Piece Amount</th>
  //               <th>Quantity</th>
  //               <th>Margin</th>
  //               <th>Price</th>
  //               <th>Number of Packs</th>
  //               <th>Total Amount</th>
  //               <th>Return Type</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             ${prItems.map((item) => `
  //               <tr>
  //                 <td>${item.sno}</td>
  //                 <td>${item.name}</td>
  //                 <td>${item.pieceamount}</td>
  //                 <td>${item.quantity}</td>
  //                 <td>${item.margin}</td>
  //                 <td>${item.price}</td>
  //                 <td>${item.numberofpacks}</td>
  //                 <td>${item.producttotalamount}</td>
  //                 <td>${item.returntype}</td>
  //               </tr>
  //             `).join('')}
  //           </tbody>
  //         </table>
  //       </div>
  //     `;

  //     const printWindow = window.open('', '', 'height=600,width=800');
  //     printWindow.document.write('<html><head><title>Invoice</title>');
  //     printWindow.document.write('</head><body>');
  //     printWindow.document.write(printContent);
  //     printWindow.document.write('</body></html>');
  //     printWindow.document.close();
  //     printWindow.print();
  //   }
  // }

  const componentRef = useRef()
  const printRef = useRef()
  const [isPrinting, setIsPrinting] = useState(false);
  const promiseResolveRef = useRef(null);

  const [invoiceDatas, setInvoiceDatas] = useState({
    data: [],
    isGenerate: false,
    customerdetails: {}
  })

  const handleDownloadPdf = async (record) => {
    const { items, status } = await fetchItemsForDelivery(record.id)
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
        customerdetails: record
      }))
    }
  }

  const handlePrint = async (record) => {
    const { items, status } = await fetchItemsForDelivery(record.id)
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
        customerdetails: record
      }))
    }
  }

  useEffect(() => {
    if (isPrinting && promiseResolveRef.current) {
      promiseResolveRef.current();
    }
  }, [isPrinting]);

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
          className='py-0 text-[0.7rem] h-[1.7rem]'
            icon={<UnorderedListOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => showModal(record)}
          />
          <Popconfirm title="Sure to download pdf?" 
          onConfirm={() => handleDownloadPdf(record)}>
          <Button
          className='py-0 text-[0.7rem] h-[1.7rem]'
            icon={<DownloadOutlined />}
            style={{ marginRight: 8 }}
          />
          </Popconfirm>

          <ReactToPrint
            trigger={() => <Button className='py-0 text-[0.7rem] h-[1.7rem]' icon={<PrinterOutlined />} />}
            onBeforeGetContent={async () => {
              return new Promise((resolve) => {
                promiseResolveRef.current = resolve;
                handlePrint(record).then(() => {
                  setIsPrinting(true);
                })
              });
            }}
            content={() => componentRef.current}
            onAfterPrint={ () => {
              promiseResolveRef.current = null;
              setIsPrinting(false);
            }}
          />

        </span>
      )
    }
  ]

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
        <li className="flex gap-x-3 justify-between items-center">
          <h1 className='font-bold text-base invisible'>Dashboard</h1>
          <span className="flex gap-x-3 justify-center items-center">
            <RangePicker
              onChange={handleDateChange}
              defaultValue={[today, today]}
              format="DD/MM/YYYY"
            />
          </span>
        </li>

        {/* <li  className='card-list mt-2 grid grid-cols-4 gap-x-2 gap-y-2'>
        <Card onClick={() => handleCardClick('totalSales')}
             style={{ cursor: 'pointer', borderColor: totalSales > 0 ? '#3f8600' : '#cf1322' }}
              >
                <Statistic
              
                  title="Total Sales"
                  value={totalSales}
                  precision={2}
                  valueStyle={{
                    color: totalSales > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<FaRupeeSign />}
                />
              </Card>

          <Card
            onClick={() => handleCardClick('totalSpend')}
            style={{ cursor: 'pointer', borderColor: totalSpend > 0 ? '#3f8600' : '#cf1322' }}
          >
            <Statistic
              title="Total Spending"
              value={totalSpend}
              precision={2}
              valueStyle={{
                color: totalSpend > 0 ? '#3f8600' : '#cf1322'
              }}
              prefix={<FaRupeeSign />}
            />
          </Card>

          <Card
            onClick={() => handleCardClick('totalProfit')}
            style={{ cursor: 'pointer', borderColor: totalProfit > 0 ? '#3f8600' : '#cf1322' }}
          >
            <Statistic
              title="Total Profit"
              value={totalProfit}
              precision={2}
              valueStyle={{
                color: totalProfit > 0 ? '#3f8600' : '#cf1322'
              }}
              prefix={<FaRupeeSign />}
            />
          </Card>

          <Card
            onClick={() => handleCardClick('totalCustomers')}
            style={{
              cursor: 'pointer',
              borderColor: totalCustomers > 0 ? '#3f8600' : '#cf1322'
            }}
          >
            <Statistic
              title="Total Customer"
              value={totalCustomers}
              valueStyle={{
                color: totalCustomers > 0 ? '#3f8600' : '#cf1322'
              }}
              prefix={<IoPerson />}
            />
          </Card>

          <Card
            onClick={() => handleCardClick('totalPaid')}
            style={{ cursor: 'pointer', borderColor: totalPaid > 0 ? '#3f8600' : '#cf1322' }}
          >
            <Statistic
              title="Total Paid"
              value={totalPaid}
              precision={2}
              valueStyle={{
                color: totalPaid > 0 ? '#3f8600' : '#cf1322'
              }}
              prefix={<FaRupeeSign />}
            />
          </Card>

              <Card
                onClick={() => handleCardClick('totalUnpaid')}
                style={{ cursor: 'pointer', borderColor: totalUnpaid > 0 ? '#3f8600' : '#cf1322' }}
              >
                <Statistic
                  title="Total Unpaid"
                  value={totalUnpaid}
                  precision={2}
                  valueStyle={{
                    color: totalUnpaid > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<FaRupeeSign />}
                />
              </Card>
              <Card
                onClick={() => handleCardClick('totalQuickSale')}
                style={{
                  cursor: 'pointer',
                  borderColor: totalQuickSale > 0 ? '#3f8600' : '#cf1322'
                }}
              >
                <Statistic
                  title="Total Quick Sale"
                  value={totalQuickSale}
                  precision={2}
                  valueStyle={{
                    color: totalQuickSale > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<FaRupeeSign />}
                />
              </Card>
              <Card
                onClick={() => handleCardClick('totalBooking')}
                style={{ cursor: 'pointer', borderColor: totalBooking > 0 ? '#3f8600' : '#cf1322' }}
              >
                <Statistic
                  title="Total Booking"
                  value={totalBooking}
                  valueStyle={{
                    color: totalBooking > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<IoPerson />}
                />
              </Card>
        </li> */}

        <ul className='card-list mt-2 grid grid-cols-4 gap-x-2 gap-y-2'>
  {cardsData.map(card => {
    const isActive = activeCard === card.key;
    return (
      <Card
        key={card.key}
        onClick={() => handleCardClick(card.key)}
        style={{
          cursor: 'pointer',
          borderColor: isActive ? '#f26723' : (card.value > 0 ? '#3f8600' : '#cf1322'),
          borderWidth: 2,
          background: isActive ? '#f26723' : '',
          color: isActive ? '#ffffff' : '',
        }}
      >
        <Statistic
          title={isActive ? <span className='text-white'>{card.title}</span> : <span>{card.title}</span>}
          value={card.value}
          precision={card.key === 'totalCustomers' || card.key === 'totalBooking'  ? 0 : 2}
          valueStyle={{
            color: isActive ? '#ffffff' : (card.value > 0 ? '#3f8600' : '#cf1322'),
          }}
          prefix={card.prefix}
        />
      </Card>
    );
  })}
</ul>

        {/* <li className="mt-2">
          <Row gutter={16}>
            <Col span={6}>
              <Card
                onClick={() => handleCardClick('totalSales')}
                style={{ cursor: 'pointer', borderColor: totalSales > 0 ? '#3f8600' : '#cf1322' }}
              >
                <Statistic
                  title="Total Sales"
                  value={totalSales}
                  precision={2}
                  valueStyle={{
                    color: totalSales > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<FaRupeeSign />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                onClick={() => handleCardClick('totalSpend')}
                style={{ cursor: 'pointer', borderColor: totalSpend > 0 ? '#3f8600' : '#cf1322' }}
              >
                <Statistic
                  title="Total Spending"
                  value={totalSpend}
                  precision={2}
                  valueStyle={{
                    color: totalSpend > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<FaRupeeSign />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                onClick={() => handleCardClick('totalProfit')}
                style={{ cursor: 'pointer', borderColor: totalProfit > 0 ? '#3f8600' : '#cf1322' }}
              >
                <Statistic
                  title="Total Profit"
                  value={totalProfit}
                  precision={2}
                  valueStyle={{
                    color: totalProfit > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<FaRupeeSign />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                onClick={() => handleCardClick('totalCustomers')}
                style={{
                  cursor: 'pointer',
                  borderColor: totalCustomers > 0 ? '#3f8600' : '#cf1322'
                }}
              >
                <Statistic
                  title="Total Customer"
                  value={totalCustomers}
                  valueStyle={{
                    color: totalCustomers > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<IoPerson />}
                />
              </Card>
            </Col>
          </Row>
        </li>
        <li className="mt-2">
          <Row gutter={16}>
            <Col span={6}>
              <Card
                onClick={() => handleCardClick('totalPaid')}
                style={{ cursor: 'pointer', borderColor: totalProfit > 0 ? '#3f8600' : '#cf1322' }}
              >
                <Statistic
                  title="Total Paid"
                  value={totalPaid}
                  precision={2}
                  valueStyle={{
                    color: totalProfit > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<FaRupeeSign />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                onClick={() => handleCardClick('totalUnpaid')}
                style={{ cursor: 'pointer', borderColor: totalUnpaid > 0 ? '#3f8600' : '#cf1322' }}
              >
                <Statistic
                  title="Total Unpaid"
                  value={totalUnpaid}
                  precision={2}
                  valueStyle={{
                    color: totalUnpaid > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<FaRupeeSign />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                onClick={() => handleCardClick('totalQuickSale')}
                style={{
                  cursor: 'pointer',
                  borderColor: totalQuickSale > 0 ? '#3f8600' : '#cf1322'
                }}
              >
                <Statistic
                  title="Total Quick Sale"
                  value={totalQuickSale}
                  precision={2}
                  valueStyle={{
                    color: totalQuickSale > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<FaRupeeSign />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                onClick={() => handleCardClick('totalReturn')}
                style={{ cursor: 'pointer', borderColor: totalReturn > 0 ? '#3f8600' : '#cf1322' }}
              >
                <Statistic
                  title="Total Return"
                  value={totalReturn}
                  valueStyle={{
                    color: totalReturn > 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={<IoPerson />}
                />
              </Card>
            </Col>
          </Row>
        </li> */}

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

      <div
        ref={printRef}
        className="absolute top-[-200rem]"
        style={{ padding: '20px', backgroundColor: '#ffff' }}
      >
        <div ref={componentRef}>
          <section className="w-[90%] mx-auto mt-14">
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
                  <span className="font-bold">GSTIN:</span> 33AAIFN6367K1ZV
                </div>
                <div>
                  {' '}
                  <span className="font-bold">Date:</span>{' '}
                  <span>
                    {Object.keys(invoiceDatas.customerdetails).length !== 0
                      ? invoiceDatas.customerdetails.date
                      : null}
                  </span>
                </div>
                <div>
                  <span className="font-bold">Name:</span>{' '}
                  <span>
                    {Object.keys(invoiceDatas.customerdetails).length !== 0
                      ? invoiceDatas.customerdetails.customername
                      : null}
                  </span>
                </div>
              </li>

              <li className="text-end flex flex-col items-end">
                <span>
                  {' '}
                  <span className="font-bold">Cell:</span> 7373674757
                </span>
                <span>8056848361</span>
              </li>
            </ul>

            {/* <h1 className="font-bold  text-center text-lg">Invoice</h1> */}
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left border-b">S.No</th>
                  <th className="p-4 border-b text-left">Product Name</th>
                  <th className="p-4 border-b text-left">Flavour</th>
                  <th className="p-4 border-b text-left">Quantity</th>
                  <th className="p-4 border-b text-left">Piece Amount</th>
                  <th className="p-4 border-b text-left">Number of Packs</th>
                  <th className="p-4 border-b text-left">MRP</th>
                  <th className="p-4 border-b text-left">Margin</th>
                  <th className="p-4 border-b text-left">Total Amount</th>
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
              Total Amount:{' '}
              <span className=" font-bold">
                {Object.keys(invoiceDatas.customerdetails).length !== 0
                  ? formatToRupee(invoiceDatas.customerdetails.total)
                  : null}
              </span>{' '}
            </p>
            <p className="text-end">
              Billing Amount:{' '}
              <span className=" font-bold">
                {Object.keys(invoiceDatas.customerdetails).length !== 0
                  ? formatToRupee(invoiceDatas.customerdetails.billamount)
                  : null}
              </span>
            </p>
            <p
              className={` ${invoiceDatas.customerdetails.partialamount !== 0 ? 'block text-end' : 'hidden'}`}
            >
              Partial Amount:{' '}
              <span className=" font-bold">
                {Object.keys(invoiceDatas.customerdetails).length !== 0
                  ? formatToRupee(invoiceDatas.customerdetails.partialamount)
                  : null}
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
