import React, { useState, useEffect } from 'react'
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
  Descriptions
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

  const handleCardClick = (type) => {
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
      case 'totalReturn':
        newSelectedTableData = filteredDelivery.filter((product) => product.type === 'return')
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
  const totalReturn = filteredDelivery.filter((product) => product.type === 'return').length
  const totalPaid = filteredDelivery
    .filter((product) => product.paymentstatus === 'Paid')
    .reduce((total, product) => total + product.billamount, 0)
  const totalUnpaid = filteredDelivery
    .filter((product) => product.paymentstatus === 'Unpaid')
    .reduce((total, product) => total + product.billamount, 0)

  const handlePrint = (record) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
    <html>
      <head>
        <title>Bill Details</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; }
          .bill-container { margin: 20px; }
          h1 { font-size: 32px; }
          p { font-size: 20px; }
          .items { margin-top: 20px; }
          .item { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <h1>Bill Details</h1>
          <p><strong>Customer :</strong> ${record.customername}</p>
          <p><strong>Date :</strong> ${record.date}</p>
          <p><strong>Gross Amount :</strong> ${record.total}</p>
          <p><strong>Net Amount :</strong> ${record.billamount}</p>
          <p><strong>Payment Status :</strong> ${record.paymentstatus}</p>
        </div>
      </body>
    </html>
  `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const handleDownload = (record) => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Bill Details', 10, 15)
    doc.setFontSize(12)
    doc.text(`Customer: `, 10, 30)
    doc.text(`${record.customername}`, 80, 30)
    doc.text(`Date: `, 10, 40)
    doc.text(`${record.date}`, 80, 40)
    doc.text(`Gross Amount: `, 10, 50)
    doc.text(`${record.total}`, 80, 50)
    doc.text(`Net Amount: `, 10, 60)
    doc.text(`${record.billamount}`, 80, 60)
    doc.text(`Payment Status: `, 10, 70)
    doc.text(`${record.paymentstatus}`, 80, 70)
    doc.save('Bill-'+`${record.createddate}`+'.pdf')
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'createddate',
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
            icon={<UnorderedListOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => showModal(record)}
          />
          <Button
            icon={<DownloadOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => handleDownload(record)}
          />
          <Button icon={<PrinterOutlined />} onClick={() => handlePrint(record)} />
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
      const newHeight = window.innerHeight - 368 // Adjust this value based on your layout needs
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
          <h1 className='font-bold text-base'>Dashboard</h1>
          <span className="flex gap-x-3 justify-center items-center">
            <RangePicker
              onChange={handleDateChange}
              defaultValue={[today, today]}
              format="DD/MM/YYYY"
            />
          </span>
        </li>

        <li className="mt-2">
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
        <li className="mt-4">
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
        </li>

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
    </div>
  )
}
