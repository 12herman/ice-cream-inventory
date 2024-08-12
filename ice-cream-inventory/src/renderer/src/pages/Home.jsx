import React, { useState, useEffect } from 'react';
import { NotificationOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, DatePicker, Badge, Table, Button } from 'antd';
import { FaRupeeSign } from "react-icons/fa";
import { IoPerson } from "react-icons/io5";
import { DatestampJs } from '../js-files/date-stamp';
const { RangePicker } = DatePicker;
import dayjs from 'dayjs';

export default function Home({ datas }) {
  const today = dayjs(DatestampJs(), 'DD-MM-YYYY');
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState([today, today]);
  const [filteredDelivery, setFilteredDelivery] = useState([]);
  const [filteredRawmaterials, setFilteredRawmaterials] = useState([]);

  useEffect(() => {
    setData(
      datas.delivery
        .filter((data) => data.isdeleted === false)
        .map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
    )
  }, [datas])

  useEffect(() => {
    const isWithinRange = (date) => {
      if (!dateRange[0] || !dateRange[1]) {
        return true;
      }
      const dayjsDate = dayjs(date, 'DD/MM/YYYY');
      return (
        dayjsDate.isSame(dateRange[0], 'day') ||
        dayjsDate.isSame(dateRange[1], 'day') ||
        dayjsDate.isAfter(dayjs(dateRange[0])) && dayjsDate.isBefore(dayjs(dateRange[1]))
      );
    };

    const newFilteredDelivery = datas.delivery.filter((product) => isWithinRange(product.date));
    setFilteredDelivery(newFilteredDelivery);

    const newFilteredRawmaterials = datas.rawmaterials.filter((material) => isWithinRange(material.date));
    setFilteredRawmaterials(newFilteredRawmaterials);
  }, [dateRange, datas.delivery, datas.rawmaterials]);

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const totalSales = filteredDelivery.reduce((total, product) => total + product.price, 0);
  const totalSpend = filteredRawmaterials.reduce((total, material) => total + material.price, 0);
  const totalProfit = totalSales - totalSpend;
  const totalCustomers = filteredDelivery.length;
  
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Customer',
      dataIndex: 'customername',
      key: 'customername',
    },
    {
      title: 'Gross Amount',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: 'Margin(%)',
      dataIndex: 'margin',
      key: 'margin',
    },
    {
      title: 'Net Amount',
      dataIndex: 'billamount',
      key: 'billamount',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 120,
      render: (_, record) => (
        <span>
          <Button icon={<DownloadOutlined />} style={{ marginRight: 8 }} />
          <Button icon={<PrinterOutlined />} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <ul>
        <li className='flex gap-x-3 justify-between items-center'>
          <h1>Dashboard</h1>
          <span className='flex gap-x-3 justify-center items-center'>
          <RangePicker onChange={handleDateChange}  defaultValue={[ today , today]} format='DD-MM-YYYY' />
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
  <Table dataSource={data} columns={columns} pagination={false}  
      expandable={{
        expandedRowRender: (record) => (
          <p>
            {record.billamount}
          </p>
        ),
          defaultExpandedRowKeys: ['0'],
        }}
        />;
  </li>

  </ul>
  </div>
  )
}
