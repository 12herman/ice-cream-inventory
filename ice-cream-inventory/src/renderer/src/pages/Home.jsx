import React from 'react';
import { NotificationOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, DatePicker, Badge, Table } from 'antd';
import { FaRupeeSign } from "react-icons/fa";
import { IoPerson } from "react-icons/io5";
const { RangePicker } = DatePicker;

export default function Home() {

  const dataSource = [
    {
      key: '1',
      date: '30/05/2024',
      product: 'Milk',
      name: 'Mike',
      amount: 3200,
      action: 'print',
    },
    {
      key: '2',
      date: '03/06/2024',
      product: 'Sugar',
      name: 'John',
      amount: 420,
      action: 'print',
    },
  ];
  
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    }
  ];

  return (
    <div>
      <ul>
        <li className='flex gap-x-3 justify-between items-center'>
          <h1>Dashboard</h1>
          <span className='flex gap-x-3 justify-center items-center'>
          <RangePicker />
          <Badge dot>
      <NotificationOutlined
        style={{
          fontSize: 16,
        }}
      />
    </Badge>
          </span>
        </li>

        <li className='mt-2'>
      <Row gutter={16}>
    <Col span={6}>
      <Card bordered={false}>
        <Statistic
          title="Total Sales"
          value={8042}
          precision={2}
          valueStyle={{
            color: '#3f8600',
          }}
          prefix={<FaRupeeSign  />}
        />
      </Card>
    </Col>
    <Col span={6}>
      <Card bordered={false}>
        <Statistic
          title="Total Spending"
          value={2980}
          precision={2}
          valueStyle={{
            color: '#cf1322',
          }}
          prefix={<FaRupeeSign />}
        />
      </Card>
    </Col>
    <Col span={6}>
      <Card bordered={false}>
        <Statistic
          title="Total Profit"
          value={5062}
          precision={2}
          valueStyle={{
            color: '#3f8600',
          }}
          prefix={<FaRupeeSign />}
        />
      </Card>
    </Col>
    <Col span={6}>
      <Card bordered={false}>
        <Statistic
          title="Total Customer"
          value={25}
          valueStyle={{
            color: '#3f8600',
          }}
          prefix={<IoPerson />}
        />
      </Card>
    </Col>
  </Row>
  </li>

  <li className='mt-2'>
  <Table dataSource={dataSource} columns={columns} pagination={false} />;
  </li>

  </ul>
  </div>
  )
}
