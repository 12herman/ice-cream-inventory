import React, { useState, useEffect } from 'react'
import { Input, Button, Table, Segmented, Modal, Form, InputNumber } from 'antd'
import { IoMdAlarm } from 'react-icons/io'
import { LuMilk, LuIceCream } from 'react-icons/lu'
import { TimestampJs } from '../js-files/time-stamp';
import { createStorage, updateStorage } from '../firebase/data-tables/storage';
const { Search } = Input

export default function Storage({ datas, storageUpdateMt }) {
  const [form] = Form.useForm()
  const [data, setData] = useState([])
  const [selectedSegment, setSelectedSegment] = useState('Material List')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState(null)

  useEffect(() => {
    const rawData = datas.storage.filter(data => data.category === selectedSegment);
    setData(rawData);
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

  const setAlert = async (values) => {
    if(editingRecordId){
    await updateStorage(editingRecordId, {
      alertcount: values.alertcount,
      updateddate: TimestampJs()
    });
  }
  console.log(values);
  form.resetFields();
  storageUpdateMt();
  setEditingRecordId(null);
  setIsModalVisible(false);
  }

  const showModal = (record) => {
    form.setFieldsValue({
      materialname: record.materialname || 'N/A',
      productname: record.productname || 'N/A',
      flavour: record.flavour || 'N/A',
      quantity: record.quantity || 'N/A',
      alertcount: record.alertcount || undefined,
    });
    setEditingRecordId(record.id)
    setIsModalVisible(true)
    console.log(record.id);
  }

  const onSegmentChange = (value) => {
    setSelectedSegment(value)
    setSearchText('')
  }

  const materialColumns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Material',
      dataIndex: 'materialname',
      key: 'materialname',
      sorter: (a, b) => a.materialname.localeCompare(b.materialname),
      showSorterTooltip: {target: 'sorter-icon'},
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed:'right',
      width:110,
      render: (_, record) => (
        <Button onClick={() => showModal(record)} style={{ color: record.quantity < record.alertcount ? 'red' : 'default' }}>
          <IoMdAlarm />
        </Button>
      ),
    }
  ]

  const productColumns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.productname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.flavour).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase()) ||
          String(record.numberofpacks).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Product',
      dataIndex: 'productname',
      key: 'productname',
      sorter: (a, b) => a.productname.localeCompare(b.productname),
      showSorterTooltip: {target: 'sorter-icon'},
    },
    {
      title: 'Flavor',
      dataIndex: 'flavour',
      key: 'flavour',
      sorter: (a, b) => a.flavour.localeCompare(b.flavour),
      showSorterTooltip: {target: 'sorter-icon'},
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Packs',
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      sorter: (a, b) => (Number(a.numberofpacks) || 0) - (Number(b.numberofpacks) || 0),
      showSorterTooltip: {target: 'sorter-icon'},
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed:'right',
      width:110,
      render: (_, record) => (
        <Button onClick={() => showModal(record)} style={{ color: record.numberofpacks < record.alertcount ? 'red' : 'default' }}>
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
                      <span>Product List</span>
                    </div>),
                  value: 'Product List',
                }
              ]}
              onChange={onSegmentChange}
              value={selectedSegment}
            />

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
