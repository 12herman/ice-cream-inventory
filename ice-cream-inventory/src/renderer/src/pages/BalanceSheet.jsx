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
  Form
} from 'antd'
import { getCustomerById } from '../firebase/data-tables/customer'
import { LuFileCog } from 'react-icons/lu'
import { TimestampJs } from '../js-files/time-stamp'
import { addDoc, collection, doc, getDocs, getDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import dayjs from 'dayjs'

export default function BalanceSheet({ datas, balanceSheetUpdateMt }) {
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

  useEffect(() => {
    const calculateBalance = async () => {
      const filteredData = await Promise.all(
        datas.customers
          .filter((data) => data.isdeleted === false)
          .map(async (item, index) => {
            const customerDeliveries = (datas.delivery || []).filter(
              (delivery) => delivery.customerid === item.id && !delivery.isdeleted
            )
            const customerDocRef = doc(db, 'customer', item.id)
            const payDetailsRef = collection(customerDocRef, 'paydetails')
            const payDetailsSnapshot = await getDocs(payDetailsRef)
            const payDetails = payDetailsSnapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id
            }))
            const openEntry = payDetails
              .filter((payDetail) => payDetail.description === 'Open')
              .sort(
                (a, b) =>
                  dayjs(b.createddate, 'DD/MM/YYYY,HH.mm') -
                  dayjs(a.createddate, 'DD/MM/YYYY,HH.mm')
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
            const totalBilled = filteredDeliveries.reduce(
              (acc, item) => acc + (Number(item.billamount) || 0),
              0
            )
            const totalPayment = filteredPayDetails.reduce(
              (acc, item) => acc + (Number(item.amount) || 0),
              0
            )
            const balance = totalBilled - totalPayment
            return {
              ...item,
              sno: index + 1,
              key: item.id || index,
              balance: balance
            }
          })
      )
      setData(filteredData)
      setFilteredData(filteredData)
    }
    calculateBalance()
  }, [datas])

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

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 50,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Customer',
      dataIndex: 'customername',
      key: 'customername'
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
        return `$${numericBalance.toFixed(2)}`
      }
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 70,
      render: (_, record) => (
        <span>
          <Button onClick={() => showPayModel(record)}>
            <LuFileCog />
          </Button>
        </span>
      )
    }
  ]

  const showPayModel = async (record) => {
    payForm.resetFields()
    setCustomerPayId(record.id)
    const customerDocRef = doc(db, 'customer', record.id)
            const payDetailsRef = collection(customerDocRef, 'paydetails')
            const payDetailsSnapshot = await getDocs(payDetailsRef)
            const payDetails = payDetailsSnapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id
            }))
    const isOpenOrClose = payDetails
      .filter((payDetail) => payDetail.description === 'Open' || payDetail.description === 'Close')
      .sort((a, b) =>
        dayjs(b.createddate, 'DD/MM/YYYY,HH.mm').diff(dayjs(a.createddate, 'DD/MM/YYYY,HH.mm'))
      )[0]
    payForm.setFieldsValue({
      description: isOpenOrClose.description === 'Open' ? 'Close' : 'Open'
    })
    setIsModalVisible(true)
  }

  const balancesheetPay = async (value) => {
    let { date, ...Datas } = value
    let formateDate = dayjs(date).format('DD/MM/YYYY')
    const payData = { ...Datas, date: formateDate, createddate: TimestampJs() }
    try {
      const customerDocRef = doc(db, 'customer', customerPayId)
      const payDetailsRef = collection(customerDocRef, 'paydetails')
      await addDoc(payDetailsRef, payData)
      message.open({ type: 'success', content: 'Book Status Added Successfully' })
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
      const customerDocRef = doc(db, 'customer', record.id)
      const customerDoc = await getDoc(customerDocRef)
      if (customerDoc.exists()) {
        const customerData = customerDoc.data()
        setCustomerName(customerData.customername)
      }
      const payDetailsRef = collection(customerDocRef, 'paydetails')
      const payDetailsSnapshot = await getDocs(payDetailsRef)
      const payDetails = payDetailsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      }))

      const openEntry = payDetails
        .filter((payDetail) => payDetail.description === 'Open')
        .sort(
          (a, b) =>
            dayjs(b.createddate, 'DD/MM/YYYY,HH.mm') - dayjs(a.createddate, 'DD/MM/YYYY,HH.mm')
        )[0]
      let filteredPayDetails = []

      if (openEntry) {
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

      setPayDetailsList(filteredPayDetails)

      const deliveries = deliveryData.filter(
        (delivery) => delivery.customerid === record.id && !delivery.isdeleted
      )
      if (openEntry) {
        const filteredDeliveries = deliveries.filter((delivery) =>
          dayjs(delivery.createddate, 'DD/MM/YYYY,HH.mm').isAfter(
            dayjs(openEntry.createddate, 'DD/MM/YYYY,HH.mm')
          )
        )
        filteredDeliveries.sort(
          (a, b) =>
            dayjs(b.createddate, 'DD/MM/YYYY,HH.mm') - dayjs(a.createddate, 'DD/MM/YYYY,HH.mm')
        )
        setDeliveryList(filteredDeliveries)
      } else {
        setDeliveryList([])
      }
    } catch (e) {
      console.log(e)
    }
  }

  const totalBilled = deliveryList.reduce((acc, item) => acc + (Number(item.billamount) || 0), 0)

  const billPaid = deliveryList.reduce((acc, item) => {
    if (item.paymentstatus === 'Paid') {
      return acc + (Number(item.total) || 0)
    } else if (item.paymentstatus === 'Partial') {
      return acc + (Number(item.partialamount) || 0)
    }
    return acc
  }, 0)

  const totalPayment = payDetailsList.reduce((acc, item) => acc + (Number(item.amount) || 0), 0)

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
      const newHeight = window.innerHeight - 100 // Adjust this value based on your layout needs
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
              header={<div style={{ fontWeight: '600' }}>Order Details - {customerName}</div>}
              footer={
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}
                >
                  <div>Orders: {deliveryList.length}</div>
                  <div>Total Billed: ${totalBilled.toFixed(2)}</div>
                  <div>Total Paid: ${billPaid.toFixed(2)}</div>
                </div>
              }
              bordered
              dataSource={deliveryList}
              renderItem={(item) => (
                <List.Item>
                  <div>Date: {item.date}</div>
                  <div>MRP: ${item.total}</div>
                  <div>Bill: ${item.billamount}</div>
                  <div>Partial: ${item.partialamount}</div>
                  <div>Status: {item.paymentstatus}</div>
                </List.Item>
              )}
              style={{
                maxHeight: '40vh',
                overflowY: 'auto'
              }}
            />
            <List
              className="mt-2"
              size="small"
              header={<div style={{ fontWeight: '600' }}>Payment Details - {customerName}</div>}
              footer={
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}
                >
                  <div>Payments: {payDetailsList.length}</div>
                  <div>Total Payment: ${totalPayment.toFixed(2)}</div>
                </div>
              }
              bordered
              dataSource={payDetailsList}
              renderItem={(item) => (
                <List.Item>
                  <div>Date: {item.date}</div>
                  <div>Amount: ${item.amount}</div>
                  <div>Reason: {item.description}</div>
                </List.Item>
              )}
              style={{
                maxHeight: '40vh',
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
