import React, { useEffect, useState } from 'react'
import { Card, Button, Statistic, Table, Timeline, List } from 'antd'
import { PiExport } from 'react-icons/pi'
import { getCustomerById } from '../firebase/data-tables/customer'
import { RiFileCloseLine } from 'react-icons/ri'
import { MdOutlinePendingActions } from 'react-icons/md'

export default function BalanceSheet({ datas, balanceSheetUpdateMt }) {
  const [data, setData] = useState([])
  const [deliveryData, setDeliveryData] = useState([])
  const [balanceTbLoading, setBalanceTbLoading] = useState(true)
  const [filteredData, setFilteredData] = useState([])
  const [deliveryList, setDeliveryList] = useState([])
  const [activeCard, setActiveCard] = useState(null)

  useEffect(() => {
    const filteredData = datas.customers
      .filter((data) => data.isdeleted === false)
      .map((item, index) => {
        const customerDeliveries = (datas.delivery || []).filter(
          (delivery) => delivery.customerid === item.id && !delivery.isdeleted
        )
        const balance = customerDeliveries.reduce(
          (acc, delivery) => acc + (Number(delivery.billamount) || 0),
          0
        )
        return {
          ...item,
          sno: index + 1,
          key: item.id || index,
          balance: balance
        }
      })

    setData(filteredData)
    setFilteredData(filteredData)
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
      console.log(filteredData)
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
      width: 120,
      render: (_, render) => (
        <span>
          <Button>
            <MdOutlinePendingActions />
          </Button>
          <Button className="mx-1">
            <RiFileCloseLine />
          </Button>
        </span>
      )
    }
  ]

  const totalSelf = data.filter((item) => item.transport === 'Self').length
  const totalCompany = data.filter((item) => item.transport === 'Company').length
  const totalFreezerBox = data.filter((item) => item.transport === 'Freezer Box').length
  const totalMiniBox = data.filter((item) => item.transport === 'Mini Box').length

  const filterData = (transportType) => {
    const filtered = data.filter((item) => item.transport === transportType)
    setFilteredData(filtered)
  }

  const handleRowClick = (record) => {
    const deliveries = deliveryData.filter((delivery) => delivery.customerid === record.id && !delivery.isdeleted)
    setDeliveryList(deliveries)
  }

  const totalBalance = deliveryList.reduce((acc, item) => acc + (Number(item.billamount) || 0), 0);

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

  return (
    <div>
      <ul>
        <li className="flex gap-x-3 items-center justify-end">
          <Button>
            Export <PiExport />
          </Button>
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
                      <span className="text-white">{card.title}</span>
                    ) : (
                      <span>{card.title}</span>
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
              onRow={(record) => ({
                onClick: () => handleRowClick(record)
              })}
            />
          </div>
          <div className="w-1/2 pl-2 border border-gray-300 rounded-lg p-4">
          <List
              size="small"
              header={<div>Delivery List</div>}
              footer={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>Total Deliveries: {deliveryList.length}</div>
                <div>Total Balance: ${totalBalance.toFixed(2)}</div>
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
              />
          </div>
        </li>
      </ul>
    </div>
  )
}
