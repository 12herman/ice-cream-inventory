import React, { useState, useEffect } from 'react';
import { NotificationOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, DatePicker, Badge, Table, Button } from 'antd';
import { FaRupeeSign } from "react-icons/fa";
import { IoPerson } from "react-icons/io5";
const { RangePicker } = DatePicker;
import dayjs from 'dayjs';

export default function Home({ datas }) {
  const [dateRange, setDateRange] = useState([null, null]);
  const [filteredDelivery, setFilteredDelivery] = useState([]);
  const [filteredRawmaterials, setFilteredRawmaterials] = useState([]);

  useEffect(() => {
    const isWithinRange = (date) => {
      if (!dateRange[0] || !dateRange[1]) {
        return true;
      }
      const dayjsDate = dayjs(date, 'DD/MM/YYYY');
      return dayjsDate.isAfter(dayjs(dateRange[0])) && dayjsDate.isBefore(dayjs(dateRange[1]));
    };

    const newFilteredDelivery = datas.delivery.filter((product) => isWithinRange(product.createddate));
    setFilteredDelivery(newFilteredDelivery);

    const newFilteredRawmaterials = datas.rawmaterials.filter((material) => isWithinRange(material.createddate));
    setFilteredRawmaterials(newFilteredRawmaterials);
  }, [dateRange, datas.delivery, datas.rawmaterials]);

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const totalSales = filteredDelivery.reduce((total, product) => total + product.price, 0);
  const totalSpend = filteredRawmaterials.reduce((total, material) => total + material.price, 0);
  const totalProfit = totalSales - totalSpend;
  const totalCustomers = filteredDelivery.length;

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
          <RangePicker onChange={handleDateChange} />
          <Button>
          <Badge dot>
      <NotificationOutlined
        style={{
          fontSize: 16,
        }}
      />
    </Badge>
    </Button>
          </span>
        </li>

        <li className='mt-2'>
      <Row gutter={16}>
    <Col span={6}>
      <Card bordered={false}>
        <Statistic
          title="Total Sales"
          value={totalSales}
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
          value={totalSpend}
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
          value={totalProfit}
          precision={2}
          valueStyle={{
            color: totalProfit > 0 ? '#3f8600' : '#cf1322',
          }}
          prefix={<FaRupeeSign />}
        />
      </Card>
    </Col>
    <Col span={6}>
      <Card bordered={false}>
        <Statistic
          title="Total Customer"
          value={totalCustomers}
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
