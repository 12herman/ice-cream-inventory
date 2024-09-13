import React, { useEffect, useState } from 'react'
import {
  Card,
  Button,
  Statistic,
  Table,
  Modal,
  List,
  message,
  Radio,
  Input,
  DatePicker,
  Form,
  Tag
} from 'antd'
import { getCustomerById, getCustomerPayDetailsById } from '../firebase/data-tables/customer'
import { LuFileCog } from 'react-icons/lu'
import { TimestampJs } from '../js-files/time-stamp'
import { addDoc, collection, doc, getDocs, getDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import dayjs from 'dayjs'
const { Search } = Input

export default function BalanceSheet({ datas }) {
  const [data, setData] = useState([])
  const [payForm] = Form.useForm()
  const [deliveryData, setDeliveryData] = useState([])
  const [balanceTbLoading, setBalanceTbLoading] = useState(true)
  const [filteredData, setFilteredData] = useState([])
  const [deliveryList, setDeliveryList] = useState([])
  const [payDetailsList, setPayDetailsList] = useState([])
  const [activeCard, setActiveCard] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [customerPayId, setCustomerPayId] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [refreshTable, setRefreshTable] = useState(false)

  const fetchData = async () => {
    setBalanceTbLoading(true)
    const initialData = await Promise.all(
      datas.customers
        .filter((data) => data.isdeleted === false)
        .map(async (item, index) => {
          const customerDeliveries = (datas.delivery || []).filter(
            (delivery) => delivery.customerid === item.id && !delivery.isdeleted
          )

          const payDetailsResponse = await getCustomerPayDetailsById(item.id)
          let payDetails = []
          if (payDetailsResponse.status === 200) {
            payDetails = payDetailsResponse.paydetails
          }

          const openEntry = payDetails
            .filter((payDetail) => payDetail.description === 'Open')
            .sort(
              (a, b) =>
                dayjs(b.createddate, 'DD/MM/YYYY,HH.mm') - dayjs(a.createddate, 'DD/MM/YYYY,HH.mm')
            )[0]

          const isOpenOrClose = payDetails
            .filter(
              (payDetail) => payDetail.description === 'Open' || payDetail.description === 'Close'
            )
            .sort((a, b) =>
              dayjs(b.createddate, 'DD/MM/YYYY,HH.mm').diff(
                dayjs(a.createddate, 'DD/MM/YYYY,HH.mm')
              )
            )[0]

          const filteredPayDetails = openEntry
            ? [
                openEntry,
                ...payDetails.filter((payDetail) =>
                  dayjs(payDetail.createddate, 'DD/MM/YYYY,HH.mm').isAfter(
                    dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')
                  )
                )
              ]
            : payDetails

          const filteredDeliveries = openEntry
            ? customerDeliveries.filter((delivery) =>
                dayjs(delivery.createddate, 'DD/MM/YYYY,HH.mm').isAfter(
                  dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')
                )
              )
            : customerDeliveries

          const billUnpaid = filteredDeliveries.reduce((acc, item) => {
            if (item.paymentstatus === 'Unpaid') {
              return acc + (Number(item.billamount) || 0)
            } else if (item.paymentstatus === 'Partial') {
              return acc + (Number(item.billamount) - Number(item.partialamount) || 0)
            }
            return acc
          }, 0)

          const totalPayment = filteredPayDetails.reduce((acc, item) => {
            return item.type === 'Balance' ? acc - item.amount : acc + Number(item.amount)
          }, 0)

          const balance = billUnpaid - totalPayment

          return {
            ...item,
            sno: index + 1,
            key: item.id || index,
            balance: balance,
            bookstatus: isOpenOrClose ? isOpenOrClose.description : 'Empty'
          }
        })
    )
    setData(initialData)
    setFilteredData(initialData)
    setBalanceTbLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [refreshTable, datas])

  const reloadTable = () => {
    setRefreshTable((prev) => !prev)
  }

  useEffect(() => {
    const fetchData = async () => {
      setBalanceTbLoading(true)
      const filteredData = await Promise.all(
        datas.delivery
          .filter((data) => !data.isdeleted)
          .map(async (item, index) => {
            const result = await getCustomerById(item.customerid)
            const customerName =
              result.status === 200 ? result.customer.customername : item.customername
            const mobileNumber =
              result.status === 200 ? result.customer.mobilenumber : item.mobilenumber
            return {
              ...item,
              sno: index + 1,
              key: item.id || index,
              customername: customerName,
              mobilenumber: mobileNumber
            }
          })
      )
      setDeliveryData(filteredData)
      setBalanceTbLoading(false)
    }
    fetchData()
  }, [datas])

  // search
  const [searchText, setSearchText] = useState('')
  const onSearchEnter = (value, _e) => {
    setSearchText(value)
  }
  const onSearchChange = (e) => {
    if (e.target.value === '') {
      setSearchText('')
    }
  }

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 50,
      filteredValue: [searchText],
      render: (_, __, index) => index + 1,
      onFilter: (value, record) => {
        return (
          String(record.customername).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobilenumber).toLowerCase().includes(value.toLowerCase()) ||
          String(record.balance).toLowerCase().includes(value.toLowerCase()) ||
          String(record.bookstatus).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Customer',
      dataIndex: 'customername',
      key: 'customername',
      sorter: (a, b) => a.customername.localeCompare(b.customername),
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Mobile',
      dataIndex: 'mobilenumber',
      key: 'mobilenumber'
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => {
        const numericBalance = typeof balance === 'number' ? balance : 0
        return `${numericBalance.toFixed(2)}`
      },
      sorter: (a, b) => a.balance - b.balance
    },
    {
      title: 'Status',
      dataIndex: 'bookstatus',
      key: 'bookstatus',
      width: 80,
      sorter: (a, b) => a.bookstatus.localeCompare(b.bookstatus),
      render: (text) => <Tag color={text === 'Open' ? 'green' : 'red'}>{text}</Tag>
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 70,
      render: (_, record) => (
        <span>
          <Button onClick={() => showPayModel(record)} className="h-[1.7rem]">
            <LuFileCog />
          </Button>
        </span>
      )
    }
  ]

  const showPayModel = async (record) => {
    payForm.resetFields()
    setCustomerPayId(record.id)
    try {
      const payDetailsResponse = await getCustomerPayDetailsById(record.id)
      console.log(payDetailsResponse)
      if (payDetailsResponse.status === 200) {
        const payDetails = payDetailsResponse.paydetails
        const isOpenOrClose = payDetails
          .filter(
            (payDetail) => payDetail.description === 'Open' || payDetail.description === 'Close'
          )
          .sort((a, b) =>
            dayjs(b.createddate, 'DD/MM/YYYY,HH.mm').diff(dayjs(a.createddate, 'DD/MM/YYYY,HH.mm'))
          )[0]
        if (isOpenOrClose) {
          payForm.setFieldsValue({
            description: isOpenOrClose.description === 'Open' ? 'Close' : 'Open'
          })
        } else {
          payForm.setFieldsValue({ description: 'Open' })
        }
      } else {
        console.error(payDetailsResponse.message)
      }
      setIsModalVisible(true)
    } catch (err) {
      console.error('Error fetching pay details:', err)
    }
  }

  const balancesheetPay = async (value) => {
    let { date, ...Datas } = value
    let formateDate = dayjs(date).format('DD/MM/YYYY')
    const payData = { ...Datas, date: formateDate, type: 'Balance', createddate: TimestampJs() }
    try {
      const customerDocRef = doc(db, 'customer', customerPayId)
      const payDetailsRef = collection(customerDocRef, 'paydetails')
      await addDoc(payDetailsRef, payData)
      message.open({ type: 'success', content: 'Book Status Added Successfully' })
      reloadTable()
    } catch (e) {
      console.log(e)
    } finally {
      payForm.resetFields()
      setCustomerPayId(null)
      setIsModalVisible(false)
    }
  }

  const totalSelf = data.filter((item) => item.transport === 'Self').length
  const totalCompany = data.filter((item) => item.transport === 'Company').length
  const totalFreezerBox = data.filter((item) => item.transport === 'Freezer Box').length
  const totalMiniBox = data.filter((item) => item.transport === 'Mini Box').length

  const filterData = (transportType) => {
    const filtered = data.filter((item) => item.transport === transportType)
    setFilteredData(filtered)
  }

  const handleRowClick = async (record) => {
    try {
      const customerResponse = await getCustomerById(record.id)
      if (customerResponse.status === 200) {
        const customerData = customerResponse.customer
        setCustomerName(customerData.customername)
      } else {
        console.error(customerResponse.message)
        return
      }

      const payDetailsResponse = await getCustomerPayDetailsById(record.id)
      if (payDetailsResponse.status === 200) {
        const payDetails = payDetailsResponse.paydetails || []

        const openEntry =
          payDetails
            .filter((payDetail) => payDetail.description === 'Open')
            .sort((a, b) =>
              dayjs(b.createddate, 'DD/MM/YYYY,HH.mm').diff(
                dayjs(a.createddate, 'DD/MM/YYYY,HH.mm')
              )
            )[0] || null

        const closeEntry =
          payDetails
            .filter((payDetail) => payDetail.description === 'Close')
            .sort((a, b) =>
              dayjs(b.createddate, 'DD/MM/YYYY,HH.mm').diff(
                dayjs(a.createddate, 'DD/MM/YYYY,HH.mm')
              )
            )[0] || null

        let filteredPayDetails = []

        if (openEntry) {
          if (closeEntry) {
            const isCloseAfterOpen = dayjs(closeEntry.createddate, 'DD/MM/YYYY,HH.mm').isAfter(
              dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')
            )
            if (isCloseAfterOpen) {
              filteredPayDetails = payDetails.filter((payDetail) => {
                const payDate = dayjs(payDetail.createddate, 'DD/MM/YYYY,HH.mm')
                return (
                  payDate.isAfter(dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')) &&
                  payDate.isBefore(dayjs(closeEntry.createddate, 'DD/MM/YYYY,HH.mm'))
                )
              })
              filteredPayDetails = [openEntry, ...filteredPayDetails, closeEntry]
              filteredPayDetails.sort(
                (a, b) =>
                  dayjs(a.createddate, 'DD/MM/YYYY,HH.mm') -
                  dayjs(b.createddate, 'DD/MM/YYYY,HH.mm')
              )
            } else {
              filteredPayDetails = [
                openEntry,
                ...payDetails.filter((payDetail) =>
                  dayjs(payDetail.createddate, 'DD/MM/YYYY,HH.mm').isAfter(
                    dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')
                  )
                )
              ]
              filteredPayDetails.sort(
                (a, b) =>
                  dayjs(a.createddate, 'DD/MM/YYYY,HH.mm') -
                  dayjs(b.createddate, 'DD/MM/YYYY,HH.mm')
              )
            }
          } else {
            filteredPayDetails = [
              openEntry,
              ...payDetails.filter((payDetail) =>
                dayjs(payDetail.createddate, 'DD/MM/YYYY,HH.mm').isAfter(
                  dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')
                )
              )
            ]
            filteredPayDetails.sort(
              (a, b) =>
                dayjs(a.createddate, 'DD/MM/YYYY,HH.mm') - dayjs(b.createddate, 'DD/MM/YYYY,HH.mm')
            )
          }
        } else {
          filteredPayDetails = [
            ...payDetails.filter((payDetail) =>
              dayjs(payDetail.createddate, 'DD/MM/YYYY,HH.mm').isAfter(
                dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')
              )
            )
          ]
          filteredPayDetails.sort(
            (a, b) =>
              dayjs(a.createddate, 'DD/MM/YYYY,HH.mm') - dayjs(b.createddate, 'DD/MM/YYYY,HH.mm')
          )
        }

        setPayDetailsList(filteredPayDetails)

        const deliveries = deliveryData.filter(
          (delivery) => delivery.customerid === record.id && !delivery.isdeleted
        )

        let filteredDeliveries = [];

        if (openEntry) {
          if (closeEntry) {
            const isCloseAfterOpen = dayjs(closeEntry.createddate, 'DD/MM/YYYY,HH.mm').isAfter(
              dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')
            )
            if (isCloseAfterOpen) {
              filteredDeliveries = deliveries.filter((delivery) => {
                const deliveryDate = dayjs(delivery.createddate, 'DD/MM/YYYY,HH.mm')
                return (
                  deliveryDate.isAfter(dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')) &&
                  deliveryDate.isBefore(dayjs(closeEntry.createddate, 'DD/MM/YYYY,HH.mm'))
                )
              })
              filteredDeliveries.sort((a, b) =>
                dayjs(b.createddate, 'DD/MM/YYYY,HH.mm').diff(
                  dayjs(a.createddate, 'DD/MM/YYYY,HH.mm')
                )
              )
            } else {
              filteredDeliveries = deliveries.filter((delivery) =>
                dayjs(delivery.createddate, 'DD/MM/YYYY,HH.mm').isAfter(
                  dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')
                )
              )
              filteredDeliveries.sort((a, b) =>
                dayjs(b.createddate, 'DD/MM/YYYY,HH.mm').diff(
                  dayjs(a.createddate, 'DD/MM/YYYY,HH.mm')
                )
              )
            }
          } else {
            filteredDeliveries = deliveries.filter((delivery) =>
              dayjs(delivery.createddate, 'DD/MM/YYYY,HH.mm').isAfter(
                dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')
              )
            )
            filteredDeliveries.sort((a, b) =>
              dayjs(b.createddate, 'DD/MM/YYYY,HH.mm').diff(
                dayjs(a.createddate, 'DD/MM/YYYY,HH.mm')
              )
            )
          }
        } else {
          filteredDeliveries = deliveries.filter((delivery) =>
            dayjs(delivery.createddate, 'DD/MM/YYYY,HH.mm').isAfter(dayjs().subtract(1, 'year'))
          )
          filteredDeliveries.sort((a, b) =>
            dayjs(b.createddate, 'DD/MM/YYYY,HH.mm').diff(dayjs(a.createddate, 'DD/MM/YYYY,HH.mm'))
          )
        }
        setDeliveryList(filteredDeliveries)
      } else {
         console.error(payDetailsResponse.message);
      }
    } catch (e) {
      console.log(e)
    }
  }

  const totalOrderAmount = deliveryList
    .filter((product) => product.type === 'order')
    .reduce((total, product) => total + product.total, 0)

  const totalReturnAmount = deliveryList
    .filter((product) => product.type === 'return')
    .reduce((total, product) => total + product.total, 0)

  const totalMRP = deliveryList.reduce((acc, item) => {
    if (item.type === 'return') {
      return acc - (Number(item.total) || 0)
    }
    return acc + (Number(item.total) || 0)
  }, 0)

  const totalBilled = deliveryList.reduce((acc, item) => {
    if (item.type === 'return') {
      return acc - (Number(item.billamount) || 0)
    }
    return acc + (Number(item.billamount) || 0)
  }, 0)

  const billPaid = deliveryList.reduce((acc, item) => {
    if (item.paymentstatus === 'Paid' && item.type === 'order') {
      return acc + (Number(item.billamount) || 0)
    } else if (item.paymentstatus === 'Partial' && item.type === 'order') {
      return acc + (Number(item.partialamount) || 0)
    }
    return acc
  }, 0)

  const billUnpaid = deliveryList.reduce((acc, item) => {
    if (item.paymentstatus === 'Unpaid' && item.type === 'order') {
      return acc + (Number(item.billamount) || 0)
    } else if (item.paymentstatus === 'Partial' && item.type === 'order') {
      return acc + (Number(item.billamount) - Number(item.partialamount) || 0)
    } else if (item.type === 'return') {
      return acc - (Number(item.billamount) || 0)
    }
    return acc
  }, 0)

  const totalPayment = payDetailsList.reduce((acc, item) => {
    return item.type === 'Balance' ? acc - item.amount : acc + Number(item.amount)
  }, 0)

  const handleCardClick = (key) => {
    setActiveCard(key)
    filterData(key)
  }

  const cardsData = [
    { key: 'Self', title: 'Self', value: totalSelf },
    { key: 'Company', title: 'Company', value: totalCompany },
    { key: 'Freezer Box', title: 'Freezer Box', value: totalFreezerBox },
    { key: 'Mini Box', title: 'Mini Box', value: totalMiniBox }
  ]

  // Table Height Auto Adjustment (***Do not touch this code***)
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 200) // Initial height adjustment
  useEffect(() => {
    // Function to calculate and update table height
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 200 // Adjust this value based on your layout needs
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
          <Search
            allowClear
            className="w-[30%]"
            placeholder="Search"
            onSearch={onSearchEnter}
            onChange={onSearchChange}
            enterButton
          />
        </li>
        <li className="card-list mt-2 grid grid-cols-4 gap-x-2 gap-y-2">
          {cardsData.map((card) => {
            const isActive = activeCard === card.key
            return (
              <Card
                key={card.key}
                onClick={() => handleCardClick(card.key)}
                style={{
                  cursor: 'pointer',
                  borderColor: isActive ? '#f26723' : '#aaa',
                  borderWidth: 2,
                  background: isActive ? '#f26723' : '',
                  color: isActive ? '#ffffff' : ''
                }}
              >
                <Statistic
                  title={
                    isActive ? (
                      <span className="text-white font-semibold">{card.title}</span>
                    ) : (
                      <span className="font-semibold">{card.title}</span>
                    )
                  }
                  value={card.value}
                  valueStyle={{
                    color: isActive ? '#ffffff' : '#f26723'
                  }}
                  prefix={card.prefix}
                />
              </Card>
            )
          })}
        </li>
        <li className="flex space-x-2 mt-2">
          <div className="w-1/2 pr-2 border border-gray-300 rounded-lg">
            <Table
              virtual
              pagination={false}
              columns={columns}
              dataSource={filteredData}
              loading={balanceTbLoading}
              rowKey="id"
              scroll={{ y: tableHeight }}
              onRow={(record) => ({
                onClick: () => handleRowClick(record)
              })}
            />
          </div>
          <div className="w-1/2 pl-2 border border-gray-300 rounded-lg p-4">
            <List
              size="small"
              header={
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}
                >
                  <div>Order Details {customerName}</div>
                  <div>Order: {totalOrderAmount.toFixed(2)}</div>
                  <div>Return: {totalReturnAmount.toFixed(2)}</div>
                </div>
              }
              footer={
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}
                >
                  <div>MRP: {totalMRP.toFixed(2)}</div>
                  <div>Billed: {totalBilled.toFixed(2)}</div>
                  <div>Paid: {billPaid.toFixed(2)}</div>
                  <div>Unpaid: {billUnpaid.toFixed(2)}</div>
                </div>
              }
              bordered
              dataSource={deliveryList}
              renderItem={(item) => (
                <List.Item>
                  <div>{item.date}</div>
                  <div>MRP: {item.total}</div>
                  <div>Bill: {item.billamount}</div>
                  <div>
                    {item.paymentstatus === 'Partial' ? (
                      <span>
                        {item.paymentstatus}: {item.partialamount}
                      </span>
                    ) : (
                      <span>{item.paymentstatus}</span>
                    )}
                  </div>
                  <div>{item.type}</div>
                </List.Item>
              )}
              style={{
                maxHeight: `${tableHeight / 2}px`,
                overflowY: 'auto'
              }}
            />
            <List
              className="mt-2"
              size="small"
              header={<div style={{ fontWeight: '600' }}>Payment Details {customerName}</div>}
              footer={
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}
                >
                  <div>Payments: {payDetailsList.length}</div>
                  <div>Total Payment: {totalPayment.toFixed(2)}</div>
                </div>
              }
              bordered
              dataSource={payDetailsList}
              renderItem={(item) => (
                <List.Item>
                  <div>Date: {item.date}</div>
                  <div>
                    {item.type === 'Balance' ? `Balance: ${item.amount}` : `Amount: ${item.amount}`}
                  </div>
                  <div>Reason: {item.description}</div>
                </List.Item>
              )}
              style={{
                maxHeight: `${tableHeight / 2}px`,
                overflowY: 'auto'
              }}
            />
          </div>
        </li>
      </ul>

      <Modal
        title={<div className="flex justify-center">PAYMENT</div>}
        name="bookstatus"
        centered={true}
        open={isModalVisible}
        onOk={() => {
          payForm.submit()
        }}
        onCancel={() => {
          setIsModalVisible(false)
        }}
      >
        <Form
          initialValues={{ date: dayjs() }}
          layout="vertical"
          form={payForm}
          onFinish={balancesheetPay}
        >
          <Form.Item
            className=" absolute top-[0.75rem]"
            name="date"
            label=""
            rules={[{ required: true, message: false }]}
          >
            <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Book Status"
            rules={[{ required: true, message: false }]}
          >
            <Radio.Group
              buttonStyle="solid"
              disabled
              style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
            >
              <Radio.Button value="Open" style={{ width: '50%' }}>
                OPEN
              </Radio.Button>
              <Radio.Button value="Close" style={{ width: '50%' }}>
                CLOSE
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            className="mt-2"
            name="amount"
            label="Book Balance"
            rules={[{ required: true, message: false }]}
          >
            <Input type="number" min={0} placeholder="Enter Amount" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
