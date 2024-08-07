import React, { useState, useEffect } from 'react'
import { Input, Button, Table, Segmented, Modal, Form, InputNumber } from 'antd'
import { IoMdAlarm } from 'react-icons/io'
import { LuMilk, LuIceCream } from 'react-icons/lu'
const { Search } = Input

export default function Storage({ datas }) {
  const [form] = Form.useForm()
  const [data, setData] = useState([])
  const [selectedSegment, setSelectedSegment] = useState('Material List')
  const [isModalVisible, setIsModalVisible] = useState(false)

  useEffect(() => {
    const rawData = selectedSegment === 'Material List' 
      ? datas.rawmaterials.filter(data => !data.isdeleted).map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
      : datas.productions.filter(data => !data.isdeleted).map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
    setData(rawData)
  }, [datas, selectedSegment])

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

  const setAlert = (values) => {
    // await createRawmaterial({
    //   ...values,
    //   createddate: TimestampJs(),
    //   isdeleted: false
    // })
    console.log(values)
    form.resetFields()
    setIsModalVisible(false)
  }

  const showModal = (record) => {
    form.setFieldsValue({
      materialname: record.materialname || 'N/A',
      productname: record.productname || 'N/A',
      flavour: record.flavour || 'N/A',
      quantity: record.quantity || 'N/A',
      alertcount: undefined,
    });
    setIsModalVisible(true)
  }

  const onSegmentChange = (value) => {
    setSelectedSegment(value)
    setSearchText('')
  }

  const materialColumns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.sno).toLowerCase().includes(value.toLowerCase()) ||
          String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Material',
      dataIndex: 'materialname',
      key: 'materialname'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_, record) => {
        return record.quantity + record.unit
      }
    },
    {
      title: 'Action',
      dataIndex: 'address',
      key: 'address',
      render: (_, record) => (
        <Button onClick={() => showModal(record)}>
          <IoMdAlarm />
        </Button>
      ),
    }
  ]

  const productColumns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.sno).toLowerCase().includes(value.toLowerCase()) ||
          String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Product',
      dataIndex: 'productname',
      key: 'productname'
    },
    {
      title: 'Flavor',
      dataIndex: 'flavour',
      key: 'flavour'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Packs',
      dataIndex: 'numberofpacks',
      key: 'numberofpacks'
    },
    {
      title: 'Action',
      dataIndex: 'address',
      key: 'address',
      render: (_, record) => (
        <Button onClick={() => showModal(record)}>
          <IoMdAlarm />
        </Button>
      ),
    }
  ]

  const columns = selectedSegment === 'Material List' ? materialColumns : productColumns

  return (
    <div>
      <ul>
        <li className="flex gap-x-3 justify-between items-center">
          <Search placeholder="Search" className="w-[40%]" onSearch={onSearchEnter} onChange={onSearchChange} enterButton />
          <span className="flex gap-x-3 justify-center items-center">
            <Segmented
              options={[
                {
                  label: (
                    <div
                      style={{
                        padding: 5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <LuMilk />
                      <span>Material List</span>
                    </div>),
                  value: 'Material List',
                },
                {
                  label: (
                    <div
                      style={{
                        padding: 5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <LuIceCream />
                      <span>Material List</span>
                    </div>),
                  value: 'Product List',
                }
              ]}
              onChange={onSegmentChange}
              value={selectedSegment}
            />
          </span>
        </li>
        <li className="mt-2">
          <Table dataSource={data} columns={columns} loading={data.length === 0} pagination={false} />;
        </li>
      </ul>

      <Modal title="Set Alert" open={isModalVisible} onOk={() => form.submit()} onCancel={() => setIsModalVisible(false)}>
        <Form onFinish={setAlert} form={form} layout="vertical">
          {selectedSegment === 'Material List' && (
            <>
              <Form.Item name="materialname" label="Material">
                <Input disabled />
              </Form.Item>
              <Form.Item name="alertcount" label="Alert Count" rules={[{ required: true }]}>
                <InputNumber className="w-full" />
              </Form.Item>
            </>
          )}
          {selectedSegment === 'Product List' && (
            <>
              <Form.Item name="productname" label="Product">
                <Input disabled />
              </Form.Item>
              <Form.Item name="flavour" label="Flavor">
                <Input disabled />
              </Form.Item>
              <Form.Item name="quantity" label="Quantity">
                <Input disabled />
              </Form.Item>
              <Form.Item name="alertcount" label="Alert Count" rules={[{ required: true }]}>
                <InputNumber className="w-full" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

    </div>
  )
}
